"use client";
import React, { useRef, useState } from "react";
import { Camera, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "gallery" | "camera";
type OCRResult = {
  company?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  phones?: string[];
  address?: string;
  website?: string;
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

      const res = await fetch("/api/ocr/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Parsing failed");
      const data = await res.json();
      console.log("AI OCR result:", data);
      onResult?.(data);
    } catch (err) {
      console.error(err);
      alert("AI OCR failed. Check console.");
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
