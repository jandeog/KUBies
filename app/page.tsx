'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';


const sb = supabaseBrowser();

type Site = { id: string; name: string };
type Diary = { id: string; date: string; site_id: string; weather: string | null; activities: string | null };

export default function Page() {
  const [sites, setSites] = useState<Site[]>([]);
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [siteId, setSiteId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [weather, setWeather] = useState('');
  const [activities, setActivities] = useState('');
  const [notes, setNotes] = useState('');
  const [fileList, setFileList] = useState<FileList | null>(null);

  useEffect(() => {
    (async () => {
      
      const { data: sitesData } = await sb.from('sites').select('id,name').order('name');
      setSites(sitesData || []);
      const { data: diariesData } = await sb.from('diaries').select('id,date,site_id,weather,activities').order('date', { ascending: false }).limit(50);
      setDiaries(diariesData || []);
    })();
  }, []);

  async function createDiary() {
    if (!siteId) return alert('Select site');
    const { data, error } = await sb.from('diaries').insert({ site_id: siteId, date, weather, activities, notes }).select('id').single();
    if (error) return alert(error.message);
    const diaryId = data!.id as string;
    if (fileList && fileList.length) {
      for (const file of Array.from(fileList)) {
        const path = `${diaryId}/${Date.now()}-${file.name}`;
        const { error: upErr } = await sb.storage.from('diary-photos').upload(path, file, { upsert: false, cacheControl: '3600' });
        if (upErr) { alert(upErr.message); continue; }
        await sb.from('diary_photos').insert({ diary_id: diaryId, storage_path: path });
      }
    }
    location.href = `/diary/${diaryId}`;
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>KUBE Contractors — Sign in</h2>
        <label>Site</label>
        <select value={siteId} onChange={(e)=>setSiteId(e.target.value)}>
          <option value="">Select…</option>
          {sites.map(s=> <option value={s.id} key={s.id}>{s.name}</option>)}
        </select>
        <label>Date</label>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
        <label>Weather</label>
        <input value={weather} onChange={(e)=>setWeather(e.target.value)} placeholder="Sunny, 24°C" />
        <label>Activities</label>
        <textarea value={activities} onChange={(e)=>setActivities(e.target.value)} rows={3} />
        <label>Notes</label>
        <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} rows={3} />
        <label>Photos</label>
        <input type="file" accept="image/*" multiple capture="environment" onChange={(e)=>setFileList(e.target.files)} />
        <button onClick={createDiary}>Save</button>
      </div>

      <div className="card">
        <h2>Recent diaries</h2>
        {diaries.map(d => (
          <div key={d.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #eee'}}>
            <div>
              <div><strong>{d.date}</strong> — {d.activities?.slice(0,80)}</div>
            </div>
            <a href={`/diary/${d.id}`} style={{ textDecoration:'none' }}>Open →</a>
          </div>
        ))}
      </div>
    </div>
  );
}
