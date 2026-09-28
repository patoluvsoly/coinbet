import db from './db';

type DiceSession = { serverSeed: string; nonce: number };

export function getOrCreateSession(sessionId: string, newServerSeed: () => string): DiceSession {
  const existing = db.prepare('SELECT serverSeed, nonce FROM dice_sessions WHERE sessionId = ?').get(sessionId) as
    | DiceSession
    | undefined;
  if (existing) return existing;

  db.prepare('INSERT INTO dice_sessions (sessionId, serverSeed, nonce) VALUES (?, ?, 0)').run(
    sessionId,
    newServerSeed()
  );
  return db.prepare('SELECT serverSeed, nonce FROM dice_sessions WHERE sessionId = ?').get(sessionId) as DiceSession;
}

export function incrementNonce(sessionId: string): number {
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('UPDATE dice_sessions SET nonce = nonce + 1 WHERE sessionId = ?').run(sessionId);
    const row = db.prepare('SELECT nonce FROM dice_sessions WHERE sessionId = ?').get(sessionId) as { nonce: number };
    db.exec('COMMIT');
    return row.nonce;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function rotateSeed(sessionId: string, newServerSeed: () => string): void {
  db.prepare('UPDATE dice_sessions SET serverSeed = ?, nonce = 0 WHERE sessionId = ?').run(newServerSeed(), sessionId);
}