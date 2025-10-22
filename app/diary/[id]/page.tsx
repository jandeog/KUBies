// @ts-nocheck
'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

const sb = supabaseBrowser();

type Photo = { id: string; storage_path: string };
type Diary = { id: string; date: string; weather: string | null; activities: string | null; notes: string | null; site_id: string };

export default function DiaryView({ params }: any) {
  const [diary, setDiary] = useState<Diary | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [urls, setUrls] = useState<Record<string,string>>({});
  // rest of file unchanged…


  useEffect(() => {
    (async () => {
      const { data: d } = await sb.from('diaries').select('*').eq('id', params.id).single();
      setDiary(d as any);
      const { data: p } = await sb.from('diary_photos').select('id,storage_path').eq('diary_id', params.id);
      setPhotos(p || []);
      <img
  key={ph.id}
  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/diary-photos/${ph.storage_path}`}
  alt=""
  style={{ width:'100%', borderRadius:12, objectFit:'cover', aspectRatio:'1/1' }}
/>

      const map = await res.json();
      setUrls(map);
    })();
  }, [params.id]);

  if (!diary) return <div className="card">Loading…</div>;

  return (
    <div className="grid">
      <div className="card">
        <h2>{diary.date}</h2>
        <p><strong>Weather:</strong> {diary.weather}</p>
        <p><strong>Activities:</strong><br /> {diary.activities}</p>
        <p><strong>Notes:</strong><br /> {diary.notes}</p>
        <a href={`/api/pdf?id=${diary.id}`}><button>Export PDF</button></a>
      </div>
      <div className="card">
        <h3>Photos</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {photos.map(ph => (
            <img key={ph.id} src={urls[ph.storage_path]} alt="" style={{ width:'100%', borderRadius:12, objectFit:'cover', aspectRatio:'1/1' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
