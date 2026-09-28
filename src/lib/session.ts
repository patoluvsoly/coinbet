import { NextRequest } from 'next/server';

export const SESSION_COOKIE = 'session_id';

export function getSessionId(req: NextRequest): string | null {
  return req.cookies.get(SESSION_COOKIE)?.value ?? null;
}