import { NextRequest, NextResponse } from 'next/server';
import { isGeoAllowed } from '@/lib/compliance';

export async function GET(req: NextRequest) {
  return NextResponse.json({ allowed: await isGeoAllowed(req) });
}