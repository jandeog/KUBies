"use client";
import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { Camera, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "gallery" | "camera";
type OCRResult = {
  text: string;
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
  address?: string;
};

export default function OCRLauncher({
  mode = "gallery",
  onResult,
}: {
  mode?: Mode;
  onResult?: (r: OCRResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = () => {
    if (inputRef.current) inputRef.current.click();
  };

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    try {
      // Χρησιμοποιούμε cast για να περάσουμε whitelist χωρίς TS error
      const { data } = await (Tesseract as any).recognize(file, "ell+eng", {
        logger: (m: any) => console.log(m),
        tessedit_char_whitelist:
          "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩΆΈΉΊΌΎΏabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@.-,+() ",
      });

      const rawText: string = data.text || "";
      console.log("OCR raw text:", rawText);

      // Καθαρισμός κειμένου
      const text = rawText.replace(/\s+/g, " ").trim();

      // --- Smart parsing ---
      const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
      const phoneMatch = text.match(/(\+?\d[\d\s\-]{7,}\d)/)?.[0];

      const lines: string[] = rawText
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l && l.length > 2);

      let company: string = lines[0] || "";
      let name: string | null = null;
      let address: string | null = null;

      // Εύρεση πιθανού ονόματος
      for (const l of lines.slice(0, 6)) {
        if (!l.includes("@") && !/\d/.test(l) && /[Α-Ωα-ω]/.test(l) && l.split(" ").length <= 3) {
          name = l;
          break;
        }
      }

      // Εύρεση πιθανής διεύθυνσης
      for (const l of lines) {
        if (/(ΟΔΟΣ|ODOS|ΟΔΟY|Str|Street|Λεωφόρος|Λεωφ|Οδός|Αγίου|Αγ|ΤΚ|TK|[0-9]+)/i.test(l)) {
          address = l;
          break;
        }
      }

      const result: OCRResult = {
        text,
        email: emailMatch ?? undefined,
        phone: phoneMatch ?? undefined,
        name: name ?? undefined,
        company: company ?? undefined,
        address: address ?? undefined,
      };

      console.log("Parsed OCR result:", result);
      onResult?.(result);
    } catch (err) {
      console.error(err);
      alert("OCR failed. Check console for details.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={mode === "camera" ? "environment" : undefined}
        style={{ display: "none" }}
        onChange={handleFile}
      />
      <Button
        onClick={handleSelect}
        size="sm"
        variant="outline"
        title={mode === "camera" ? "Camera" : "Gallery"}
      >
        {loading ? "..." : mode === "camera" ? <Camera size={16} /> : <Image size={16} />}
      </Button>
    </>
  );
}
