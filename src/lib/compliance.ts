import { NextRequest, NextResponse } from 'next/server';
import { isJurisdictionAllowed } from '@/config/jurisdictions';
import { getSessionId } from './session';
import { getBySession } from './kycStore';

function getIp(req: NextRequest): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || null;
}

function isLocalIp(ip: string | null): boolean {
  return !ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.');
}

export async function getCountryCode(req: NextRequest): Promise<string> {
  const ip = getIp(req);
  if (isLocalIp(ip)) return 'DEV_LOCAL';
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    return data.country_code ?? 'UNKNOWN';
  } catch {
    return 'LOOKUP_FAILED'; // fail closed
  }
}

export async function isGeoAllowed(req: NextRequest): Promise<boolean> {
  const code = await getCountryCode(req);
  if (code === 'DEV_LOCAL') {
    // Local dev bypass — only works outside production AND with the env flag.
    return process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_LOCAL === 'true';
  }
  return isJurisdictionAllowed(code);
}

// Call at the top of every route that touches money. Returns a
// response to send back if blocked, or null if the request may proceed.
export async function requireCompliance(req: NextRequest): Promise<NextResponse | null> {
  if (!(await isGeoAllowed(req))) {
    return NextResponse.json({ error: 'not available in your region' }, { status: 403 });
  }
  const sessionId = getSessionId(req);
  const record = sessionId ? getBySession(sessionId) : undefined;
  if (record?.status !== 'verified') {
    return NextResponse.json({ error: 'identity verification required' }, { status: 403 });
  }
  return null;
}