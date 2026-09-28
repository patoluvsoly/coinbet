import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'admin_session';
const SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
  return secret;
}

export function signToken(): string {
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac('sha256', getSecret()).update(timestamp).digest('hex');
  return `${timestamp}.${hmac}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [timestamp, hmac] = token.split('.');
  if (!timestamp || !hmac) return false;
  const expected = crypto.createHmac('sha256', getSecret()).update(timestamp).digest('hex');
  if (expected.length !== hmac.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac))) return false;
  return Date.now() - Number(timestamp) < SESSION_LIFETIME_MS;
}

export function isAdminRequest(req: NextRequest): boolean {
  return verifyToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}