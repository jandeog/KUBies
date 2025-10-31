'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  Archive,
  Trash2,
  Plus,
  Search,
  FileEdit,
  RefreshCcw,
} from 'lucide-react';

type Site = {
  id?: string;
  title: string;
  address?: string | null;
  employer?: string | null;
  maps_url?: string | null;
  vat?: string | null;
  tax_office?: string | null;
  archived?: boolean;
};

export default function SitesClient() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [adding, setAdding] = useState(false);

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
      .select('*')
      .order('archived', { ascending: true })
      .order('title', { ascending: true });
    if (!error && data) setSites(data as Site[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (sites || [])
      .filter((s) => (showArchived ? true : !s.archived))
      .filter((s) => {
        if (!q) return true;
        const hay = `${s.title} ${s.address || ''}`.toLowerCase();
        return hay.includes(q);
      });
  }, [sites, query, showArchived]);

  async function save(site: Site) {
    if (!site.title.trim()) {
      alert('Title is required');
      return;
    }
    const payload = { ...site };
    if (site.id) {
      await sb.from('sites').update(payload).eq('id', site.id);
    } else {
      await sb.from('sites').insert(payload);
    }
    setEditing(null);
    setAdding(false);
    load();
  }

  async function toggleArchive(site: Site) {
    if (!site.id) return;
    await sb
      .from('sites')
      .update({ archived: !site.archived })
      .eq('id', site.id);
    load();
  }

  async function remove(site: Site) {
    if (!site.id) return;
    if (!confirm(`Delete ${site.title}? This cannot be undone.`)) return;
    await sb.from('sites').delete().eq('id', site.id);
    load();
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Site Explorer</h1>
        <Button onClick={() => setAdding((v) => !v)} size="sm">
          {adding ? <RefreshCcw className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </Button>
      </header>

      {/* Controls */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row sm:items-center gap-3 p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
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

      {/* Add/Edit Form as tab section */}
      {(adding || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing ? 'Edit Site' : 'Add New Site'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save(editing || empty);
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <Input
                placeholder="Title *"
                value={editing?.title || ''}
                onChange={(e) =>
                  setEditing((prev) => ({ ...(prev || empty), title: e.target.value }))
                }
              />
              <Input
                placeholder="Address"
                value={editing?.address || ''}
                onChange={(e) =>
                  setEditing((prev) => ({ ...(prev || empty), address: e.target.value }))
                }
              />
              <Input
                placeholder="Employer"
                value={editing?.employer || ''}
                onChange={(e) =>
                  setEditing((prev) => ({ ...(prev || empty), employer: e.target.value }))
                }
              />
              <Input
                placeholder="Google Maps URL"
                value={editing?.maps_url || ''}
                onChange={(e) =>
                  setEditing((prev) => ({ ...(prev || empty), maps_url: e.target.value }))
                }
              />
              <Input
                placeholder="VAT"
                value={editing?.vat || ''}
                onChange={(e) =>
                  setEditing((prev) => ({ ...(prev || empty), vat: e.target.value }))
                }
              />
              <Input
                placeholder="Tax Office"
                value={editing?.tax_office || ''}
                onChange={(e) =>
                  setEditing((prev) => ({ ...(prev || empty), tax_office: e.target.value }))
                }
              />
              <div className="md:col-span-2 flex gap-2 mt-2">
                <Button type="submit" size="sm">
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAdding(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Sites ({loading ? '…' : filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-3 text-gray-500">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-3 text-gray-500">No results found.</div>
          ) : (
            <ul className="divide-y">
              {filtered.map((site) => (
                <li
                  key={site.id}
                  onClick={() => setEditing(site)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-emerald-50 rounded-lg px-2 cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{site.title}</div>
                    <div className="text-sm opacity-80 truncate">
                      {site.address}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {site.maps_url && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(site.maps_url!, '_blank');
                        }}
                      >
                        <MapPin className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleArchive(site);
                      }}
                    >
                      <Archive className={`w-4 h-4 ${site.archived ? 'text-amber-600' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(site);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
