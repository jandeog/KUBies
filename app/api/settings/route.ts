// app/api/settings/route.ts
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { decodeSessionToken } from '@/lib/verifySession';

export const dynamic = 'force-dynamic';

function clientWithIdentity(id?: string, username?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  return createClient(url, anon, {
    global: {
      headers: {
        'X-Client-User-Id': id ?? '',
        'X-Client-Username': username ?? '',
      },
    },
  });
}

// GET: let you open /api/settings without a 405; returns same as /api/me
export async function GET() {
  const jar = await cookies();
  const token = jar.get('sd_session')?.value;
  const session = decodeSessionToken(token);
  if (!session) {
    return new Response(JSON.stringify({ user: null }), { status: 401 });
  }

  try {
    const sb = clientWithIdentity(session.id, session.username);
    let q = sb.from('app_users')
      .select('id,username,name,email,phone_number,is_active,role')
      .limit(1);

    if (session.id) q = q.eq('id', session.id);
    else if (session.username) q = q.eq('username', session.username);

    const { data, error } = await q;
    if (error) throw error;

    const user = data?.[0] ?? null;
    if (!user) return new Response(JSON.stringify({ user: null }), { status: 404 });

    return new Response(JSON.stringify({ user }), { headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Server error' }), { status: 500 });
  }
}

// POST: update name/email/phone_number for the current user
export async function POST(req: Request) {
  const jar = await cookies();
  const token = jar.get('sd_session')?.value;
  const session = decodeSessionToken(token);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, email, phone_number } = body || {};

  try {
    const sb = clientWithIdentity(session.id, session.username);

    let up = sb.from('app_users').update({
      name: name ?? null,
      email: email ?? null,
      phone_number: phone_number ?? null,
    });

    if (session.id) up = up.eq('id', session.id);
    else if (session.username) up = up.eq('username', session.username);

    const { error } = await up;
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Update failed' }), { status: 400 });
  }
}
