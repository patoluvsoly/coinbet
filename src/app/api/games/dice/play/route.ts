import { NextRequest, NextResponse } from 'next/server';
import { requireCompliance } from '@/lib/compliance';
import { getSessionId } from '@/lib/session';
import { getOrCreateSession, incrementNonce, rotateSeed } from '@/lib/diceStore';
import { computeRoll, generateServerSeed, hashServerSeed } from '@/lib/provablyFair';
import { getBalance, adjustBalance } from '@/lib/creditsStore';

const HOUSE_EDGE = 0.02;
const MIN_STAKE = 1;
const MAX_STAKE = 1000;
const MAX_TARGET = 98;
const MIN_TARGET = 2;

export async function POST(req: NextRequest) {
  const blocked = await requireCompliance(req);
  if (blocked) return blocked;
  const sessionId = getSessionId(req)!;

  const { stake, target, direction, clientSeed } = await req.json();

  if (typeof stake !== 'number' || stake < MIN_STAKE || stake > MAX_STAKE) {
    return NextResponse.json({ error: `stake must be between ${MIN_STAKE} and ${MAX_STAKE}` }, { status: 400 });
  }
  if (typeof target !== 'number' || target < MIN_TARGET || target > MAX_TARGET) {
    return NextResponse.json({ error: `target must be between ${MIN_TARGET} and ${MAX_TARGET}` }, { status: 400 });
  }
  if (direction !== 'over' && direction !== 'under') {
    return NextResponse.json({ error: 'direction must be "over" or "under"' }, { status: 400 });
  }
  if (typeof clientSeed !== 'string' || clientSeed.length === 0 || clientSeed.length > 64) {
    return NextResponse.json({ error: 'clientSeed required (max 64 chars)' }, { status: 400 });
  }

  // Debit first — atomic, throws if balance is short (no check-then-spend race).
  try {
    adjustBalance(sessionId, -stake);
  } catch {
    return NextResponse.json({ error: 'insufficient balance' }, { status: 400 });
  }

  const session = getOrCreateSession(sessionId, generateServerSeed);
  const nonce = incrementNonce(sessionId);
  const roll = computeRoll(session.serverSeed, clientSeed, nonce);

  const won = direction === 'over' ? roll > target : roll < target;
  const winChance = direction === 'over' ? 100 - target : target;
  const multiplier = (100 / winChance) * (1 - HOUSE_EDGE);

  let payout = 0;
  if (won) {
    payout = stake * multiplier;
    adjustBalance(sessionId, payout);
  }

  // Reveal the seed used for THIS roll, then commit a brand-new one.
  // Revealing without rotating would let the player predict every
  // future roll.
  const revealedSeed = session.serverSeed;
  const nextSeed = generateServerSeed();
  rotateSeed(sessionId, () => nextSeed);

  return NextResponse.json({
    roll,
    won,
    payout,
    newBalance: getBalance(sessionId),
    serverSeedRevealed: revealedSeed,
    serverSeedHashConfirm: hashServerSeed(revealedSeed),
    nextServerSeedHash: hashServerSeed(nextSeed),
    clientSeed,
    nonce,
  });
}