import crypto from 'crypto';
import db from './db';
import { generateServerSeed, hashServerSeed, computeCrashPoint } from './provablyFair';

const BETTING_MS = 5000;
const CRASH_PAUSE_MS = 3000;
const GROWTH_RATE = 0.06;
const TICK_MS = 150;

type RoundRow = {
  id: string; roundNumber: number; serverSeed: string; seedHash: string;
  crashPoint: number; status: 'waiting' | 'running' | 'crashed';
  bettingEndsAt: number; startedAt: number | null; crashedAt: number | null;
};

function currentMultiplier(round: RoundRow, now: number): number {
  if (round.status !== 'running' || !round.startedAt) return 1;
  const t = (now - round.startedAt) / 1000;
  return Math.min(Math.exp(GROWTH_RATE * t), round.crashPoint);
}

function getLatestRound(): RoundRow | undefined {
  return db.prepare('SELECT * FROM crash_rounds ORDER BY roundNumber DESC LIMIT 1').get() as RoundRow | undefined;
}

function createRound(): void {
  const last = getLatestRound();
  const roundNumber = (last?.roundNumber ?? 0) + 1;
  const serverSeed = generateServerSeed();
  const crashPoint = computeCrashPoint(serverSeed, 'crash-round', roundNumber);

  db.prepare(
    `INSERT INTO crash_rounds (id, roundNumber, serverSeed, seedHash, crashPoint, status, bettingEndsAt, startedAt, crashedAt)
     VALUES (?, ?, ?, ?, ?, 'waiting', ?, NULL, NULL)`
  ).run(crypto.randomUUID(), roundNumber, serverSeed, hashServerSeed(serverSeed), crashPoint, Date.now() + BETTING_MS);
}

function tick() {
  const now = Date.now();
  const round = getLatestRound();
  if (!round) { createRound(); return; }

  if (round.status === 'waiting' && now >= round.bettingEndsAt) {
    db.prepare('UPDATE crash_rounds SET status = ?, startedAt = ? WHERE id = ?').run('running', now, round.id);
    return;
  }

  if (round.status === 'running' && currentMultiplier(round, now) >= round.crashPoint) {
    db.prepare('UPDATE crash_rounds SET status = ?, crashedAt = ? WHERE id = ?').run('crashed', now, round.id);
    db.prepare(`UPDATE crash_bets SET status = 'lost' WHERE roundId = ? AND status = 'active'`).run(round.id);
    return;
  }

  if (round.status === 'crashed' && round.crashedAt && now - round.crashedAt >= CRASH_PAUSE_MS) {
    createRound();
  }
}

// Guard against Next.js dev hot-reload spawning duplicate loops.
const g = globalThis as any;
if (!g.__crashLoopStarted) {
  g.__crashLoopStarted = true;
  if (!getLatestRound()) createRound();
  setInterval(tick, TICK_MS);
}

export function getPublicState(sessionId: string | null) {
  const now = Date.now();
  const round = getLatestRound();
  if (!round) return null;

  const bet = sessionId
    ? (db.prepare('SELECT * FROM crash_bets WHERE roundId = ? AND sessionId = ?').get(round.id, sessionId) as any)
    : undefined;

  return {
    roundId: round.id,
    status: round.status,
    seedHash: round.seedHash,
    bettingEndsAt: round.bettingEndsAt,
    multiplier: round.status === 'crashed' ? round.crashPoint : currentMultiplier(round, now),
    crashPoint: round.status === 'crashed' ? round.crashPoint : null,
    serverSeedRevealed: round.status === 'crashed' ? round.serverSeed : null,
    yourBet: bet
      ? { stake: bet.stake, status: bet.status, cashoutMultiplier: bet.cashoutMultiplier, payout: bet.payout }
      : null,
  };
}

export function placeBet(sessionId: string, stake: number) {
  const round = getLatestRound();
  if (!round || round.status !== 'waiting') throw new Error('betting window closed');

  const existing = db.prepare('SELECT id FROM crash_bets WHERE roundId = ? AND sessionId = ?').get(round.id, sessionId);
  if (existing) throw new Error('already bet this round');

  db.prepare(
    `INSERT INTO crash_bets (id, roundId, sessionId, stake, cashoutMultiplier, payout, status)
     VALUES (?, ?, ?, ?, NULL, NULL, 'active')`
  ).run(crypto.randomUUID(), round.id, sessionId, stake);
}

export function cashOut(sessionId: string): { payout: number; multiplier: number } {
  const round = getLatestRound();
  if (!round || round.status !== 'running') throw new Error('round not running');

  const bet = db.prepare('SELECT * FROM crash_bets WHERE roundId = ? AND sessionId = ?').get(round.id, sessionId) as any;
  if (!bet || bet.status !== 'active') throw new Error('no active bet');

  const mult = currentMultiplier(round, Date.now());
  if (mult >= round.crashPoint) throw new Error('too late — already crashed');

  const payout = bet.stake * mult;
  db.prepare(`UPDATE crash_bets SET status = 'cashed', cashoutMultiplier = ?, payout = ? WHERE id = ?`).run(mult, payout, bet.id);
  return { payout, multiplier: mult };
}