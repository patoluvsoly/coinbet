import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { isAdminRequest } from '@/lib/adminAuth';
import { getById, getDocsDir } from '@/lib/kycStore';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; type: 'idFront' | 'idBack' | 'selfie' } }
) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const record = getById(params.id);
  if (!record) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const filename = record.documents[params.type];
  if (!filename) return NextResponse.json({ error: 'invalid document type' }, { status: 400 });

  const { decryptBuffer } = await import('@/lib/encryption');
  const encrypted = fs.readFileSync(path.join(getDocsDir(), filename));
  return new NextResponse(decryptBuffer(encrypted), { headers: { 'Content-Type': 'image/jpeg' } });
}