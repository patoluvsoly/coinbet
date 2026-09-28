import { NextRequest, NextResponse } from 'next/server';
import { requireCompliance } from '@/lib/compliance';
import { getSessionId } from '@/lib/session';
import { adjustBalance, getBalance } from '@/lib/creditsStore';
import { revealTile, TILES } from '@/lib/minesEngine';

export async function POST(req: NextRequest) {
  const blocked = await requireCompliance(req);
  if (blocked) return blocked;
  const sessionId = getSessionId(req)!;

  const { tile } = await req.json();
  if (!Number.isInteger(tile) || tile < 0 || tile >= TILES) {
    return NextResponse.json({ error: 'invalid tile' }, { status: 400 });
  }

  try {
    const { game, payout } = revealTile(sessionId, tile);
    if (payout > 0) adjustBalance(sessionId, payout);
    return NextResponse.json({ game, balance: getBalance(sessionId) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}