import { NextRequest, NextResponse } from 'next/server';
import { requireCompliance } from '@/lib/compliance';
import { getSessionId } from '@/lib/session';
import { adjustBalance, getBalance } from '@/lib/creditsStore';
import { playFair } from '@/lib/fairRound';
import { computeRoll } from '@/lib/provablyFair';

const HOUSE_EDGE = 0.02;
const MIN_STAKE = 1;
const MAX_STAKE = 1000;

export async function POST(req: NextRequest) {
  const blocked = await requireCompliance(req);
  if (blocked) return blocked;
  const sessionId = getSessionId(req)!;

  const { stake, side, clientSeed } = await req.json();
  if (typeof stake !== 'number' || stake < MIN_STAKE || stake > MAX_STAKE) {
    return NextResponse.json({ error: `stake must be ${MIN_STAKE}-${MAX_STAKE}` }, { status: 400 });
  }
  if (side !== 'heads' && side !== 'tails') {
    return NextResponse.json({ error: 'side must be heads or tails' }, { status: 400 });
  }
  if (typeof clientSeed !== 'string' || clientSeed.length === 0 || clientSeed.length > 64) {
    return NextResponse.json({ error: 'clientSeed required (max 64 chars)' }, { status: 400 });
  }

  try {
    adjustBalance(sessionId, -stake);
  } catch {
    return NextResponse.json({ error: 'insufficient balance' }, { status: 400 });
  }

  const fair = playFair(sessionId, (seed, nonce) => computeRoll(seed, clientSeed, nonce));
  const outcome = fair.result < 50 ? 'heads' : 'tails';
  const won = outcome === side;
  const payout = won ? stake * 2 * (1 - HOUSE_EDGE) : 0;
  if (payout > 0) adjustBalance(sessionId, payout);

  return NextResponse.json({
    outcome,
    won,
    payout,
    newBalance: getBalance(sessionId),
    roll: fair.result,
    serverSeedRevealed: fair.serverSeedRevealed,
    serverSeedHashConfirm: fair.serverSeedHashConfirm,
    nextServerSeedHash: fair.nextServerSeedHash,
    clientSeed,
    nonce: fair.nonce,
  });
}