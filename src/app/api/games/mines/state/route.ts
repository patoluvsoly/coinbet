import { NextRequest, NextResponse } from 'next/server';
import { requireCompliance } from '@/lib/compliance';
import { getSessionId } from '@/lib/session';
import { getBalance } from '@/lib/creditsStore';
import { getActiveGame } from '@/lib/minesEngine';

export async function GET(req: NextRequest) {
  const blocked = await requireCompliance(req);
  if (blocked) return blocked;
  const sessionId = getSessionId(req)!;
  return NextResponse.json({ game: getActiveGame(sessionId), balance: getBalance(sessionId) });
}