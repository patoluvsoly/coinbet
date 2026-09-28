import db from './db';

export function getBalance(sessionId: string): number {
  const row = db.prepare('SELECT balance FROM credits WHERE sessionId = ?').get(sessionId) as
    | { balance: number }
    | undefined;
  return row?.balance ?? 0;
}

export function adjustBalance(sessionId: string, delta: number): number {
  db.exec('BEGIN IMMEDIATE');
  try {
    const current = getBalance(sessionId);
    const next = current + delta;
    if (next < 0) throw new Error('insufficient balance');
    db.prepare(
      `INSERT INTO credits (sessionId, balance) VALUES (?, ?)
       ON CONFLICT(sessionId) DO UPDATE SET balance = excluded.balance`
    ).run(sessionId, next);
    db.exec('COMMIT');
    return next;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}