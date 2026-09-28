import { NextRequest, NextResponse } from 'next/server';
import { getSessionId } from '@/lib/session';
import { getPublicState } from '@/lib/crashEngine';

export async function GET(req: NextRequest) {
  return NextResponse.json(getPublicState(getSessionId(req)));
}