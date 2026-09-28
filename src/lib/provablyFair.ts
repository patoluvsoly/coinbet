import crypto from 'crypto';

/**
 * Standard provably-fair commit/reveal pattern used by real crypto
 * casinos. Server commits to a seed BEFORE the bet (hash published),
 * player supplies their own seed, result is deterministic from both
 * + a nonce — so neither side can manipulate the outcome after the
 * fact, and any user can independently verify a past roll was fair.
 */

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Published to the player BEFORE they bet — proves the server seed
// existed and wasn't chosen after seeing the player's seed.
export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
}

// Deterministic roll in [0, 100) from serverSeed + clientSeed + nonce.
// Same inputs ALWAYS produce the same output — this is what makes it
// independently verifiable after the server seed is revealed.
export function computeRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  const hmac = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
  // Take first 8 hex chars (32 bits) for a uniform-enough distribution
  const int = parseInt(hmac.slice(0, 8), 16);
  return (int / 0xffffffff) * 100;
}