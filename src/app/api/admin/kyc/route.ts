import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import { readAll } from '@/lib/kycStore';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const records = readAll().map((r) => ({
    id: r.id,
    status: r.status,
    submittedAt: r.submittedAt,
    reviewedAt: r.reviewedAt,
  }));
  return NextResponse.json({ records });
}