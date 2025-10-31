'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { MapPin, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Site = {
  id?: string;
  title: string;
  address?: string | null;
  employer?: string | null;
  maps_url?: string | null;
  vat?: string | null;
  tax_office?: string | null;
  archived?: boolean | null;
};

export default function SitesClient() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Inline form (no tabs)
  const [editing, setEditing] = useState<Site | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);

  const empty: Site = {
    title: '',
    address: '',
    employer: '',
    maps_url: '',
    vat: '',
    tax_office: '',
    archived: false,
  };

  async function load() {
    setLoading(true);
    const { data, error } = await sb
      .from('sites')
      .select('id, title, address, employer, maps_url, vat, tax_office, archived')
      .order('archived', { ascending: true })
      .order('title', { ascending: true });
    if (!error && data) setSites(data as Site[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (sites || [])
      .filter(s => (showArchived ? true : !s.archived))
      .filter(s => !q || `${s.title} ${s.address || ''}`.toLowerCase().includes(q));
  }, [sites, query, showArchived]);

  function startAdd() {
    setEditing({ ...empty });
    queueMicrotask(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  function startEdit(site: Site) {
    setEditing({ ...site });
    queueMicrotask(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  function cancelForm() {
    setEditing(null);
  }

  async function save(site: Site) {
    if (!site.title.trim()) return alert('Title is required');

    setSaving(true);
    const payload = {
      title: site.title.trim(),
      address: (site.address || '').trim() || null,
      employer: (site.employer || '').trim() || null,
      maps_url: (site.maps_url || '').trim() || null,
      vat: (site.vat || '').trim() || null,
      tax_office: (site.tax_office || '').trim() || null,
      archived: !!site.archived,
    };
    try {
      if (site.id) {
        const { error } = await sb.from('sites').update(payload).eq('id', site.id);
        if (error) throw error;
      } else {
        const { error } = await sb.from('sites').insert(payload);
        if (error) throw error;
      }
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive(site: Site) {
    if (!site.id) return;
    const { error } = await sb.from('sites').update({ archived: !site.archived }).eq('id', site.id);
    if (error) return alert(error.message);
    load();
  }

  async function remove(site: Site) {
    if (!site.id) return;
    if (!confirm(`Delete "${site.title}"? This cannot be undone.`)) return;
    const { error } = await sb.from('sites').delete().eq('id', site.id);
    if (error) return alert(error.message);
    load();
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Site Explorer</h1>
        <Button onClick={startAdd}>+ Add New</Button>
      </header>

{/* Controls — plain row, larger input, checkbox closer to input */}
<div className="px-1">
  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    {/* Bigger search input (no icon) */}
    <div className="w-full sm:w-[640px]">
      <input
        className="w-full h-11 rounded-lg border px-4 text-base"
        placeholder="Search sites..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>

    {/* Checkbox + label, immediately to the right on desktop */}
    <label className="inline-flex items-center gap-2 whitespace-nowrap">
      <input
        type="checkbox"
        checked={showArchived}
        onChange={(e) => setShowArchived(e.target.checked)}
      />
      <span>Show archived</span>
    </label>
  </div>
</div>



      {/* List (kept Subbies feel: partner-row + action-btn classes) */}
      <div className="grid gap-2 partners-list">
        {loading ? (
          <div className="p-4 opacity-70">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 opacity-70">No results.</div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="partner-row"
              onClick={() => startEdit(s)}
              role="button"
            >
              <div className="partner-left">
                <div className="partner-company">{s.title}</div>
                <div className="partner-name">{s.address || '—'}</div>
              </div>

              <div className="partner-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="action-btn"
                  aria-label="Open map"
                  aria-disabled={!s.maps_url}
                  onClick={() => s.maps_url && window.open(s.maps_url, '_blank')}
                  title="Open map"
                >
                  <MapPin className="action-icon" />
                </button>

                <button
                  className="action-btn"
                  aria-label={s.archived ? 'Unarchive' : 'Archive'}
                  onClick={() => toggleArchive(s)}
                  title={s.archived ? 'Unarchive' : 'Archive'}
                >
                  <Archive className="action-icon" />
                </button>

                <button
                  className="action-btn"
                  aria-label="Delete"
                  onClick={() => remove(s)}
                  title="Delete"
                >
                  <Trash2 className="action-icon" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inline edit form under the list */}
      <div ref={formRef} />
      {editing && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="md:col-span-2">
            <label>Title *</label>
            <input
              value={editing.title || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), title: e.target.value }))}
              placeholder="Title"
            />
          </div>

          <div>
            <label>Address</label>
            <input
              value={editing.address || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), address: e.target.value }))}
              placeholder="Street, number, city…"
            />
          </div>

          <div>
            <label>Employer</label>
            <input
              value={editing.employer || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), employer: e.target.value }))}
              placeholder="Employer"
            />
          </div>

          <div className="md:col-span-2">
            <label>Google Maps URL</label>
            <input
              value={editing.maps_url || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), maps_url: e.target.value }))}
              placeholder="https://maps.google.com/…"
            />
          </div>

          <div>
            <label>VAT</label>
            <input
              value={editing.vat || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), vat: e.target.value }))}
              placeholder="VAT"
            />
          </div>

          <div>
            <label>Tax Office</label>
            <input
              value={editing.tax_office || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), tax_office: e.target.value }))}
              placeholder="Tax Office"
            />
          </div>

          <div className="md:col-span-2 flex gap-2 justify-end">
            {/* EXACT Subbies buttons: Cancel (ghost) & Save with loading state */}
            <Button type="button" variant="ghost" onClick={cancelForm}>Cancel</Button>
            <Button type="button" onClick={() => save(editing || empty)} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
