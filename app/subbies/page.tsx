"use client";
import React from "react";
import { createClient } from "@supabase/supabase-js";
import { Phone, Mail, Navigation } from "lucide-react";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// NOTE: Replaced custom Select with native <select> to guarantee dark-mode styling
// across browsers/themes. If you prefer your Select component, we can wire classes
// into it to match the same look.

// -------------------- Types --------------------
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

// ----------------- Supabase client ---------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility to build a full name
const fullName = (last?: string | null, first?: string | null) =>
  `${(first || "").trim()} ${(last || "").trim()}`.trim();

// -------------------- Page ----------------------
export default function SubbieSupplierPage() {
  const [loading, setLoading] = React.useState(true);
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [specialtyFilter, setSpecialtyFilter] = React.useState<string>("");
  const [query, setQuery] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  // phone menu state (when multiple numbers exist)
  const [phoneMenuFor, setPhoneMenuFor] = React.useState<string | null>(null);

  // New partner form (to be built next step)
  const [form, setForm] = React.useState({
    company: "",
    contact_last_name: "",
    contact_first_name: "",
    specialty: "",
    email: "",
  });

  React.useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("partners")
        .select(
          "id, company, contact_last_name, contact_first_name, specialty, email, phone_business, phone_cell, google_maps_url, address"
        )
        .order("company", { ascending: true });
      if (error) {
        console.error(error);
      } else {
        setPartners((data || []) as Partner[]);
      }
      setLoading(false);
    })();
  }, []);

  const specialties = React.useMemo(() => {
    const set = new Set<string>();
    partners.forEach((p) => {
      const s = (p.specialty || "").trim();
      if (s) set.add(s);
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b, "el"))];
  }, [partners]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const only = specialtyFilter && specialtyFilter !== "All" ? specialtyFilter : "";
    return partners.filter((p) => {
      const bySpec = only ? (p.specialty || "") === only : true;
      if (!bySpec) return false;
      if (!q) return true;
      const hay = `${p.contact_last_name || ""} ${p.contact_first_name || ""} ${p.company || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [partners, query, specialtyFilter]);

  function openPhone(number?: string | null) {
    if (!number) return;
    window.location.href = `tel:${number}`;
  }

  function sendEmail(to?: string | null) {
    if (!to) return;
    window.location.href = `mailto:${to}`; // Outlook will open if the OS default is Outlook
  }

  function goMaps(url?: string | null) {
    if (!url) return;
    window.open(url, "_blank");
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder — we'll build the add flow next
    alert("Add flow coming next.");
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Subbie – Supplier</h1>
        <Button onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "+ Add New"}
        </Button>
      </header>

      {/* Controls */}
      {/* Compact List */}
<Card>
  <CardHeader>
    <CardTitle>
      List ({loading ? "…" : filtered.length})
    </CardTitle>
  </CardHeader>
  <CardContent>
    {loading ? (
      <div className="p-4 opacity-70">Loading…</div>
    ) : filtered.length === 0 ? (
      <div className="p-4 opacity-70">No results.</div>
    ) : (
<ul className="flex flex-col divide-y divide-zinc-800">
  {filtered.map((p) => {
    const numbers = [p.phone_business, p.phone_cell].filter(Boolean) as string[];
    const fullName = `${p.contact_first_name || ""} ${p.contact_last_name || ""}`.trim();
    return (
      <li
        key={p.id}
        className="group flex items-center justify-between px-3 py-2
                   hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors rounded-md"
        onClick={() => console.log('edit', p.id)}
      >
        {/* LEFT side: company + name */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <span className="truncate font-medium">{p.company}</span>
          {fullName && (
            <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              • {fullName}
            </span>
          )}
        </div>

        {/* RIGHT side: action icons */}
        <div
          className="flex shrink-0 items-center gap-2 ml-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* PHONE */}
          <div className="relative group/phone">
            <button
              onClick={() =>
                numbers.length === 1 && window.location.assign(`tel:${numbers[0]}`)
              }
              className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
            >
              <Phone className="w-4 h-4" />
            </button>
            {numbers.length > 0 && (
              <div className="absolute right-0 top-6 hidden group-hover/phone:flex flex-col
                              bg-white dark:bg-zinc-900 border dark:border-zinc-700
                              rounded-md shadow-lg text-sm z-50">
                {numbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => window.location.assign(`tel:${n}`)}
                    className="px-3 py-1 text-left hover:bg-emerald-50 dark:hover:bg-emerald-800"
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* EMAIL */}
          {p.email && (
            <div className="relative group/email">
              <button
                onClick={() => window.location.assign(`mailto:${p.email}`)}
                className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
              >
                <Mail className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-6 hidden group-hover/email:flex
                              bg-white dark:bg-zinc-900 border dark:border-zinc-700
                              rounded-md shadow-lg px-3 py-1 text-sm whitespace-nowrap z-50">
                {p.email}
              </div>
            </div>
          )}

          {/* MAPS */}
          {p.google_maps_url && (
            <div className="relative group/maps">
              <button
                onClick={() => window.open(p.google_maps_url!, '_blank')}
                className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
              >
                <Navigation className="w-4 h-4" />
              </button>
              {p.address && (
                <div className="absolute right-0 top-6 hidden group-hover/maps:flex
                                bg-white dark:bg-zinc-900 border dark:border-zinc-700
                                rounded-md shadow-lg px-3 py-1 text-sm max-w-xs truncate z-50">
                  {p.address}
                </div>
              )}
            </div>
          )}
        </div>
      </li>
    );
  })}
</ul>



    )}
  </CardContent>
</Card>

    </div>
  );
}
