import db from './db';
import path from 'path';
import fs from 'fs';

export type KycStatus = 'pending' | 'verified' | 'rejected';

export type KycRecord = {
  id: string;
  sessionId: string;
  status: KycStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  documents: { idFront: string; idBack: string; selfie: string };
};

const DOCS_DIR = path.join(process.cwd(), 'data', 'kyc-documents');
export function getDocsDir() {
  if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });
  return DOCS_DIR;
}

function rowToRecord(row: any): KycRecord {
  return {
    id: row.id,
    sessionId: row.sessionId,
    status: row.status,
    submittedAt: row.submittedAt,
    reviewedAt: row.reviewedAt ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    documents: { idFront: row.idFront, idBack: row.idBack, selfie: row.selfie },
  };
}

export function readAll(): KycRecord[] {
  return db.prepare('SELECT * FROM kyc_records').all().map(rowToRecord);
}

export function getBySession(sessionId: string): KycRecord | undefined {
  const row = db.prepare('SELECT * FROM kyc_records WHERE sessionId = ?').get(sessionId);
  return row ? rowToRecord(row) : undefined;
}

export function getById(id: string): KycRecord | undefined {
  const row = db.prepare('SELECT * FROM kyc_records WHERE id = ?').get(id);
  return row ? rowToRecord(row) : undefined;
}

export function create(record: KycRecord) {
  db.prepare(
    `INSERT INTO kyc_records (id, sessionId, status, submittedAt, idFront, idBack, selfie)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    record.id,
    record.sessionId,
    record.status,
    record.submittedAt,
    record.documents.idFront,
    record.documents.idBack,
    record.documents.selfie
  );
}

export function updateStatus(id: string, status: KycStatus, reviewNote?: string) {
  db.prepare(`UPDATE kyc_records SET status = ?, reviewedAt = ?, reviewNote = ? WHERE id = ?`).run(
    status,
    new Date().toISOString(),
    reviewNote ?? null,
    id
  );
}