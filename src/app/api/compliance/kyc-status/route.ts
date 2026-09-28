import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/lib/session';
import { getBySession } from '@/lib/kycStore';

export async function GET(req: NextRequest) {
  const sessionId = getSessionId(req);
  if (!sessionId) return NextResponse.json({ status: 'unverified' });

  const record = getBySession(sessionId);
  return NextResponse.json({ status: record?.status ?? 'unverified' });
}
