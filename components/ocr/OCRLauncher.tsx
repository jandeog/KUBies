"use client";
import React, { useRef, useState } from "react";
import { Camera, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseVisionText, ParsedContact } from "@/lib/parseVisionText";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Mode = "gallery" | "camera";
type OCRResult = ParsedContact;

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
      if (!res.ok) throw new Error("OCR request failed");

      const data = await res.json();
      console.log("🔍 OCR API response:", data);

      if (data.source === "gemini") {
        console.log("✅ Gemini AI parser used!");
        onResult?.(data);
      } else if (data.source === "vision") {
        console.warn("⚠️ Gemini failed — using Vision OCR fallback");
        const text = data.text || "";
        const parsed = parseVisionText(text);
        onResult?.(parsed);
      } else {
        console.error("❌ Unknown OCR source or invalid response:", data);
        alert("OCR error — check console logs.");
      }
    } catch (err) {
      console.error("OCRLauncher error:", err);
      alert("AI OCR failed. Check console for details.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const label = mode === "camera" ? "Camera OCR" : "Gallery OCR";
  const Icon = mode === "camera" ? Camera : Image;

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

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleSelect}
              size="sm"
              variant="outline"
              disabled={loading}
              className="relative"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Icon size={16} />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
