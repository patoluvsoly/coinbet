import { NextRequest, NextResponse } from 'next/server';
import { signToken, ADMIN_COOKIE_NAME } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) return NextResponse.json({ error: 'ADMIN_PASSWORD not configured' }, { status: 500 });
  if (password !== expected) return NextResponse.json({ error: 'invalid password' }, { status: 401 });

  const response = NextResponse.json({ status: 'ok' });
  response.cookies.set(ADMIN_COOKIE_NAME, signToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 12,
  });
  return response;
}