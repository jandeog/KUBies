import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    // 👇 Cast σε any ώστε να αγνοηθούν οι περιοριστικοί τύποι
    const completion = await (openai as any).chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "Είσαι OCR parser για επαγγελματικές κάρτες και πινακίδες. Επιστρέφεις JSON με πεδία company, first_name, last_name, title, email, phones, address, website.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Ανάλυσε την παρακάτω εικόνα και επέστρεψε τα στοιχεία ως JSON.",
            },
            {
              type: "image_url",
              image_url: `data:image/jpeg;base64,${base64}`,
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    return NextResponse.json(JSON.parse(content || "{}"));
  } catch (err: any) {
    console.error("AI OCR error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
