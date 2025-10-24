"use client"; import React from "react"; import { createClient } from "@supabase/supabase-js"; import { Phone, Mail, Navigation } from "lucide-react"; import Button from "@/components/ui/button"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// NOTE: Replaced custom Select with native <select> to guarantee dark-mode styling // across browsers/themes. If you prefer your Select component, we can wire classes // into it to match the same look.

// -------------------- Types -------------------- type Partner = { id: string; company: string; contact_last_name: string | null; contact_first_name: string | null; specialty: string | null; email: string | null; phone_business?: string | null; phone_cell?: string | null; google_maps_url?: string | null; };

// ----------------- Supabase client --------------- const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string; const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string; const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility to build a full name const fullName = (last?: string | null, first?: string | null) => ${(first || "").trim()} ${(last || "").trim()}.trim();

// -------------------- Page ---------------------- export default function SubbieSupplierPage() { const [loading, setLoading] = React.useState(true); const [partners, setPartners] = React.useState<Partner[]>([]); const [specialtyFilter, setSpecialtyFilter] = React.useState<string>(""); const [query, setQuery] = React.useState(""); const [adding, setAdding] = React.useState(false);

// phone menu state (when multiple numbers exist) const [phoneMenuFor, setPhoneMenuFor] = React.useState<string | null>(null);

// New partner form (to be built next step) const [form, setForm] = React.useState({ company: "", contact_last_name: "", contact_first_name: "", specialty: "", email: "", });

React.useEffect(() => { (async () => { const { data, error } = await supabase .from("partners") .select( "id, company, contact_last_name, contact_first_name, specialty, email, phone_business, phone_cell, google_maps_url" ) .order("company", { ascending: true }); if (error) { console.error(error); } else { setPartners((data || []) as Partner[]); } setLoading(false); })(); }, []);

const specialties = React.useMemo(() => { const set = new Set<string>(); partners.forEach((p) => { const s = (p.specialty || "").trim(); if (s) set.add(s); }); return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b, "el"))]; }, [partners]);

const filtered = React.useMemo(() => { const q = query.trim().toLowerCase(); const only = specialtyFilter && specialtyFilter !== "All" ? specialtyFilter : ""; return partners.filter((p) => { const bySpec = only ? (p.specialty || "") === only : true; if (!bySpec) return false; if (!q) return true; const hay = ${p.contact_last_name || ""} ${p.contact_first_name || ""} ${p.company || ""}.toLowerCase(); return hay.includes(q); }); }, [partners, query, specialtyFilter]);

function openPhone(number?: string | null) { if (!number) return; window.location.href = tel:${number}; }

function sendEmail(to?: string | null) { if (!to) return; window.location.href = mailto:${to}; // Outlook will open if the OS default is Outlook }

function goMaps(url?: string | null) { if (!url) return; window.open(url, "_blank"); }

async function onCreate(e: React.FormEvent) { e.preventDefault(); // Placeholder — we'll build the add flow next alert("Add flow coming next."); }

return ( <div className="max-w-5xl mx-auto p-4 space-y-6"> <header className="flex items-center justify-between gap-3"> <h1 className="text-2xl font-semibold">Subbie – Supplier</h1> <Button onClick={() => setAdding((v) => !v)}> {adding ? "Cancel" : "+ Add New"} </Button> </header>

{/* Controls */}
  <Card>
    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm opacity-80">Search</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type to filter by Last name, First name or Company"
          className="px-3 py-2 rounded-lg border bg-white dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm opacity-80">Specialty</label>
        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border bg-white dark:bg-black dark:text-zinc-100"
        >
          <option value="">All</option>
          {specialties
            .filter((s) => s !== "All")
            .map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
        </select>
      </div>
    </CardContent>
  </Card>

  {/* List */}
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
            const hasTwo = numbers.length > 1;
            return (
              <li key={p.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.company}</div>
                  <div className="text-sm opacity-80 truncate">
                    {fullName(p.contact_last_name, p.contact_first_name)}
                    {p.specialty ? ` • ${p.specialty}` : ""}
                    {p.email ? ` • ${p.email}` : ""}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 relative">
                  {/* Phone */}
                  <Button
                    aria-label="Call"
                    onClick={() => (hasTwo ? setPhoneMenuFor(p.id) : openPhone(numbers[0]))}
                    className="p-2 rounded-2xl"
                    variant="ghost"
                  >
                    <Phone className="w-5 h-5" />
                  </Button>

                  {/* Email */}
                  <Button
                    aria-label="Email"
                    onClick={() => sendEmail(p.email)}
                    className="p-2 rounded-2xl"
                    variant="ghost"
                  >
                    <Mail className="w-5 h-5" />
                  </Button>

                  {/* Maps / Navigation */}
                  <Button
                    aria-label="Navigate"
                    onClick={() => goMaps(p.google_maps_url)}
                    className="p-2 rounded-2xl"
                    variant="ghost"
                  >
                    <Navigation className="w-5 h-5" />
                  </Button>

                  {/* Simple phone popover when multiple numbers exist */}
                  {phoneMenuFor === p.id && hasTwo && (
                    <div
                      className="absolute right-0 top-10 z-20 w-56 rounded-xl border shadow-lg bg-white dark:bg-zinc-900 dark:text-zinc-100"
                      onMouseLeave={() => setPhoneMenuFor(null)}
                    >
                      <div className="px-3 py-2 text-xs opacity-70">Choose number</div>
                      {numbers.map((n) => (
                        <button
                          key={n}
                          onClick={() => {
                            setPhoneMenuFor(null);
                            openPhone(n);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          {n}
                        </button>
                      ))}
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

); }