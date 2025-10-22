import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/login',
  '/favicon.ico',
  '/robots.txt'
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next internals & static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('sd_session')?.value;
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  try {
    const secret = new TextEncoder().encode(process.env.APP_JWT_SECRET!);
    await jwtVerify(token, secret); // throws if invalid/expired
    return NextResponse.next();
  } catch {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/((?!api/logout).*)'], // protect everything except explicit public list above
};
