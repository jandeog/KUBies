"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Button from "@/components/ui/button";
import OCRLauncher from "@/components/ocr/OCRLauncher";
import { OCRConfidenceField } from "@/components/ocr/OCRConfidenceField";
import { Globe, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Partner = {
  id?: string;
  company: string;
  contact_last_name: string | null;
  contact_first_name: string | null;
  specialty: string | null;
  email: string | null;
  phone_business: string | null;
  phone_cell: string | null;
  address: string | null;
  google_maps_url: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

function isNA(v?: string | null) {
  if (!v) return true;
  const t = String(v).trim().toLowerCase();
  return t === "" || t === "-" || t === "nan" || t === "null" || t === "undefined";
}
function clean(v?: string | null) {
  if (v == null) return null;
  const t = String(v).trim();
  if (!t) return null;
  const l = t.toLowerCase();
  if (l === "nan") return "-";
  if (l === "null" || l === "undefined") return null;
  return t;
}
function mapsFromAddress(addr?: string | null) {
  if (isNA(addr)) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    String(addr).trim()
  )}`;
}

// ✅ helper for green flash animation
function flashGreen(selector: string) {
  const el = document.querySelector<HTMLInputElement>(selector);
  if (!el) return;
  el.classList.remove("flash-green"); // reset if still animating
  // force reflow so animation restarts
  void el.offsetWidth;
  el.classList.add("flash-green");
}


export default function PartnerEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [ocrData, setOcrData] = useState<any>(null);
  const [parserUsed, setParserUsed] = useState<string | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const [form, setForm] = useState<Partner>({
    company: "",
    contact_last_name: "",
    contact_first_name: "",
    specialty: "",
    email: "",
    phone_business: "",
    phone_cell: "",
    address: "",
    google_maps_url: "",
  });

  // ✅ Handle OCR results (Gemini or Vision)
  function handleOCRResult(r: any) {
    setOcrData(r);
    setParserUsed(r.source || "unknown");
    console.log("📦 OCR structured result:", r);

    const firstPhone =
      Array.isArray(r.phones) && r.phones.length > 0 ? r.phones[0] : r.phone || "";

    const updates: any = {
      company: r.company,
      contact_first_name: r.first_name,
      contact_last_name: r.last_name,
      email: r.email,
      phone_business: firstPhone,
      address: r.address,
      google_maps_url: mapsFromAddress(r.address),
    };

    Object.keys(updates).forEach((k) => {
      if (updates[k]) flashGreen(`[name='${k}']`);
    });

    setForm((prev) => ({ ...prev, ...updates }));
  }

  // ✅ Heuristic Search (Gemini 2.5 Pro)
  async function handleHeuristicSearch() {
    setLoadingSearch(true);
    try {
      const known = form;
      const missing = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => !v || v === "")
      );

      const res = await fetch("/api/heuristicSearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ known, missing }),
      });
      const data = await res.json();

      if (data.message || Object.keys(data).length === 0) {
        alert("No extra information found over Gemini AI Search.");
        return;
      }

      Object.keys(data).forEach((k) => {
        if (data[k]) flashGreen(`[name='${k}']`);
      });

      setForm((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
      alert("Gemini Heuristic Search failed.");
    } finally {
      setLoadingSearch(false);
    }
  }

  // ✅ Load existing subbie
  React.useEffect(() => {
    (async () => {
      const { data: all } = await supabase.from("partners").select("specialty");
      if (all) {
        const set = new Set<string>();
        all.forEach((r: any) => {
          const s = (r.specialty || "").trim();
          if (!isNA(s)) set.add(s);
        });
        setSpecialties(Array.from(set).sort((a, b) => a.localeCompare(b)));
      }

      if (!isNew) {
        const { data } = await supabase
          .from("partners")
          .select(
            "id, company, contact_last_name, contact_first_name, specialty, email, phone_business, phone_cell, address, google_maps_url"
          )
          .eq("id", params.id)
          .single();
        if (data) {
          setForm({
            id: data.id,
            company: data.company ?? "",
            contact_last_name: data.contact_last_name,
            contact_first_name: data.contact_first_name,
            specialty: data.specialty,
            email: data.email,
            phone_business: data.phone_business,
            phone_cell: data.phone_cell,
            address: data.address,
            google_maps_url: data.google_maps_url,
          });
        }
      }
      setLoading(false);
    })();
  }, [isNew, params.id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim()) {
      alert("Company is required.");
      return;
    }
    setSaving(true);

    const payload = {
      company: form.company.trim(),
      contact_last_name: clean(form.contact_last_name),
      contact_first_name: clean(form.contact_first_name),
      specialty: clean(form.specialty),
      email: clean(form.email),
      phone_business: clean(form.phone_business),
      phone_cell: clean(form.phone_cell),
      address: clean(form.address),
      google_maps_url:
        clean(form.google_maps_url) ?? mapsFromAddress(form.address),
    };

    const { error } = isNew
      ? await supabase.from("partners").insert(payload)
      : await supabase.from("partners").update(payload).eq("id", form.id as string);

    setSaving(false);
    if (error) {
      console.error(error);
      alert("Save failed.");
      return;
    }
    router.push("/subbies");
  }

  async function onDelete() {
    if (isNew || !form.id) {
      router.push("/subbies");
      return;
    }
    if (!confirm("Delete this entry? This cannot be undone.")) return;
    setSaving(true);
    const { error } = await supabase.from("partners").delete().eq("id", form.id);
    setSaving(false);
    if (error) {
      console.error(error);
      alert("Delete failed.");
      return;
    }
    router.push("/subbies");
  }

  function onCancel() {
    router.push("/subbies");
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xl md:text-2xl font-semibold">
          {isNew ? "Add Subbie/Supplier" : "Edit Subbie/Supplier"}
        </h1>
        <div className="flex gap-2 items-center flex-shrink-0">
          {/* 🌐 Heuristic Search */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleHeuristicSearch}
                  disabled={loadingSearch}
                  className="relative"
                >
                  {loadingSearch ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <Globe size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Heuristic Search
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 📁 Gallery OCR */}
          <OCRLauncher mode="gallery" onResult={handleOCRResult} />

          {/* 📷 Camera OCR */}
          <OCRLauncher mode="camera" onResult={handleOCRResult} />
        </div>
      </header>

      {loading ? (
        <div className="p-4 opacity-70">Loading…</div>
      ) : (
        <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <OCRConfidenceField
              label="Company"
              field="company"
              required
              value={form.company}
              ocrData={ocrData}
              onChange={(val) => setForm((f) => ({ ...f, company: val }))}
            />
          </div>

          <OCRConfidenceField
            label="First name"
            field="first_name"
            value={form.contact_first_name || ""}
            ocrData={ocrData}
            onChange={(val) => setForm((f) => ({ ...f, contact_first_name: val }))}
          />
          <OCRConfidenceField
            label="Last name"
            field="last_name"
            value={form.contact_last_name || ""}
            ocrData={ocrData}
            onChange={(val) => setForm((f) => ({ ...f, contact_last_name: val }))}
          />

          <div>
            <label>Specialty</label>
            <input
              name="specialty"
              value={form.specialty || ""}
              onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
              list="specialty-options"
              placeholder="Specialty"
            />
            <datalist id="specialty-options">
              {specialties.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <OCRConfidenceField
            label="Email"
            field="email"
            value={form.email || ""}
            ocrData={ocrData}
            onChange={(val) => setForm((f) => ({ ...f, email: val }))}
          />

          <OCRConfidenceField
            label="Business phone"
            field="phones"
            value={form.phone_business || ""}
            ocrData={ocrData}
            onChange={(val) => setForm((f) => ({ ...f, phone_business: val }))}
          />
          <div>
            <label>Cell phone</label>
            <input
              name="phone_cell"
              value={form.phone_cell || ""}
              onChange={(e) => setForm((f) => ({ ...f, phone_cell: e.target.value }))}
              placeholder="+30…"
            />
          </div>

          <OCRConfidenceField
            label="Address"
            field="address"
            value={form.address || ""}
            ocrData={ocrData}
            onChange={(val) => setForm((f) => ({ ...f, address: val }))}
          />

          <div className="md:col-span-2">
            <label>Google Maps URL</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
              <input
                name="google_maps_url"
                value={form.google_maps_url || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, google_maps_url: e.target.value }))
                }
                placeholder="https://www.google.com/maps/…"
              />
              <Button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    google_maps_url: mapsFromAddress(f.address),
                  }))
                }
              >
                From Address
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 flex gap-2 justify-end items-center">
            {parserUsed && (
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  parserUsed === "gemini"
                    ? "bg-green-600 text-white"
                    : "bg-yellow-500 text-black"
                }`}
              >
                {parserUsed === "gemini" ? "Gemini AI Parser" : "Vision Fallback"}
              </span>
            )}

            {!isNew && (
              <Button
                type="button"
                onClick={onDelete}
                style={{
                  background: "#7f0a0a",
                  color: "white",
                  borderColor: "#7f0a0a",
                }}
                disabled={saving}
              >
                Delete
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
