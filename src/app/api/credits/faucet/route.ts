import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionId, SESSION_COOKIE } from '@/lib/session';
import { adjustBalance, getBalance } from '@/lib/creditsStore';

/**
 * DEV-ONLY. Grants free test credits so you can play without real
 * funds wired up. DELETE THIS ROUTE before any real-money deployment
 * — a free-money endpoint left live in production is not a hypothetical
 * risk, it's an instant drain.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 });
  }

  const existingSessionId = getSessionId(req);
  const sessionId = existingSessionId ?? crypto.randomUUID();

  adjustBalance(sessionId, 1000);

  const response = NextResponse.json({ balance: getBalance(sessionId) });
  if (!existingSessionId) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}