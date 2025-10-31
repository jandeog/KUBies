'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

  // tabs: flat text with underline
  const [tab, setTab] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<Site | null>(null);

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
    setTab('form');
  }
  function startEdit(site: Site) {
    setEditing({ ...site });
    setTab('form');
  }
  function cancelForm() {
    setEditing(null);
    setTab('list');
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
    setTab('list');
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
        <Button size="icon" onClick={startAdd} aria-label="Add">
          <Plus className="w-4 h-4" />
        </Button>
      </header>

      {/* Tabs (flat, underline only) */}
      <nav className="border-b flex items-center gap-6">
        <button
          className={`pb-2 -mb-px border-b-2 text-sm ${
            tab === 'list' ? 'border-emerald-500' : 'border-transparent opacity-70 hover:opacity-100'
          }`}
          onClick={() => setTab('list')}
        >
          List
        </button>
        <button
          className={`pb-2 -mb-px border-b-2 text-sm ${
            tab === 'form' ? 'border-emerald-500' : 'border-transparent opacity-70 hover:opacity-100'
          }`}
          onClick={() => { if (!editing) setEditing({ ...empty }); setTab('form'); }}
        >
          Form
        </button>
      </nav>

      {/* Controls (same feel as Subbies) */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 opacity-50" />
            <Input
              className="pl-9"
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
        </CardContent>
      </Card>

      {/* LIST TAB */}
      {tab === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>Sites ({loading ? '…' : filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-3 opacity-70">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-3 opacity-70">No results.</div>
            ) : (
              <ul className="divide-y">
                {filtered.map((s) => (
                  <li
                    key={s.id}
                    className="py-3 flex items-center justify-between gap-3 cursor-pointer"
                    onClick={() => startEdit(s)}
                  >
                    <div className="min-w-0">
                      <div className="font-medium truncate">{s.title}</div>
                      <div className="text-sm opacity-80 truncate">{s.address || '—'}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {s.maps_url && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => window.open(s.maps_url!, '_blank')}
                          aria-label="Open map"
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleArchive(s)}
                        aria-label={s.archived ? 'Unarchive' : 'Archive'}
                      >
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(s)}
                        aria-label="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* FORM TAB */}
      {tab === 'form' && (
        <Card>
          <CardHeader>
            <CardTitle>{editing?.id ? 'Edit Site' : 'Add Site'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); save(editing || empty); }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <Input
                placeholder="Title *"
                value={editing?.title || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), title: e.target.value }))}
              />
              <Input
                placeholder="Address"
                value={editing?.address || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), address: e.target.value }))}
              />
              <Input
                placeholder="Employer"
                value={editing?.employer || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), employer: e.target.value }))}
              />
              <Input
                placeholder="Google Maps URL"
                value={editing?.maps_url || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), maps_url: e.target.value }))}
              />
              <Input
                placeholder="VAT"
                value={editing?.vat || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), vat: e.target.value }))}
              />
              <Input
                placeholder="Tax Office"
                value={editing?.tax_office || ''}
                onChange={(e) => setEditing((p) => ({ ...(p || empty), tax_office: e.target.value }))}
              />

              {/* Dates below Tax Office */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  type="date"
                  value={editing?.start_date || ''}
                  onChange={(e) => setEditing((p) => ({ ...(p || empty), start_date: e.target.value }))}
                />
                <Input
                  type="date"
                  value={editing?.end_date || ''}
                  onChange={(e) => setEditing((p) => ({ ...(p || empty), end_date: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <textarea
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Notes"
                  value={editing?.notes || ''}
                  onChange={(e) => setEditing((p) => ({ ...(p || empty), notes: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={cancelForm}>Cancel</Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
