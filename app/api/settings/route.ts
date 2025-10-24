import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { verifySessionToken } from '@/lib/verifySession';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, anon);

export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get('sd_session')?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
  }

  const { id, username } = session;
  const body = await req.json().catch(() => ({}));
  const { name, email, phone_number } = body || {};

  let up = supabase
    .from('app_users')
    .update({ name, email, phone_number });

  if (id) up = up.eq('id', id);
  else up = up.eq('username', username!);

  const { error } = await up;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
}
