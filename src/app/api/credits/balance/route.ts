import { NextRequest, NextResponse } from 'next/server';
import { requireCompliance } from '@/lib/compliance';
import { getSessionId } from '@/lib/session';
import { getBalance } from '@/lib/creditsStore';

export async function GET(req: NextRequest) {
  const blocked = await requireCompliance(req);
  if (blocked) return blocked;
  return NextResponse.json({ balance: getBalance(getSessionId(req)!) });
}