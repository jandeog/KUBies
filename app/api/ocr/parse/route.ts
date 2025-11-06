import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VISION_LIMIT = 50; // 👈 monthly cap

// --- check + increment Vision usage ---
async function checkVisionQuota() {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // read current counter
  const { data: existing, error: selError } = await supabase
    .from("api_usage")
    .select("*")
    .eq("month", monthKey)
    .maybeSingle();

  if (selError) throw selError;

  if (existing && existing.count >= VISION_LIMIT) {
    console.warn("⚠️ Vision API monthly limit reached");
    return false;
  }

  // increment or insert
  if (existing) {
    await supabase
      .from("api_usage")
      .update({ count: existing.count + 1 })
      .eq("month", monthKey);
  } else {
    await supabase.from("api_usage").insert({ month: monthKey, count: 1 });
  }

  return true;
}

// --- Vision fallback helper ---
async function callVisionFallback(base64: string) {
  // ✅ check quota first
  const allowed = await checkVisionQuota();
  if (!allowed) {
    return {
      source: "vision-blocked",
      error: "Vision API monthly limit reached (50).",
    };
  }

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

// --- main POST handler (Gemini first, Vision fallback) ---
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file)
      return NextResponse.json({ error: "Missing image" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    try {
      const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent([
        {
          text: `Extract business card data (company, first_name, last_name, title, email, phones, address, website).
Return raw JSON only.`,
        },
        { inlineData: { mimeType: "image/jpeg", data: base64 } },
      ]);

      const text = result?.response?.text?.() || "";
      if (!text.trim()) throw new Error("Empty Gemini response");

      let cleaned = text
        .replace(/```json/i, "")
        .replace(/```/g, "")
        .trim();

      const jsonStart = cleaned.indexOf("{");
      if (jsonStart > 0) cleaned = cleaned.slice(jsonStart);

      const parsed = JSON.parse(cleaned);
      return NextResponse.json({ source: "gemini", ...parsed });
    } catch (err) {
      console.error("Gemini failed, switching to Vision:", err);
      const fallback = await callVisionFallback(base64);
      return NextResponse.json(fallback);
    }
  } catch (err: any) {
    console.error("AI OCR route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
