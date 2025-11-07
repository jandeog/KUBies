import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = `
You are an AI assistant that enriches supplier or subcontractor information.
Known fields: ${JSON.stringify(body.known)}
Missing fields: ${JSON.stringify(body.missing)}

Search the public web conceptually (no private data) and return a JSON object
filling as many missing fields as possible:
{
  "company": "...",
  "first_name": "...",
  "last_name": "...",
  "title": "...",
  "email": "...",
  "phone": "...",
  "address": "...",
  "website": "..."
}
Return only JSON.  If nothing new found, return {"message": "no extra information found"}.
`;

    const model = gemini.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent([{ text: prompt }]);

    let text = result?.response?.text?.() || "";
    text = text.replace(/```json/i, "").replace(/```/g, "").trim();
    const jsonStart = text.indexOf("{");
    if (jsonStart > 0) text = text.slice(jsonStart);

    const parsed = JSON.parse(text);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("HeuristicSearch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
