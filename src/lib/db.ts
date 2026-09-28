import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'app.db'));
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS kyc_records (
    id TEXT PRIMARY KEY, sessionId TEXT NOT NULL, status TEXT NOT NULL,
    submittedAt TEXT NOT NULL, reviewedAt TEXT, reviewNote TEXT,
    idFront TEXT NOT NULL, idBack TEXT NOT NULL, selfie TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS credits (
    sessionId TEXT PRIMARY KEY, balance REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS dice_sessions (
    sessionId TEXT PRIMARY KEY, serverSeed TEXT NOT NULL, nonce INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS crash_rounds (
    id TEXT PRIMARY KEY, roundNumber INTEGER NOT NULL, serverSeed TEXT NOT NULL,
    seedHash TEXT NOT NULL, crashPoint REAL NOT NULL, status TEXT NOT NULL,
    bettingEndsAt INTEGER NOT NULL, startedAt INTEGER, crashedAt INTEGER
  );

  CREATE TABLE IF NOT EXISTS crash_bets (
    id TEXT PRIMARY KEY, roundId TEXT NOT NULL, sessionId TEXT NOT NULL,
    stake REAL NOT NULL, cashoutMultiplier REAL, payout REAL, status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mines_games (
    id TEXT PRIMARY KEY, sessionId TEXT NOT NULL, serverSeed TEXT NOT NULL,
    seedHash TEXT NOT NULL, clientSeed TEXT NOT NULL, mines INTEGER NOT NULL,
    minePositions TEXT NOT NULL, stake REAL NOT NULL, revealed TEXT NOT NULL,
    status TEXT NOT NULL, payout REAL, createdAt INTEGER NOT NULL
  );
`);

export default db;