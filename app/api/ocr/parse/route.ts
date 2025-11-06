import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- Vision fallback (kept the same) ---
async function callVisionFallback(base64: string) {
  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            imageContext: { languageHints: ["el", "en"] },
          },
        ],
      }),
    }
  );

  const data = await res.json();
  const text =
    data?.responses?.[0]?.fullTextAnnotation?.text ||
    data?.responses?.[0]?.textAnnotations?.[0]?.description ||
    "";

  return { source: "vision", text };
}

// --- Main route ---
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "Missing image" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    // --- Primary: Gemini 1.5 Flash ---
    try {
      const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });


      const result = await model.generateContent([
        {
          text: "Extract business card data as structured JSON with these fields: company, first_name, last_name, title, email, phones, address, website. Respond with valid JSON only.",
        },
        { inlineData: { mimeType: "image/jpeg", data: base64 } },
      ]);

      const text = result.response.text();
      const parsed = JSON.parse(text);
      return NextResponse.json({ source: "gemini", ...parsed });
    } catch (geminiErr) {
      console.error("Gemini error:", geminiErr);
      console.log("→ Falling back to Vision API...");
      const fallback = await callVisionFallback(base64);
      return NextResponse.json(fallback);
    }
  } catch (err: any) {
    console.error("AI OCR error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
