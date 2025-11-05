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
      const { data } = await Tesseract.recognize(file, "ell+eng", {
        logger: (m) => console.log(m),
      });

      const text = data.text;
      console.log("OCR raw text:", text);

      const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
      const phoneMatch = text.match(/(\+?\d[\d\-\s]{5,}\d)/)?.[0];

      const result: OCRResult = {
        text,
        email: emailMatch ?? undefined,
        phone: phoneMatch ?? undefined,
      };

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
