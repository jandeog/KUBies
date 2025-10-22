import { NextResponse } from 'next/server';
const cookieName = 'sd_session';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: cookieName,
    value: '',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
  return res;
}
