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

/* helpers */
function normalizeNumber(n?: string | null) {
  if (!n) return "";
  const s = String(n);
  const cleaned = s.match(/[0-9+]+/g)?.join("") ?? "";
  return cleaned;
}
function isBlank(v?: string | null) {
  if (!v) return true;
  const t = String(v).trim().toLowerCase();
  return t === "" || t === "nan" || t === "null" || t === "undefined";
}

export default function SubbieSupplierPage() {
  const [loading, setLoading] = React.useState(true);
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [query, setQuery] = React.useState("");
  const [specialtyFilter, setSpecialtyFilter] = React.useState<string>("");

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

 const specialties = React.useMemo(() => {
  const set = new Set<string>();
  partners.forEach((p) => {
    const s = (p.specialty || "").trim();
    if (s && s.toLowerCase() !== "nan") set.add(s);
  });
  return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
}, [partners]);


  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const only = specialtyFilter && specialtyFilter !== "All" ? specialtyFilter : "";
    return partners.filter((p) => {
      if (only && (p.specialty || "") !== only) return false;
      if (!q) return true;
      const hay = `${p.contact_last_name || ""} ${p.contact_first_name || ""} ${p.company || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [partners, query, specialtyFilter]);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Subbie – Supplier</h1>
        <Button>+ Add New</Button>
      </header>

{/* Search + Specialty filter */}
<div className="grid" style={{ gridTemplateColumns: "1fr 220px", gap: 10 }}>
  <input
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder="Search by company, last name or first name…"
  />

  {/* ONE select only */}
  <select
    className="select--dark"
    value={specialtyFilter}
    onChange={(e) => setSpecialtyFilter(e.target.value)}
    aria-label="Specialty"
  >
    {specialties.map((s) => (
      <option key={s} value={s === "All" ? "" : s}>
        {s}
      </option>
    ))}
  </select>
</div>


      {/* List */}
      <div className="grid gap-2">
        {loading ? (
          <div className="p-4 opacity-70">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 opacity-70">No results.</div>
        ) : (
          filtered.map((p) => {
            const numbers = [normalizeNumber(p.phone_business), normalizeNumber(p.phone_cell)].filter(Boolean) as string[];
            const fullName = `${p.contact_first_name || ""} ${p.contact_last_name || ""}`.trim();
            const hasPhone = numbers.length > 0;
            const hasEmail = !isBlank(p.email);
            const hasMap = !isBlank(p.google_maps_url) && !isBlank(p.address);

            return (
              <div key={p.id} className="partner-row" onClick={() => console.log("edit", p.id)}>
                {/* Left */}
                <div className="partner-left">
                  <div className="partner-company">{p.company || "—"}</div>
                  <div className="partner-name">{fullName || "—"}</div>
                </div>

                {/* Right actions */}
                <div className="partner-actions" onClick={(e) => e.stopPropagation()}>
                  {/* Phone */}
                  {hasPhone ? (
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
                  ) : (
                    <button className="action-btn" aria-label="Call" aria-disabled="true">
                      <Phone className="w-4 h-4" />
                    </button>
                  )}

                  {/* Email */}
                  {hasEmail ? (
                    <div className="partner-menu">
                      <button className="action-btn" aria-label="Email">
                        <Mail className="w-4 h-4" />
                      </button>
                      <div className="partner-flyout">
                        <button onClick={() => window.location.assign(`mailto:${p.email}`)}>{p.email}</button>
                      </div>
                    </div>
                  ) : (
                    <button className="action-btn" aria-label="Email" aria-disabled="true">
                      <Mail className="w-4 h-4" />
                    </button>
                  )}

                  {/* Maps */}
                  {hasMap ? (
                    <div className="partner-menu">
                      <button className="action-btn" aria-label="Navigate">
                        <Navigation className="w-4 h-4" />
                      </button>
                      <div className="partner-flyout" style={{ maxWidth: 260 }}>
                        <button onClick={() => window.open(p.google_maps_url!, "_blank")}>{p.address}</button>
                      </div>
                    </div>
                  ) : (
                    <button className="action-btn" aria-label="Navigate" aria-disabled="true">
                      <Navigation className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
