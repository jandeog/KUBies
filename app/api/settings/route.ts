import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, email, phone_number } = body || {};

  const jar = await cookies();                                // <-- await
  const userId = jar.get('sd_session')?.value ?? null;
  const username = jar.get('app_username')?.value ?? null;

  if (!userId && !username) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
  }

  const supabase = createClient(url, anon, {
    global: {
      headers: {
        'X-Client-User-Id': userId ?? '',
        'X-Client-Username': username ?? '',
      },
    },
  });

  let up = supabase
    .from('app_users')
    .update({
      name: name ?? null,
      email: email ?? null,
      phone_number: phone_number ?? null,
    });

  if (userId) up = up.eq('id', userId);
  else up = up.eq('username', username!);

  const { error } = await up;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
}
