import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'app.db'));
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS kyc_records (
    id TEXT PRIMARY KEY,
    sessionId TEXT NOT NULL,
    status TEXT NOT NULL,
    submittedAt TEXT NOT NULL,
    reviewedAt TEXT,
    reviewNote TEXT,
    idFront TEXT NOT NULL,
    idBack TEXT NOT NULL,
    selfie TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS credits (
    sessionId TEXT PRIMARY KEY,
    balance REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS dice_sessions (
    sessionId TEXT PRIMARY KEY,
    serverSeed TEXT NOT NULL,
    nonce INTEGER NOT NULL DEFAULT 0
  );
`);

export default db;