"use client";
import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ConfidenceBadge({
  value,
  label = "AI Detection confidence",
}: {
  value?: number;
  label?: string;
}) {
  if (value === undefined || value === null) return null;
  const pct = Math.round(value * 100);
  const color =
    pct > 90 ? "bg-green-600" : pct > 70 ? "bg-yellow-500" : "bg-red-600";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`flex items-center gap-1 text-xs text-white px-2 py-[2px] rounded-full ${color}`}
            title={`${label}: ${pct}%`}
          >
            {pct}%
            <Info size={12} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[180px]">
          Confidence Level OCR (AI): {pct}%
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
