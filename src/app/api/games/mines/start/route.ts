import { NextRequest, NextResponse } from 'next/server';
import { requireCompliance } from '@/lib/compliance';
import { getSessionId } from '@/lib/session';
import { adjustBalance, getBalance } from '@/lib/creditsStore';
import { startGame } from '@/lib/minesEngine';

const MIN_STAKE = 1;
const MAX_STAKE = 1000;

export async function POST(req: NextRequest) {
  const blocked = await requireCompliance(req);
  if (blocked) return blocked;
  const sessionId = getSessionId(req)!;

  const { stake, mines, clientSeed } = await req.json();
  if (typeof stake !== 'number' || stake < MIN_STAKE || stake > MAX_STAKE) {
    return NextResponse.json({ error: `stake must be ${MIN_STAKE}-${MAX_STAKE}` }, { status: 400 });
  }
  if (!Number.isInteger(mines) || mines < 1 || mines > 24) {
    return NextResponse.json({ error: 'mines must be 1-24' }, { status: 400 });
  }
  if (typeof clientSeed !== 'string' || clientSeed.length === 0 || clientSeed.length > 64) {
    return NextResponse.json({ error: 'clientSeed required (max 64 chars)' }, { status: 400 });
  }

  try {
    adjustBalance(sessionId, -stake);
  } catch {
    return NextResponse.json({ error: 'insufficient balance' }, { status: 400 });
  }

  try {
    const game = startGame(sessionId, stake, mines, clientSeed);
    return NextResponse.json({ game, balance: getBalance(sessionId) });
  } catch (err: any) {
    adjustBalance(sessionId, stake); // refund
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}