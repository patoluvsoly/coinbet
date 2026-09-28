import crypto from 'crypto';
import db from './db';
import { generateServerSeed, hashServerSeed, computeMinePositions } from './provablyFair';

export const TILES = 25;
const HOUSE_EDGE = 0.02;

type Row = {
  id: string; sessionId: string; serverSeed: string; seedHash: string; clientSeed: string;
  mines: number; minePositions: string; stake: number; revealed: string;
  status: 'active' | 'lost' | 'cashed' | 'won'; payout: number | null; createdAt: number;
};

export function multiplierFor(mines: number, safeRevealed: number): number {
  let m = 1;
  for (let i = 0; i < safeRevealed; i++) m *= (TILES - i) / (TILES - mines - i);
  return m * (1 - HOUSE_EDGE);
}

function getActiveRow(sessionId: string): Row | undefined {
  return db
    .prepare(`SELECT * FROM mines_games WHERE sessionId = ? AND status = 'active'`)
    .get(sessionId) as unknown as Row | undefined;
}

// Mine positions and the server seed stay hidden until the game ends.
function toPublic(row: Row) {
  const revealed: number[] = JSON.parse(row.revealed);
  const ended = row.status !== 'active';
  return {
    gameId: row.id,
    status: row.status,
    seedHash: row.seedHash,
    clientSeed: row.clientSeed,
    mines: row.mines,
    stake: row.stake,
    revealed,
    multiplier: multiplierFor(row.mines, revealed.length),
    payout: row.payout,
    minePositions: ended ? JSON.parse(row.minePositions) : null,
    serverSeedRevealed: ended ? row.serverSeed : null,
  };
}

export function getActiveGame(sessionId: string) {
  const row = getActiveRow(sessionId);
  return row ? toPublic(row) : null;
}

export function startGame(sessionId: string, stake: number, mines: number, clientSeed: string) {
  if (getActiveRow(sessionId)) throw new Error('finish your current game first');
  const serverSeed = generateServerSeed();
  const positions = computeMinePositions(serverSeed, clientSeed, 0, TILES, mines);
  const id = crypto.randomUUID();

  db.prepare(
    `INSERT INTO mines_games (id, sessionId, serverSeed, seedHash, clientSeed, mines, minePositions, stake, revealed, status, payout, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', 'active', NULL, ?)`
  ).run(id, sessionId, serverSeed, hashServerSeed(serverSeed), clientSeed, mines, JSON.stringify(positions), stake, Date.now());

  return toPublic(getActiveRow(sessionId)!);
}

export function revealTile(sessionId: string, tile: number) {
  const row = getActiveRow(sessionId);
  if (!row) throw new Error('no active game');

  const revealed: number[] = JSON.parse(row.revealed);
  if (revealed.includes(tile)) throw new Error('tile already revealed');

  const minePositions: number[] = JSON.parse(row.minePositions);
  let payout = 0;

  if (minePositions.includes(tile)) {
    db.prepare(`UPDATE mines_games SET status = 'lost', payout = 0 WHERE id = ?`).run(row.id);
  } else {
    revealed.push(tile);
    if (revealed.length === TILES - row.mines) {
      payout = row.stake * multiplierFor(row.mines, revealed.length);
      db.prepare(`UPDATE mines_games SET revealed = ?, status = 'won', payout = ? WHERE id = ?`)
        .run(JSON.stringify(revealed), payout, row.id);
    } else {
      db.prepare(`UPDATE mines_games SET revealed = ? WHERE id = ?`).run(JSON.stringify(revealed), row.id);
    }
  }

  const updated = db.prepare('SELECT * FROM mines_games WHERE id = ?').get(row.id) as unknown as Row;
  return { game: toPublic(updated), payout };
}

export function cashOutGame(sessionId: string) {
  const row = getActiveRow(sessionId);
  if (!row) throw new Error('no active game');

  const revealed: number[] = JSON.parse(row.revealed);
  if (revealed.length === 0) throw new Error('reveal at least one tile first');

  const payout = row.stake * multiplierFor(row.mines, revealed.length);
  db.prepare(`UPDATE mines_games SET status = 'cashed', payout = ? WHERE id = ?`).run(payout, row.id);

  const updated = db.prepare('SELECT * FROM mines_games WHERE id = ?').get(row.id) as unknown as Row;
  return { game: toPublic(updated), payout };
}