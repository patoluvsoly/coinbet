import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import { updateStatus } from '@/lib/kycStore';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { decision, note } = await req.json();
  if (decision !== 'verified' && decision !== 'rejected') {
    return NextResponse.json({ error: 'decision must be verified or rejected' }, { status: 400 });
  }
  updateStatus(params.id, decision, note);
  return NextResponse.json({ status: 'ok' });
}