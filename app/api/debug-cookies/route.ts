// app/api/debug-cookies/route.ts
import { cookies } from 'next/headers';

export async function GET() {
  const jar = await cookies(); // ΠΡΟΣΟΧΗ: await
  const all = jar.getAll().map(c => ({
    name: c.name,
    value_preview: (c.value ?? '').slice(0, 12), // για λόγους ασφάλειας, μόνο preview
  }));
  return new Response(JSON.stringify({ cookies: all }, null, 2), {
    headers: { 'content-type': 'application/json' },
  });
}
