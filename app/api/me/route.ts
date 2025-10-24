import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  const jar = await cookies();                                // <-- await
  const userId = jar.get('sd_session')?.value ?? null;        // προτιμώμενο: id
  const username = jar.get('app_username')?.value ?? null;    // εναλλακτικό: username

  if (!userId && !username) {
    return new Response(JSON.stringify({ user: null }), { status: 401 });
  }

  // Βάζουμε headers για RLS policies
  const supabase = createClient(url, anon, {
    global: {
      headers: {
        'X-Client-User-Id': userId ?? '',
        'X-Client-Username': username ?? '',
      },
    },
  });

  let q = supabase
    .from('app_users')
    .select('id,username,name,email,phone_number')
    .limit(1);

  if (userId) q = q.eq('id', userId);
  else q = q.eq('username', username!);

  const { data, error } = await q;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  const row = data?.[0] ?? null;
  if (!row) {
    return new Response(JSON.stringify({ user: null }), { status: 404 });
  }

  return new Response(JSON.stringify({ user: row }), {
    headers: { 'content-type': 'application/json' },
  });
}
