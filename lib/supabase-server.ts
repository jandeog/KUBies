// lib/supabase-server.ts
// Handles Next 15 typing where cookies() may appear Promise-like.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function supabaseServer() {
  // Cast to any so we can call .get synchronously; if it's actually a Promise, we'll guard below.
  const cookieStore = cookies() as any;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            // If cookieStore is a Promise, it will have .then; avoid awaiting and just return undefined.
            if (cookieStore && typeof cookieStore.then === 'function') return undefined;
            const c = cookieStore?.get?.(name);
            return c?.value as string | undefined;
          } catch {
            return undefined;
          }
        },
        // (Optional) you can add set/remove later if you need SSR auth persistence
      }
    }
  );
}
