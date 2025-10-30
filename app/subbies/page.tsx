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
      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100"
        />
      </div>

      {/* List */}
      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="p-4 opacity-70">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 opacity-70">No results.</div>
        ) : (
          filtered.map((p) => {
            const numbers = [p.phone_business, p.phone_cell].filter(Boolean) as string[];
            const fullName = `${p.contact_first_name || ""} ${p.contact_last_name || ""}`.trim();

            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 
                           hover:border-emerald-600 hover:bg-emerald-950/60 transition-colors px-4 py-3"
              >
                {/* Left side */}
                <div className="flex flex-col overflow-hidden min-w-0">
                  <div className="font-semibold truncate text-zinc-100">{p.company || "—"}</div>
                  <div className="text-sm text-zinc-400 truncate">{fullName || "—"}</div>
                </div>

                {/* Right icons */}
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {/* PHONE */}
                  {numbers.length > 0 && (
                    <div className="relative group">
                      <button
                        onClick={() =>
                          numbers.length === 1 && window.location.assign(`tel:${numbers[0]}`)
                        }
                        className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-emerald-700 transition"
                      >
                        <Phone className="w-4 h-4 text-zinc-200" />
                      </button>
                      {numbers.length > 1 && (
                        <div className="absolute right-0 top-9 hidden group-hover:flex flex-col
                                        bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg text-sm z-50">
                          {numbers.map((n) => (
                            <button
                              key={n}
                              onClick={() => window.location.assign(`tel:${n}`)}
                              className="px-4 py-1 text-left hover:bg-emerald-800 transition"
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* EMAIL */}
                  {p.email && (
                    <div className="relative group">
                      <button
                        onClick={() => window.location.assign(`mailto:${p.email}`)}
                        className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-emerald-700 transition"
                      >
                        <Mail className="w-4 h-4 text-zinc-200" />
                      </button>
                      <div className="absolute right-0 top-9 hidden group-hover:flex 
                                      bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg px-4 py-1 text-sm z-50">
                        {p.email}
                      </div>
                    </div>
                  )}

                  {/* MAP */}
                  {p.google_maps_url && (
                    <div className="relative group">
                      <button
                        onClick={() => window.open(p.google_maps_url!, "_blank")}
                        className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-emerald-700 transition"
                      >
                        <Navigation className="w-4 h-4 text-zinc-200" />
                      </button>
                      {p.address && (
                        <div className="absolute right-0 top-9 hidden group-hover:flex 
                                        bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg px-4 py-1 text-sm max-w-xs truncate z-50">
                          {p.address}
                        </div>
                      )}
                    </div>
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
