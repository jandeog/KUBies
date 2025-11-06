"use client";
import React, { useRef, useState } from "react";
import { Camera, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "gallery" | "camera";
type OCRResult = {
  text: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
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

  const handleSelect = () => inputRef.current?.click();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/ocr/parse", { method: "POST", body: formData });
      if (!res.ok) throw new Error("OCR failed");

      const { text } = await res.json();

      // Basic AI-like parsing
      const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
      const phone = text.match(/(\+?\d[\d\s\-]{7,}\d)/)?.[0];
      const address = text.match(/(ΟΔΟΣ|Λεωφ|Οδός|Street|χλμ|TK|ΤΚ).*$/im)?.[0];
      const company = text.split("\n")[0]?.trim();

      const result: OCRResult = { text, email, phone, address, company };
      console.log("Vision OCR result:", result);
      onResult?.(result);
    } catch (err) {
      console.error(err);
      alert("Google Vision OCR failed. Check console.");
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
      <Button onClick={handleSelect} size="sm" variant="outline">
        {loading ? "..." : mode === "camera" ? <Camera size={16} /> : <Image size={16} />}
      </Button>
    </>
  );
}
