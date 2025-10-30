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
<div className="grid gap-2">
  {filtered.map((p) => {
    const numbers = [p.phone_business, p.phone_cell].filter(Boolean) as string[];
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
        <div
          className="partner-actions"
          onClick={(e) => e.stopPropagation()}
        >
          {/* PHONE */}
          {numbers.length > 0 && (
            <div className="relative group">
              <button
                className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-emerald-700 transition"
              >
                <Phone className="w-4 h-4 text-zinc-200" />
              </button>
              <div className="absolute right-0 top-9 hidden group-hover:flex flex-col
                              bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg text-sm z-50 min-w-[130px]">
                {numbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => window.location.assign(`tel:${num}`)}
                    className="px-3 py-1 text-left hover:bg-emerald-800 truncate"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EMAIL */}
          {p.email && (
            <div className="relative group">
              <button
                className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-emerald-700 transition"
              >
                <Mail className="w-4 h-4 text-zinc-200" />
              </button>
              <div className="absolute right-0 top-9 hidden group-hover:flex 
                              bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg px-4 py-1 text-sm z-50 truncate">
                <button
                  onClick={() => window.location.assign(`mailto:${p.email}`)}
                  className="text-left truncate"
                >
                  {p.email}
                </button>
              </div>
            </div>
          )}

          {/* MAPS */}
          {p.google_maps_url && (
            <div className="relative group">
              <button
                className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-emerald-700 transition"
              >
                <Navigation className="w-4 h-4 text-zinc-200" />
              </button>
              {p.address && (
                <div className="absolute right-0 top-9 hidden group-hover:flex 
                                bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg px-4 py-1 text-sm max-w-[220px] truncate z-50">
                  <button
                    onClick={() => window.open(p.google_maps_url!, "_blank")}
                    className="text-left truncate"
                  >
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
