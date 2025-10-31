'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  archived?: boolean | null;
};

export default function SitesClient() {
  const sb = useMemo(() => supabaseBrowser(), []);

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // “tab form” behavior
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<Site | null>(null);

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
    setActiveTab('form');
  }
  function startEdit(site: Site) {
    setEditing({ ...site });
    setActiveTab('form');
  }
  function cancelForm() {
    setEditing(null);
    setActiveTab('list');
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
    setActiveTab('list');
    load();
  }

  async function toggleArchive(site: Site) {
    if (!site.id) return;
    const { error } = await sb
      .from('sites')
      .update({ archived: !site.archived })
      .eq('id', site.id);
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
        <button className="action-btn" onClick={startAdd} aria-label="Add">
          <Plus className="action-icon" />
        </button>
      </header>

      {/* Tiny tab bar */}
      <div className="flex items-center gap-6">
        <button
          className="action-btn"
          onClick={() => setActiveTab('list')}
          aria-pressed={activeTab === 'list'}
          style={activeTab === 'list' ? {
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            borderColor: 'var(--accent)'
          } : undefined}
        >
          List
        </button>
        <button
          className="action-btn"
          onClick={() => { if (!editing) setEditing({ ...empty }); setActiveTab('form'); }}
          aria-pressed={activeTab === 'form'}
          style={activeTab === 'form' ? {
            background: 'var(--accent)',
            color: 'var(--accent-ink)',
            borderColor: 'var(--accent)'
          } : undefined}
        >
          Form
        </button>
      </div>

      {/* LIST TAB */}
      {activeTab === 'list' && (
        <>
          {/* Controls */}
          <div className="partner-row" style={{ padding: 12 }}>
            <div className="relative flex-1">
              <Search className="action-icon" style={{ position: 'absolute', left: 12, top: 10, opacity: .5 }} />
              <input
                className="pl-9"
                placeholder="Search sites…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2" style={{ marginLeft: 12 }}>
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Show archived
            </label>
          </div>

          {/* List */}
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
                  {/* Left: title + address */}
                  <div className="partner-left">
                    <div className="partner-company">{s.title}</div>
                    <div className="partner-name">{s.address || '—'}</div>
                  </div>

                  {/* Right: icon actions (stop bubbling) */}
                  <div className="partner-actions" onClick={(e) => e.stopPropagation()}>
                    {/* Open Map */}
                    <button
                      className="action-btn"
                      aria-label="Open map"
                      aria-disabled={!s.maps_url}
                      onClick={() => s.maps_url && window.open(s.maps_url, '_blank')}
                    >
                      <MapPin className="action-icon" />
                    </button>

                    {/* Archive / Unarchive */}
                    <button
                      className="action-btn"
                      aria-label={s.archived ? 'Unarchive' : 'Archive'}
                      onClick={() => toggleArchive(s)}
                      title={s.archived ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="action-icon" />
                    </button>

                    {/* Delete */}
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
        </>
      )}

      {/* FORM TAB */}
      {activeTab === 'form' && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="md:col-span-2">
            <label>Title *</label>
            <input
              value={editing?.title || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), title: e.target.value }))}
              placeholder="Title"
            />
          </div>

          <div>
            <label>Address</label>
            <input
              value={editing?.address || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), address: e.target.value }))}
              placeholder="Street, number, city…"
            />
          </div>

          <div>
            <label>Employer</label>
            <input
              value={editing?.employer || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), employer: e.target.value }))}
              placeholder="Employer"
            />
          </div>

          <div className="md:col-span-2">
            <label>Google Maps URL</label>
            <input
              value={editing?.maps_url || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), maps_url: e.target.value }))}
              placeholder="https://maps.google.com/…"
            />
          </div>

          <div>
            <label>VAT</label>
            <input
              value={editing?.vat || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), vat: e.target.value }))}
              placeholder="VAT"
            />
          </div>

          <div>
            <label>Tax Office</label>
            <input
              value={editing?.tax_office || ''}
              onChange={(e) => setEditing((p) => ({ ...(p || empty), tax_office: e.target.value }))}
              placeholder="Tax Office"
            />
          </div>

          <div className="md:col-span-2 flex gap-2 justify-end">
            <button className="action-btn" onClick={cancelForm}>Cancel</button>
            <button
              className="action-btn"
              onClick={() => save(editing || empty)}
              style={{ background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
