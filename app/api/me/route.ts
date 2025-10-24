// app/api/me/route.ts
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { decodeSessionToken } from '@/lib/verifySession';

// Avoid ISR caching on API
export const dynamic = 'force-dynamic';

export async function GET() {
  // 1) Read cookie & decode JWT
  const jar = await cookies();
  const token = jar.get('sd_session')?.value;
  const session = decodeSessionToken(token);
  if (!session) {
    return new Response(JSON.stringify({ user: null }), { status: 401 });
  }

  // 2) Init Supabase with identity headers for RLS
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return new Response(
      JSON.stringify({ error: 'Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY' }),
      { status: 500 },
    );
  }

  const sb = createClient(url, anon, {
    global: {
      headers: {
        'X-Client-User-Id': session.id ?? '',
        'X-Client-Username': session.username ?? '',
      },
    },
  });

  // 3) Query app_users by id (preferred) or username (fallback)
  let q = sb.from('app_users')
    .select('id,username,name,email,phone_number,is_active,role')
    .limit(1);

  if (session.id) q = q.eq('id', session.id);
  else if (session.username) q = q.eq('username', session.username);

  const { data, error } = await q;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const user = data?.[0] ?? null;
  if (!user) {
    return new Response(JSON.stringify({ user: null }), { status: 404 });
  }

  return new Response(JSON.stringify({ user }), {
    headers: { 'content-type': 'application/json' },
  });
}
