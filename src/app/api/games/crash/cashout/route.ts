import { NextRequest, NextResponse } from 'next/server';
import { requireCompliance } from '@/lib/compliance';
import { getSessionId } from '@/lib/session';
import { adjustBalance, getBalance } from '@/lib/creditsStore';
import { cashOut } from '@/lib/crashEngine';

export async function POST(req: NextRequest) {
  const blocked = await requireCompliance(req);
  if (blocked) return blocked;
  const sessionId = getSessionId(req)!;

  try {
    const { payout, multiplier } = cashOut(sessionId);
    adjustBalance(sessionId, payout);
    return NextResponse.json({ status: 'ok', payout, multiplier, balance: getBalance(sessionId) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}