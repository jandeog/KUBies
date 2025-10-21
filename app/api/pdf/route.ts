import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { buildDiaryPdf } from '@/lib/pdf';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new Response('Missing id', { status: 400 });

  const sb = supabaseServer();
  const { data: diary } = await sb.from('diaries').select('*').eq('id', id).single();
  if (!diary) return new Response('Not found', { status: 404 });
  const { data: site } = await sb.from('sites').select('name,address').eq('id', diary.site_id).single();
  const { data: photos } = await sb.from('diary_photos').select('storage_path').eq('diary_id', id);

  const signed: string[] = [];
  for (const p of photos || []) {
    const { data } = await sb.storage.from('diary-photos').createSignedUrl(p.storage_path, 60);
    if (data?.signedUrl) signed.push(data.signedUrl);
  }

  const pdfBytes = await buildDiaryPdf({ diary, site, photoUrls: signed });
  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="diary-${diary.date}.pdf"`
    }
  });
}
