import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Initialize Gemini client ---
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- Vision fallback helper ---
async function callVisionFallback(base64: string) {
  try {
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
  } catch (err: any) {
    console.error("Vision fallback error:", err);
    return { source: "vision", text: "" };
  }
}

// --- Main route ---
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    // --- Primary: Gemini 2.5 Flash ---
    try {
      console.log("🔹 Using Gemini 2.5 Flash for OCR parsing...");
      const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent([
        {
          text: `Extract all visible business card fields:
          company, first_name, last_name, title, email, phones, address, website.
          Return **raw JSON only** (no markdown, no commentary).`,
        },
        { inlineData: { mimeType: "image/jpeg", data: base64 } },
      ]);

      const text = result?.response?.text?.() || "";

      // If Gemini returned nothing → fallback
      if (!text.trim()) {
        console.warn("⚠️ Gemini returned empty output — using Vision fallback.");
        const fallback = await callVisionFallback(base64);
        return NextResponse.json(fallback);
      }

      // --- Clean Gemini output ---
      let cleaned = text.trim()
        .replace(/```json/i, "")
        .replace(/```/g, "")
        .trim();

      const jsonStart = cleaned.indexOf("{");
      if (jsonStart > 0) cleaned = cleaned.slice(jsonStart);

      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch (err) {
        console.error("⚠️ Failed to parse Gemini output:", cleaned);
        const fallback = await callVisionFallback(base64);
        return NextResponse.json(fallback);
      }

      console.log("✅ Gemini parsing successful.");
      return NextResponse.json({ source: "gemini", ...parsed });
    } catch (geminiErr) {
      console.error("Gemini error:", geminiErr);
      console.log("→ Falling back to Vision API...");
      const fallback = await callVisionFallback(base64);
      return NextResponse.json(fallback);
    }
  } catch (err: any) {
    console.error("AI OCR route error:", err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
