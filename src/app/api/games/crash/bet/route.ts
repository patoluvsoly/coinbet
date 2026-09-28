import { NextRequest, NextResponse } from 'next/server';
import { requireCompliance } from '@/lib/compliance';
import { getSessionId } from '@/lib/session';
import { getBalance, adjustBalance } from '@/lib/creditsStore';
import { placeBet } from '@/lib/crashEngine';

const MIN_STAKE = 1;
const MAX_STAKE = 1000;

export async function POST(req: NextRequest) {
  const blocked = await requireCompliance(req);
  if (blocked) return blocked;
  const sessionId = getSessionId(req)!;

  const { stake } = await req.json();
  if (typeof stake !== 'number' || stake < MIN_STAKE || stake > MAX_STAKE) {
    return NextResponse.json({ error: `stake must be ${MIN_STAKE}-${MAX_STAKE}` }, { status: 400 });
  }

  try {
    adjustBalance(sessionId, -stake);
  } catch {
    return NextResponse.json({ error: 'insufficient balance' }, { status: 400 });
  }

  try {
    placeBet(sessionId, stake);
  } catch (err: any) {
    adjustBalance(sessionId, stake); // refund — bet was rejected
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  return NextResponse.json({ status: 'ok', balance: getBalance(sessionId) });
}