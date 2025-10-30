"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Button from "@/components/ui/button";

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

function clean(v?: string | null) {
  if (!v) return null;
  const t = String(v).trim();
  if (!t || ["nan", "null", "undefined"].includes(t.toLowerCase())) return null;
  return t;
}
function mapsFromAddress(addr?: string | null) {
  const a = clean(addr);
  return a ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}` : null;
}

export default function PartnerEditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const isNew = params.id === "new";

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [specialties, setSpecialties] = React.useState<string[]>([]);

  const [form, setForm] = React.useState<Partner>({
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

  React.useEffect(() => {
    (async () => {
      // fetch specialties for datalist
      const { data: all, error: e1 } = await supabase.from("partners").select("specialty");
      if (!e1 && all) {
        const set = new Set<string>();
        all.forEach((r: any) => {
          const s = (r.specialty || "").trim();
          if (s && s.toLowerCase() !== "nan") set.add(s);
        });
        setSpecialties(Array.from(set).sort((a, b) => a.localeCompare(b)));
      }

      if (!isNew) {
        const { data, error } = await supabase
          .from("partners")
          .select(
            "id, company, contact_last_name, contact_first_name, specialty, email, phone_business, phone_cell, address, google_maps_url"
          )
          .eq("id", params.id)
          .single();
        if (error) {
          console.error(error);
        } else if (data) {
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

    // Build payload with nulls for blanks
    const payload = {
      company: form.company.trim(),
      contact_last_name: clean(form.contact_last_name),
      contact_first_name: clean(form.contact_first_name),
      specialty: clean(form.specialty),
      email: clean(form.email),
      phone_business: clean(form.phone_business),
      phone_cell: clean(form.phone_cell),
      address: clean(form.address),
      google_maps_url: clean(form.google_maps_url) ?? mapsFromAddress(form.address),
    };

    const { error } = isNew
      ? await supabase.from("partners").insert(payload)
      : await supabase.from("partners").update(payload).eq("id", form.id as string);

    setSaving(false);
    if (error) {
      console.error(error);
      alert("Save failed. See console for details.");
      return;
    }
    router.push("/subbies");
  }

  function onCancel() {
    router.push("/subbies");
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{isNew ? "Add Subbie/Supplier" : "Edit Subbie/Supplier"}</h1>
        <div className="flex gap-2">
          <Button onClick={onCancel} variant="ghost">Cancel</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </header>

      {loading ? (
        <div className="p-4 opacity-70">Loading…</div>
      ) : (
        <form onSubmit={onSave} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label>Company *</label>
            <input
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              placeholder="Company"
            />
          </div>

          <div>
            <label>First name</label>
            <input
              value={form.contact_first_name || ""}
              onChange={(e) => setForm((f) => ({ ...f, contact_first_name: e.target.value }))}
              placeholder="First name"
            />
          </div>
          <div>
            <label>Last name</label>
            <input
              value={form.contact_last_name || ""}
              onChange={(e) => setForm((f) => ({ ...f, contact_last_name: e.target.value }))}
              placeholder="Last name"
            />
          </div>

          <div>
            <label>Specialty</label>
            <input
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

          <div>
            <label>Email</label>
            <input
              type="email"
              value={form.email || ""}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label>Business phone</label>
            <input
              value={form.phone_business || ""}
              onChange={(e) => setForm((f) => ({ ...f, phone_business: e.target.value }))}
              placeholder="+30…"
            />
          </div>
          <div>
            <label>Cell phone</label>
            <input
              value={form.phone_cell || ""}
              onChange={(e) => setForm((f) => ({ ...f, phone_cell: e.target.value }))}
              placeholder="+30…"
            />
          </div>

          <div className="md:col-span-2">
            <label>Address</label>
            <input
              value={form.address || ""}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Street, number, city…"
            />
          </div>

          <div className="md:col-span-2">
            <label>Google Maps URL</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
              <input
                value={form.google_maps_url || ""}
                onChange={(e) => setForm((f) => ({ ...f, google_maps_url: e.target.value }))}
                placeholder="https://www.google.com/maps/…"
              />
              <Button
                type="button"
                onClick={() => setForm((f) => ({ ...f, google_maps_url: mapsFromAddress(f.address) }))}
              >
                From Address
              </Button>
            </div>
          </div>

          <div className="md:col-span-2 flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
