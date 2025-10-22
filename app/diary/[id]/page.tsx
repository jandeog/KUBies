// @ts-nocheck
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';
import { useTheme } from 'next-themes';
// shadcn/ui (available per project instructions)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload, Camera } from 'lucide-react';

const sb = supabaseBrowser();

// ----- Types -----
type Photo = { id: string; storage_path: string };
type Diary = {
  id: string;
  date: string;
  weather: string | null;
  activities: string | null;
  notes: string | null;
  site_id: string | null;
};

type Site = {
  id: string;
  title?: string | null; // some rows may have `title`
  name?: string | null; // some rows may have `name`
  address?: string | null;
  // any of these may exist depending on schema maturity
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  google_maps_pin?: string | null; // e.g. "37.98,23.72"
};

// ----- Helpers -----
function coalesceSiteName(s: Site) {
  return s?.title || s?.name || 'Untitled site';
}

function extractCoords(site?: Site): { lat: number | null; lon: number | null } {
  if (!site) return { lat: null, lon: null };
  const lat = site.lat ?? site.latitude ?? null;
  const lon = site.lng ?? site.longitude ?? null;
  if (lat != null && lon != null) return { lat, lon };
  if (site.google_maps_pin) {
    const [a, b] = site.google_maps_pin.split(',').map((v) => parseFloat(v.trim()));
    if (Number.isFinite(a) && Number.isFinite(b)) return { lat: a, lon: b };
  }
  return { lat: null, lon: null };
}

function wmoToText(code?: number) {
  // very small mapping for the most common codes
  const map: Record<number, string> = {
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Heavy rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
  };
  return code != null ? (map[code] || `Code ${code}`) : '—';
}

export default function DiaryView({ params }: { params: { id: string } }) {
  const { theme } = useTheme();
  const [diary, setDiary] = useState<Diary | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Weather
  const [weatherNow, setWeatherNow] = useState<
    | { temp: number; wind: number; code: number; text: string }
    | null
  >(null);
  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedSiteId) || null,
    [sites, selectedSiteId]
  );

  // ----- Bootstrap -----
  useEffect(() => {
    (async () => {
      // Load diary
      const { data: d } = await sb
        .from('diaries')
        .select('*')
        .eq('id', params.id)
        .single();
      setDiary(d as any);
      if (d?.site_id) setSelectedSiteId(d.site_id);

      // Load photos
      const { data: p } = await sb
        .from('diary_photos')
        .select('id,storage_path')
        .eq('diary_id', params.id);
      setPhotos(p || []);

      // Prefetch public URLs for photos
      const map: Record<string, string> = {};
      (p || []).forEach((ph) => {
        const { data } = sb.storage
          .from('diary-photos')
          .getPublicUrl(ph.storage_path);
        map[ph.storage_path] = data.publicUrl;
      });
      setUrls(map);

      // Load sites for dropdown
      const { data: s } = await sb
        .from('sites')
        .select(
          'id, title, name, address, lat, lng, latitude, longitude, google_maps_pin'
        )
        .order('title', { ascending: true });
      setSites(s || []);
    })();
  }, [params.id]);

  // ----- Weather fetch when site changes -----
  useEffect(() => {
    (async () => {
      if (!selectedSite) return setWeatherNow(null);
      const { lat, lon } = extractCoords(selectedSite);
      if (lat == null || lon == null) return setWeatherNow(null);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m`;
        const res = await fetch(url);
        const json = await res.json();
        const curr = json?.current || {};
        const code = Number(curr.weather_code);
        const temp = Number(curr.temperature_2m);
        const wind = Number(curr.wind_speed_10m);
        setWeatherNow({ temp, wind, code, text: wmoToText(code) });
      } catch (e) {
        console.error('weather fetch failed', e);
        setWeatherNow(null);
      }
    })();
  }, [selectedSiteId, selectedSite?.google_maps_pin, selectedSite?.lat, selectedSite?.lng]);

  // ----- Handlers -----
  const handleSiteChange = async (siteId: string) => {
    setSelectedSiteId(siteId);
    if (!diary) return;
    // Persist selection to diary
    await sb.from('diaries').update({ site_id: siteId }).eq('id', diary.id);
  };

  const handleWriteWeatherToDiary = async () => {
    if (!diary || !weatherNow) return;
    const text = `${weatherNow.text}, ${weatherNow.temp.toFixed(1)}°C, wind ${weatherNow.wind.toFixed(0)} km/h`;
    await sb.from('diaries').update({ weather: text }).eq('id', diary.id);
    setDiary((d) => (d ? { ...d, weather: text } : d));
  };

  const handleUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (!diary) return;
    const files = Array.from(ev.target.files || []);
    if (!files.length) return;
    setIsUploading(true);
    try {
      for (const file of files) {
        const path = `${diary.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const { error: upErr } = await sb.storage
          .from('diary-photos')
          .upload(path, file, { upsert: false, cacheControl: '3600' });
        if (upErr) throw upErr;
        const { data: row, error: insErr } = await sb
          .from('diary_photos')
          .insert({ diary_id: diary.id, storage_path: path })
          .select('id,storage_path')
          .single();
        if (insErr) throw insErr;
        setPhotos((prev) => [row as any, ...prev]);
        const { data } = sb.storage.from('diary-photos').getPublicUrl(path);
        setUrls((m) => ({ ...m, [path]: data.publicUrl }));
      }
    } catch (e) {
      console.error('upload failed', e);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // clear input value so same file can be chosen again if needed
      ev.target.value = '';
    }
  };

  if (!diary)
    return (
      <div className="p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left column: meta */}
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <CardTitle className="text-xl">Diary — {diary.date}</CardTitle>

          {/* Themed Site dropdown (dark/light aware via Tailwind classes) */}
          <div className="flex flex-col gap-2">
            <label className="text-sm opacity-80">Site</label>
            <Select value={selectedSiteId || ''} onValueChange={handleSiteChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a site" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {coalesceSiteName(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Theme: <span className="font-mono">{theme}</span> — menu auto-matches for readability.
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <div className="text-sm font-medium">Weather (live from site)</div>
            {weatherNow ? (
              <div className="mt-1 text-sm">
                {weatherNow.text} · {weatherNow.temp.toFixed(1)}°C · wind {weatherNow.wind.toFixed(0)} km/h
                <div className="mt-2">
                  <Button size="sm" onClick={handleWriteWeatherToDiary}>
                    Save to diary weather
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">
                Choose a site with coordinates to fetch current conditions.
              </div>
            )}
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p>
              <strong>Stored Weather:</strong> {diary.weather || <em>— not saved yet —</em>}
            </p>
            <p>
              <strong>Activities:</strong>
              <br />
              {diary.activities || <em>—</em>}
            </p>
            <p>
              <strong>Notes:</strong>
              <br />
              {diary.notes || <em>—</em>}
            </p>
          </div>

          <a href={`/api/pdf?id=${diary.id}`} className="w-fit">
            <Button variant="secondary">Export PDF</Button>
          </a>
        </CardContent>
      </Card>

      {/* Right column: photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Photos</span>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                // Mobile camera first; still allows picking from library on most devices
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
              <Button size="sm" type="button" variant="default" asChild>
                <span>
                  <Camera className="mr-2 h-4 w-4" /> Add photo
                </span>
              </Button>
            </label>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isUploading && (
            <div className="mb-3 text-sm inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
            </div>
          )}

          {photos.length === 0 ? (
            <div className="text-sm text-muted-foreground">No photos yet.</div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {photos.map((ph) => (
                <img
                  key={ph.id}
                  src={urls[ph.storage_path]}
                  alt=""
                  className="w-full rounded-2xl object-cover aspect-square"
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
