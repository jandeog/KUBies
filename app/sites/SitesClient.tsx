'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { MapPin, Archive, Trash2, Plus, Search } from 'lucide-react';

type Site = {
  id?: string;
  title: string;
  address?: string | null;
  employer?: string | null;
  maps_url?: string | null;
  vat?: string | null;
  tax_office?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  archived?: boolean | null;
};

export default function SitesClient() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [editing, setEditing] = useState<Site | null>(null);        // open form inline
  const formRef = useRef<HTMLDivElement | null>(null);

  const empty: Site = {
    title: '',
    address: '',
    employer: '',
    maps_url: '',
    vat: '',
    tax_office: '',
    start_date: '',
    end_date: '',
    notes: '',
    archived: false,
  };

  async function load() {
    setLoading(true);
    const { data, error } = await sb
      .from('sites')
      .select('id, title, address, employer, maps_url, vat, tax_office, start_date, end_date, notes, archived')
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

    const payload = {
      title: site.title.trim(),
      address: (site.address || '').trim() || null,
      employer: (site.employer || '').trim() || null,
      maps_url: (site.maps_url || '').trim() || null,
      vat: (site.vat || '').trim() || null,
      tax_office: (site.tax_office || '').trim() || null,
      start_date: site.start_date || null,
      end_date: site.end_date || null,
      notes: (site.notes || '').trim() || null,
      archived: !!site.archived,
    };

    if (site.id) {
      const { error } = await sb.from('sites').update(payload).eq('id', site.id);
      if (error) return alert(error.message);
    } else {
      const { error } = await sb.from('sites').insert(payload);
      if (error) return alert(error.message);
    }
    setEditing(null);
    load();
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
        <button
          onClick={startAdd}
          className="h-9 w-9 grid place-content-center rounded-lg border transition hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
          aria-label="Add site"
          title="Add site"
        >
          <Plus className="h-4 w-4" />
        </button>
      </header>

      {/* Controls */}
      <div className="rounded-xl border p-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-50" />
            <input
              className="w-full rounded-lg border px-3 py-2 pl-9"
              placeholder="Search sites..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border">
        <div className="border-b p-3 font-semibold">Sites ({loading ? '…' : filtered.length})</div>
        <div className="p-2">
          {loading ? (
            <div className="p-3 text-gray-500">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-gray-500">No results.</div>
          ) : (
            <ul className="space-y-2">
              {filtered.map((s) => (
                <li
                  key={s.id}
                  onClick={() => startEdit(s)}
                  className="rounded-lg border p-3 cursor-pointer transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.title}</div>
                      <div className="text-sm opacity-80 truncate">{s.address || '—'}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Map */}
                      <button
                        className="h-9 w-9 grid place-content-center rounded-lg border transition hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-40"
                        onClick={() => s.maps_url && window.open(s.maps_url, '_blank')}
                        disabled={!s.maps_url}
                        aria-label="Open map"
                        title="Open map"
                      >
                        <MapPin className="h-4 w-4" />
                      </button>
                      {/* Archive */}
                      <button
                        className="h-9 w-9 grid place-content-center rounded-lg border transition hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        onClick={() => toggleArchive(s)}
                        aria-label={s.archived ? 'Unarchive' : 'Archive'}
                        title={s.archived ? 'Unarchive' : 'Archive'}
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      {/* Delete */}
                      <button
                        className="h-9 w-9 grid place-content-center rounded-lg border transition hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        onClick={() => remove(s)}
                        aria-label="Delete"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Inline form under the list */}
      <div ref={formRef} />
      {editing && (
        <div className="rounded-xl border p-3">
          <h3 className="text-lg font-semibold mb-3">{editing.id ? 'Edit Site' : 'Add Site'}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm">Title *</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={editing.title || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), title: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm">Address</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={editing.address || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), address: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm">Employer</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={editing.employer || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), employer: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm">Google Maps URL</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={editing.maps_url || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), maps_url: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm">VAT</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={editing.vat || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), vat: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm">Tax Office</label>
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={editing.tax_office || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), tax_office: e.target.value }))}
              />
            </div>

            {/* Start/End date on the next line after Tax Office */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm">Start date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border px-3 py-2"
                  value={editing.start_date || ''}
                  onChange={(e) => setEditing((p) => ({ ...(p || empty), start_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm">End date</label>
                <input
                  type="date"
                  className="w-full rounded-lg border px-3 py-2"
                  value={editing.end_date || ''}
                  onChange={(e) => setEditing((p) => ({ ...(p || empty), end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm">Notes</label>
              <textarea
                rows={3}
                className="w-full rounded-lg border px-3 py-2"
                value={editing.notes || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), notes: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-1">
              <button
                onClick={cancelForm}
                className="rounded-lg border px-3 py-2 transition hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              >
                Cancel
              </button>
              <button
                onClick={() => save(editing || empty)}
                className="rounded-lg border px-3 py-2 transition hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
