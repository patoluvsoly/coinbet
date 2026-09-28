import { NextRequest, NextResponse } from 'next/server';
import { getSessionId, SESSION_COOKIE } from '@/lib/session';
import { getOrCreateSession } from '@/lib/diceStore';
import { generateServerSeed, hashServerSeed } from '@/lib/provablyFair';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const existingSessionId = getSessionId(req);
  const sessionId = existingSessionId ?? crypto.randomUUID();

  const session = getOrCreateSession(sessionId, generateServerSeed);

  const response = NextResponse.json({
    serverSeedHash: hashServerSeed(session.serverSeed),
    nonce: session.nonce,
  });

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