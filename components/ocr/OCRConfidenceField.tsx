"use client";
import React from "react";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";

export type OCRConfidenceFieldProps = {
  label: string;
  field: string;
  value: string | undefined;
  onChange?: (val: string) => void;
  ocrData?: any;
  required?: boolean;
  className?: string; // ✅ NEW optional prop for highlight styling
};

export function OCRConfidenceField({
  label,
  field,
  value,
  onChange,
  ocrData,
  required = false,
  className = "", // ✅ default empty
}: OCRConfidenceFieldProps) {
  const confidence = ocrData?.[field]?.confidence;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        <ConfidenceBadge value={confidence} />
      </div>
      <input
        className={`w-full border border-gray-300 rounded-md p-2 text-sm focus:ring focus:ring-blue-200 ${className}`}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
