import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const cookieName = 'sd_session';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    const sb = supabaseServer();
    const { data: user, error } = await sb
      .from('app_users')
      .select('id,username,password_hash,role,is_active')
      .eq('username', username)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.APP_JWT_SECRET!);
    const token = await new SignJWT({
      sub: user.id,
      username: user.username,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: cookieName,
      value: token,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });
    return res;
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Login failed' }, { status: 500 });
  }
}
