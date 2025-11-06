import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "Missing image" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

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

    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`Vision API error: ${errTxt}`);
    }

    const data = await res.json();
    const text =
      data?.responses?.[0]?.fullTextAnnotation?.text ||
      data?.responses?.[0]?.textAnnotations?.[0]?.description ||
      "";

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Google Vision OCR error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
