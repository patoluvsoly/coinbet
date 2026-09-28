import { NextRequest, NextResponse } from 'next/server';
import { requireCompliance } from '@/lib/compliance';
import { getSessionId } from '@/lib/session';
import { adjustBalance, getBalance } from '@/lib/creditsStore';
import { playFair } from '@/lib/fairRound';
import { computeBits } from '@/lib/provablyFair';
import { plinkoTable, ROW_OPTIONS, RISKS, Risk } from '@/lib/plinkoMath';

const MIN_STAKE = 1;
const MAX_STAKE = 1000;

export async function POST(req: NextRequest) {
  const blocked = await requireCompliance(req);
  if (blocked) return blocked;
  const sessionId = getSessionId(req)!;

  const { stake, rows, risk, clientSeed } = await req.json();
  if (typeof stake !== 'number' || stake < MIN_STAKE || stake > MAX_STAKE) {
    return NextResponse.json({ error: `stake must be ${MIN_STAKE}-${MAX_STAKE}` }, { status: 400 });
  }
  if (!ROW_OPTIONS.includes(rows)) return NextResponse.json({ error: 'invalid rows' }, { status: 400 });
  if (!RISKS.includes(risk)) return NextResponse.json({ error: 'invalid risk' }, { status: 400 });
  if (typeof clientSeed !== 'string' || clientSeed.length === 0 || clientSeed.length > 64) {
    return NextResponse.json({ error: 'clientSeed required (max 64 chars)' }, { status: 400 });
  }

  try {
    adjustBalance(sessionId, -stake);
  } catch {
    return NextResponse.json({ error: 'insufficient balance' }, { status: 400 });
  }

  const fair = playFair(sessionId, (seed, nonce) => computeBits(seed, clientSeed, nonce, rows));
  const path = fair.result;
  const slot = path.reduce((a, b) => a + b, 0);
  const multiplier = plinkoTable(rows, risk as Risk)[slot];
  const payout = stake * multiplier;
  adjustBalance(sessionId, payout);

  return NextResponse.json({
    path,
    slot,
    multiplier,
    payout,
    newBalance: getBalance(sessionId),
    serverSeedRevealed: fair.serverSeedRevealed,
    serverSeedHashConfirm: fair.serverSeedHashConfirm,
    nextServerSeedHash: fair.nextServerSeedHash,
    clientSeed,
    nonce: fair.nonce,
  });
}