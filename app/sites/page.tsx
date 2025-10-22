'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Site = {
  id?: string;
  title: string;
  address?: string | null;
  employer?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  maps_url?: string | null;
  vat?: string | null;         // NEW
  tax_office?: string | null;  // NEW
  contact_name?: string | null;
  contact_phone?: string | null;
  start_date?: string | null; // yyyy-mm-dd
  end_date?: string | null;
  notes?: string | null;
  archived?: boolean;
  created_at?: string;
  updated_at?: string;
};

const sb = supabaseBrowser();

const [hoveredId, setHoveredId] = useState<string | null>(null);

export default function SiteExplorer() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // form state
  const empty: Site = {
    title: '',
    address: '',
    employer: '',
    latitude: undefined,
    longitude: undefined,
    maps_url: '',
    vat: '',             // NEW
    tax_office: '',      // NEW
    contact_name: '',
    contact_phone: '',
    start_date: '',
    end_date: '',
    notes: '',
    archived: false
  };
  const [editing, setEditing] = useState<Site | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await sb
      .from('sites')
      .select('*')
      .order('archived', { ascending: true })
      .order('title', { ascending: true });
    if (!error) setSites(data as Site[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (sites || [])
      .filter(s => (showArchived ? true : !s.archived))
      .filter(s => {
        if (!needle) return true;
        const hay = [s.title, s.address].join(' ').toLowerCase();
        return hay.includes(needle);
      });
  }, [sites, q, showArchived]);

  function startAdd() {
    setEditing({ ...empty });
  }
  function startEdit(site: Site) {
    setEditing({ ...site });
  }
  function cancelEdit() {
    setEditing(null);
  }

  async function save(site: Site) {
    // Normalize lat/lng from string inputs
    const payload: any = {
      ...site,
      latitude:
        site.latitude === undefined ||
        site.latitude === null ||
        (site.latitude as any) === ''
          ? null
          : Number(site.latitude),
      longitude:
        site.longitude === undefined ||
        site.longitude === null ||
        (site.longitude as any) === ''
          ? null
          : Number(site.longitude),
      // normalize empties to null for optional text fields
      address: site.address?.trim() || null,
      employer: site.employer?.trim() || null,
      maps_url: site.maps_url?.trim() || null,
      vat: site.vat?.trim() || null,             // NEW
      tax_office: site.tax_office?.trim() || null // NEW
    };

    if (!payload.title?.trim()) return alert('Title is required');

    if (site.id) {
      const { error } = await sb.from('sites').update(payload).eq('id', site.id);
      if (error) return alert(error.message);
    } else {
      const { data, error } = await sb.from('sites').insert(payload).select('id').single();
      if (error) return alert(error.message);
      site.id = data?.id;
    }
    setEditing(null);
    await load();
  }

  async function remove(id: string | undefined) {
    if (!id) return;
    if (!confirm('Delete this site?')) return;
    const { error } = await sb.from('sites').delete().eq('id', id);
    if (error) return alert(error.message);
    await load();
  }

  async function toggleArchive(site: Site) {
    if (!site.id) return;
    const { error } = await sb.from('sites').update({ archived: !site.archived }).eq('id', site.id);
    if (error) return alert(error.message);
    await load();
  }

  return (
    <div className="grid">
      <div className="card" style={{ position: 'sticky', top: 0 }}>
        <h2 style={{ marginTop: 4, marginBottom: 8 }}>Site Explorer</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            placeholder="Search sites…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
          <button onClick={startAdd}>+ Add Site</button>
        </div>
      </div>

      {loading && <div className="card">Loading…</div>}

{!loading && filtered.map(site => (
  <div
    className="card cursor-pointer"
    key={site.id}
    onMouseEnter={() => setHoveredId(site.id!)}
    onMouseLeave={() => setHoveredId(null)}
    onClick={() => startEdit(site)} // whole row opens the inline editor
    style={{
      backgroundColor: hoveredId === site.id ? 'rgba(16, 185, 129, 0.12)' : undefined,
      transition: 'background-color 120ms ease-in-out'
    }}
  >
    <div style={{display:'flex', justifyContent:'space-between', gap:12, alignItems:'start'}}>
      <div style={{minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <strong>{site.title}</strong>
          {site.archived ? <span className="badge">Archived</span> : null}
        </div>
        {site.address && <div style={{color:'var(--muted)'}}>{site.address}</div>}
        {/* keep or remove your extra badges as you prefer */}
      </div>

      <div style={{display:'flex', gap:8}}>
        {site.maps_url && (
          <a
            href={site.maps_url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()} // don't trigger row click
          >
            <button>Open Map</button>
          </a>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            startEdit(site);
          }}
        >
          Edit
        </button>

        <button
          onClick={async (e) => {
            e.stopPropagation();
            await toggleArchive(site);
          }}
        >
          {site.archived ? 'Unarchive' : 'Archive'}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            remove(site.id);
          }}
          style={{borderColor:'crimson', color:'crimson'}}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
))}


      {editing && (
        <div className="card">
          <h3>{editing.id ? 'Edit Site' : 'Add Site'}</h3>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))' }}>
            <div>
              <label>Title *</label>
              <input
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </div>
            <div>
              <label>Employer</label>
              <input
                value={editing.employer || ''}
                onChange={(e) => setEditing({ ...editing, employer: e.target.value })}
              />
            </div>
            <div>
              <label>Contact name</label>
              <input
                value={editing.contact_name || ''}
                onChange={(e) => setEditing({ ...editing, contact_name: e.target.value })}
              />
            </div>
            <div>
              <label>Contact phone</label>
              <input
                value={editing.contact_phone || ''}
                onChange={(e) => setEditing({ ...editing, contact_phone: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label>Address</label>
              <input
                value={editing.address || ''}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
              />
            </div>
            <div>
              <label>Latitude</label>
              <input
                inputMode="decimal"
                value={editing.latitude ?? ''}
                onChange={(e) => setEditing({ ...editing, latitude: e.target.value as any })}
              />
            </div>
            <div>
              <label>Longitude</label>
              <input
                inputMode="decimal"
                value={editing.longitude ?? ''}
                onChange={(e) => setEditing({ ...editing, longitude: e.target.value as any })}
              />
            </div>

            <div style={{ gridColumn: '1/-1' }}>
              <label>Google Maps URL (optional)</label>
              <input
                value={editing.maps_url || ''}
                onChange={(e) => setEditing({ ...editing, maps_url: e.target.value })}
              />
            </div>

            {/* VAT */}
<div>
  <label>VAT</label>
  <input
    value={editing.vat || ''}
    onChange={(e) => setEditing({ ...editing, vat: e.target.value })}
  />
</div>

{/* Tax Office */}
<div>
  <label>Tax Office</label>
  <input
    value={editing.tax_office || ''}
    onChange={(e) => setEditing({ ...editing, tax_office: e.target.value })}
  />
</div>

{/* NEW: Dates on the next line */}
<div
  style={{
    gridColumn: '1 / -1', // force a new full-width row
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  }}
>
  <div>
    <label>Start date</label>
    <input
      type="date"
      value={editing.start_date || ''}
      onChange={(e) => setEditing({ ...editing, start_date: e.target.value })}
    />
  </div>

  <div>
    <label>End date</label>
    <input
      type="date"
      value={editing.end_date || ''}
      onChange={(e) => setEditing({ ...editing, end_date: e.target.value })}
    />
  </div>

            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label>Notes</label>
              <textarea
                rows={3}
                value={editing.notes || ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, gridColumn: '1/-1', justifyContent: 'flex-end' }}>
              <button onClick={cancelEdit}>Cancel</button>
              <button onClick={() => save(editing!)}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
