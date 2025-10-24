import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeSessionToken } from './lib/verifySession';

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api')) return NextResponse.next();

  const token = req.cookies.get('sd_session')?.value ?? '';
  const session = token ? decodeSessionToken(token) : null;

  const res = NextResponse.next({ request: { headers: req.headers } });
  res.headers.set('X-Client-User-Id', session?.id ?? '');
  res.headers.set('X-Client-Username', session?.username ?? '');
  return res;
}

// export const config = { matcher: ['/api/:path*'] };
