import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const diaryId = searchParams.get('diary');
  if (!diaryId) return NextResponse.json({}, { status: 400 });

  const sb = supabaseServer();
  const { data: photos, error } = await sb.from('diary_photos').select('storage_path').eq('diary_id', diaryId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const out: Record<string,string> = {};
  for (const ph of photos || []) {
    const { data } = await sb.storage.from('diary-photos').createSignedUrl(ph.storage_path, 60 * 10);
    if (data?.signedUrl) out[ph.storage_path] = data.signedUrl;
  }
  return NextResponse.json(out);
}
