"use client";
import React from "react";
import { createClient } from "@supabase/supabase-js";
import { Phone, Mail, Navigation } from "lucide-react";
import Button from "@/components/ui/button";

type Partner = {
  id: string;
  company: string;
  contact_last_name: string | null;
  contact_first_name: string | null;
  specialty: string | null;
  email: string | null;
  phone_business?: string | null;
  phone_cell?: string | null;
  google_maps_url?: string | null;
  address?: string | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
function normalizeNumber(n?: string | null) {
  if (!n) return "";
  const s = String(n);
  // if it looks like scientific notation from CSV, drop to digits
  const cleaned = s.match(/[0-9+]+/g)?.join("") ?? "";
  return cleaned;
}
export default function SubbieSupplierPage() {
  const [loading, setLoading] = React.useState(true);
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [specialtyFilter, setSpecialtyFilter] = React.useState("");
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("partners")
        .select(
          "id, company, contact_last_name, contact_first_name, specialty, email, phone_business, phone_cell, google_maps_url, address"
        )
        .order("company", { ascending: true });
      if (error) console.error(error);
      else setPartners(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners.filter((p) => {
      const hay = `${p.contact_last_name || ""} ${p.contact_first_name || ""} ${p.company || ""}`.toLowerCase();
      return !q || hay.includes(q);
    });
  }, [partners, query]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Subbie – Supplier</h1>
        <Button>+ Add New</Button>
      </header>

      {/* Search */}
<div className="grid gap-2">
  {filtered.map((p) => {
const numbers = [normalizeNumber(p.phone_business), normalizeNumber(p.phone_cell)].filter(Boolean) as string[];

    const fullName = `${p.contact_first_name || ""} ${p.contact_last_name || ""}`.trim();

    return (
      <div
        key={p.id}
        className="partner-row"
        onClick={() => console.log("edit", p.id)}
      >
        {/* LEFT side */}
        <div className="partner-left">
          <div className="partner-company">{p.company}</div>
          <div className="partner-name">{fullName}</div>
        </div>

        {/* RIGHT side */}


<div className="partner-actions" onClick={(e) => e.stopPropagation()}>
  {/* PHONE */}
  {numbers.length > 0 && (
    <div className="partner-menu">
      <button className="action-btn" aria-label="Call">
        <Phone className="w-4 h-4" />
      </button>
      <div className="partner-flyout">
        {numbers.map((num) => (
          <button key={num} onClick={() => window.location.assign(`tel:${num}`)}>
            {num}
          </button>
        ))}
      </div>
    </div>
  )}

  {/* EMAIL */}
  {p.email && (
    <div className="partner-menu">
      <button className="action-btn" aria-label="Email">
        <Mail className="w-4 h-4" />
      </button>
      <div className="partner-flyout">
        <button onClick={() => window.location.assign(`mailto:${p.email}`)}>
          {p.email}
        </button>
      </div>
    </div>
  )}

  {/* MAPS */}
  {p.google_maps_url && (
    <div className="partner-menu">
      <button className="action-btn" aria-label="Navigate">
        <Navigation className="w-4 h-4" />
      </button>
      {p.address && (
        <div className="partner-flyout" style={{ maxWidth: 260 }}>
          <button onClick={() => window.open(p.google_maps_url!, "_blank")}>
            {p.address}
          </button>
        </div>
      )}
    </div>
  )}
</div>




      </div>
    );
  })}
</div>


    </div>
  );
}
