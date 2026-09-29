import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSessionId } from '@/lib/session';

// DEV-ONLY. Zeroes your test balance back to 0 so faucet clicks stop stacking.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 });
  }
  const sessionId = getSessionId(req);
  if (!sessionId) return NextResponse.json({ status: 'ok' });

  db.prepare(`INSERT INTO credits (sessionId, balance) VALUES (?, 0) ON CONFLICT(sessionId) DO UPDATE SET balance = 0`).run(sessionId);
  return NextResponse.json({ status: 'ok' });
}