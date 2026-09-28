import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/lib/session';
import { getOrCreateSession, incrementNonce, rotateSeed } from '@/lib/diceStore';
import { computeRoll, generateServerSeed, hashServerSeed } from '@/lib/provablyFair';
import { getBalance, adjustBalance } from '@/lib/creditsStore';

const HOUSE_EDGE = 0.02; // 2% — standard for this game type
const MIN_STAKE = 1;
const MAX_STAKE = 1000;
const MAX_TARGET = 98; // leave headroom so payout math never divides by ~0
const MIN_TARGET = 2;

export async function POST(req: NextRequest) {
  const sessionId = getSessionId(req);
  if (!sessionId) return NextResponse.json({ error: 'no session' }, { status: 400 });

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
  if (typeof clientSeed !== 'string' || clientSeed.length === 0) {
    return NextResponse.json({ error: 'clientSeed is required' }, { status: 400 });
  }

  if (getBalance(sessionId) < stake) {
    return NextResponse.json({ error: 'insufficient balance' }, { status: 400 });
  }

  const session = getOrCreateSession(sessionId, generateServerSeed);
  const nonce = incrementNonce(sessionId);
  const roll = computeRoll(session.serverSeed, clientSeed, nonce);

  const won = direction === 'over' ? roll > target : roll < target;

  // Win chance and payout multiplier derived from the target, minus
  // house edge. E.g. betting "under 50" is a 50% win chance; payout
  // is (100 / winChance) * (1 - houseEdge).
  const winChance = direction === 'over' ? 100 - target : target;
  const multiplier = (100 / winChance) * (1 - HOUSE_EDGE);

  adjustBalance(sessionId, -stake);
  let payout = 0;
  if (won) {
    payout = stake * multiplier;
    adjustBalance(sessionId, payout);
  }

  return NextResponse.json({
    roll,
    won,
    payout,
    newBalance: getBalance(sessionId),
    // Revealed AFTER the roll — player can now hash this themselves
    // and confirm it matches the seedHash they were shown before betting.
    serverSeedRevealed: session.serverSeed,
    serverSeedHashConfirm: hashServerSeed(session.serverSeed),
    clientSeed,
    nonce,
  });
}