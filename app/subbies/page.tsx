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
      <ul className="divide-y">
        {filtered.map((p) => {
          const numbers = [p.phone_business, p.phone_cell].filter(Boolean) as string[];
          return (
            <li
              key={p.id}
              className="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-md"
              onClick={(e) => {
                // click σε όλο το row -> edit mode (θα το φτιάξουμε μετά)
                console.log("Edit mode:", p.id);
              }}
            >
              {/* Left side */}
              <div className="truncate min-w-0">
                <div className="font-medium truncate">{p.company}</div>
                <div className="text-sm opacity-80 truncate">
                  {`${p.contact_first_name || ""} ${p.contact_last_name || ""}`.trim()}
                </div>
              </div>

              {/* Right side: actions */}
              <div
                className="flex items-center gap-2 shrink-0"
                onClick={(e) => e.stopPropagation()} // για να μην ανοίγει edit κατά λάθος
              >
                {/* PHONE */}
                <div className="relative group">
                  <button
                    onClick={() => numbers.length === 1 && window.location.assign(`tel:${numbers[0]}`)}
                    className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  {numbers.length > 0 && (
                    <div className="absolute right-0 top-6 hidden group-hover:block bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-md shadow-lg">
                      {numbers.map((num) => (
                        <button
                          key={num}
                          onClick={() => window.location.assign(`tel:${num}`)}
                          className="block px-3 py-1 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-800 w-full text-left"
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* EMAIL */}
                {p.email && (
                  <div className="relative group">
                    <button
                      onClick={() => window.location.assign(`mailto:${p.email}`)}
                      className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-6 hidden group-hover:block bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-md shadow-lg px-3 py-1 text-sm whitespace-nowrap">
                      {p.email}
                    </div>
                  </div>
                )}

                {/* MAPS */}
                {p.google_maps_url && (
                  <div className="relative group">
                    <button
                      onClick={() => window.open(p.google_maps_url!, "_blank")}
                      className="p-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800 transition"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                    <div className="absolute right-0 top-6 hidden group-hover:block bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-md shadow-lg px-3 py-1 text-sm max-w-xs truncate">
                      {p.address}
                    </div>
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
