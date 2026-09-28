import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getSessionId, SESSION_COOKIE } from '@/lib/session';
import { encryptBuffer } from '@/lib/encryption';
import { create, getBySession, getDocsDir } from '@/lib/kycStore';

export async function POST(req: NextRequest) {
  // Cast to the web-standard FormData type — @types/node's global
  // FormData declaration conflicts with DOM's, which drops method
  // signatures under TypeScript's merge. This cast works around that
  // without weakening type-safety anywhere else in the file.
  const formData = (await req.formData()) as unknown as globalThis.FormData;

  const idFront = formData.get('idFront') as File | null;
  const idBack = formData.get('idBack') as File | null;
  const selfie = formData.get('selfie') as File | null;

  if (!idFront || !idBack || !selfie) {
    return NextResponse.json({ error: 'idFront, idBack, and selfie are all required' }, { status: 400 });
  }

  const existingSessionId = getSessionId(req);
  if (existingSessionId && getBySession(existingSessionId)) {
    return NextResponse.json({ error: 'a submission already exists for this session' }, { status: 409 });
  }
  const sessionId = existingSessionId ?? crypto.randomUUID();

  const recordId = crypto.randomUUID();
  const docsDir = getDocsDir();

  async function saveEncrypted(file: File, label: string): Promise<string> {
    const buf = Buffer.from(await file.arrayBuffer());
    const filename = `${recordId}-${label}.enc`;
    fs.writeFileSync(path.join(docsDir, filename), encryptBuffer(buf));
    return filename;
  }

  const documents = {
    idFront: await saveEncrypted(idFront, 'id-front'),
    idBack: await saveEncrypted(idBack, 'id-back'),
    selfie: await saveEncrypted(selfie, 'selfie'),
  };

  create({ id: recordId, sessionId, status: 'pending', submittedAt: new Date().toISOString(), documents });

  const response = NextResponse.json({ status: 'submitted' });
  if (!existingSessionId) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return response;
}