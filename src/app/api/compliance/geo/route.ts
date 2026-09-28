import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side geo-IP lookup. This MUST run server-side (it does, this
 * is a route handler) — never trust a client-reported country, since
 * that's trivially spoofed and is the first thing a regulator tests.
 *
 * Uses ipapi.co's free tier for now. Free tier is rate-limited
 * (1,000 req/day) — fine for dev, NOT fine for production traffic.
 * Before launch, replace with a paid provider (MaxMind GeoIP2 or
 * ipapi.co's paid tier) so you're not silently failing open/closed
 * under load.
 */
export async function GET(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim();

  // Localhost dev has no real IP — return a clearly-fake code so you
  // can see the blocked state in the UI without lying about geo-IP working.
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.')) {
    return NextResponse.json({ countryCode: 'DEV_LOCAL', warning: 'no real IP available in local dev' });
  }

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    return NextResponse.json({ countryCode: data.country_code ?? 'UNKNOWN' });
  } catch {
    // Fail CLOSED, not open — if the geo lookup itself fails, treat
    // the visitor as unverified rather than letting them through.
    return NextResponse.json({ countryCode: 'LOOKUP_FAILED' });
  }
}