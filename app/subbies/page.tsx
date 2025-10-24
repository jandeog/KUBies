"use client";
import React from "react";
import { createClient } from "@supabase/supabase-js";
import Button from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectItem } from "@/components/ui/select";

// -------------------- Types --------------------
type Partner = {
  id: string;
  company: string;
  contact_last_name: string | null;
  contact_first_name: string | null;
  specialty: string | null;
  email: string | null;
};

// ----------------- Supabase client ---------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// -------------------- Page ----------------------
export default function SubbieSupplierPage() {
  const [loading, setLoading] = React.useState(true);
  const [partners, setPartners] = React.useState<Partner[]>([]);
  const [specialtyFilter, setSpecialtyFilter] = React.useState<string>("");
  const [query, setQuery] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  // New partner form state
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
        .select("id, company, contact_last_name, contact_first_name, specialty, email")
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
    return ["Όλες", ...Array.from(set).sort((a, b) => a.localeCompare(b, "el"))];
  }, [partners]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const only = specialtyFilter && specialtyFilter !== "Όλες" ? specialtyFilter : "";
    return partners.filter((p) => {
      const bySpec = only ? (p.specialty || "") === only : true;
      if (!bySpec) return false;
      if (!q) return true;
      const hay = `${p.contact_last_name || ""} ${p.contact_first_name || ""} ${p.company || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [partners, query, specialtyFilter]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company.trim()) {
      alert("Συμπλήρωσε τουλάχιστον την Εταιρία (Company)");
      return;
    }
    const payload = {
      company: form.company.trim(),
      contact_last_name: form.contact_last_name.trim() || null,
      contact_first_name: form.contact_first_name.trim() || null,
      specialty: form.specialty.trim() || null,
      email: form.email.trim() || null,
    };
    const { data, error } = await supabase
      .from("partners")
      .insert(payload)
      .select("id, company, contact_last_name, contact_first_name, specialty, email")
      .single();
    if (error) {
      console.error(error);
      alert("Αποτυχία δημιουργίας. Δες το console για λεπτομέρειες.");
      return;
    }
    setPartners((prev) =>
      [...prev, data as Partner].sort((a, b) => a.company.localeCompare(b.company, "el"))
    );
    setAdding(false);
    setForm({ company: "", contact_last_name: "", contact_first_name: "", specialty: "", email: "" });
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Subbie – Supplier</h1>
        <Button onClick={() => setAdding((v) => !v)}>
          {adding ? "Ακύρωση" : "+ Προσθήκη Νέου"}
        </Button>
      </header>

      {/* Controls */}
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm opacity-80">Αναζήτηση</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ψάξε σε Επώνυμο, Όνομα ή Εταιρία"
              className="px-3 py-2 rounded-lg border"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm opacity-80">Ειδικότητα</label>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger />
              <SelectItem value="">Όλες</SelectItem>
              {specialties
                .filter((s) => s !== "Όλες")
                .map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Add new */}
      {adding && (
        <Card>
          <CardHeader>
            <CardTitle>Νέα Καταχώριση</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="px-3 py-2 rounded-lg border"
                placeholder="Company *"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
              <input
                className="px-3 py-2 rounded-lg border"
                placeholder="Specialty (Ειδικότητα)"
                value={form.specialty}
                onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                list="specialties"
              />
              <datalist id="specialties">
                {specialties
                  .filter((s) => s !== "Όλες")
                  .map((s) => (
                    <option key={s} value={s} />
                  ))}
              </datalist>
              <input
                className="px-3 py-2 rounded-lg border"
                placeholder="Last name (Επώνυμο)"
                value={form.contact_last_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_last_name: e.target.value }))}
              />
              <input
                className="px-3 py-2 rounded-lg border"
                placeholder="First name (Όνομα)"
                value={form.contact_first_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_first_name: e.target.value }))}
              />
              <input
                type="email"
                className="px-3 py-2 rounded-lg border"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <div className="md:col-span-2 flex items-center gap-2">
                <Button type="submit">Αποθήκευση</Button>
                <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
                  Άκυρο
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Λίστα ({loading ? "…" : filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-4 opacity-70">Φόρτωση…</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 opacity-70">Δεν βρέθηκαν αποτελέσματα.</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.company}</div>
                    <div className="text-sm opacity-80 truncate">
                      {(p.contact_last_name || "").trim()} {(p.contact_first_name || "").trim()}
                      {p.specialty ? ` • ${p.specialty}` : ""}
                      {p.email ? ` • ${p.email}` : ""}
                    </div>
                  </div>
                  {/* Placeholder for future actions (edit, view) */}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
