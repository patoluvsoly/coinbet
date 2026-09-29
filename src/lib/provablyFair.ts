import crypto from 'crypto';

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashServerSeed(serverSeed: string): string {
  return crypto.createHash('sha256').update(serverSeed).digest('hex');
}

export function computeRoll(serverSeed: string, clientSeed: string, nonce: number): number {
  const hmac = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
  const int = parseInt(hmac.slice(0, 8), 16);
  return (int / 0xffffffff) * 100;
}

// Standard crash-game formula (bustabit-derived). houseEdge IS the
// instant-crash (1.00x) probability — transparent, no hidden skew.
// Every surviving round has EV exactly (1 - houseEdge), so the curve
// stays honest at every cashout point, not just in aggregate.
export function computeCrashPoint(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  houseEdge = 0.95
  
): number {
  const hmac = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
  const h = parseInt(hmac.slice(0, 13), 16);
  const e = Math.pow(2, 52);
  const r = h / e;

  if (r < houseEdge) return 1.0;

  const result = Math.floor((100 * (1 - houseEdge)) / (1 - r));
  return Math.max(100, result) / 100;
}

// Plinko: one bit per row (0 = left, 1 = right) from a single HMAC.
export function computeBits(serverSeed: string, clientSeed: string, nonce: number, count: number): number[] {
  const buf = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}:bits`).digest();
  const bits: number[] = [];
  for (let i = 0; i < count; i++) bits.push((buf[i >> 3] >> (i & 7)) & 1);
  return bits;
}

// Mines: deterministic Fisher-Yates shuffle, first `mines` entries are mine tiles.
export function computeMinePositions(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  tiles: number,
  mines: number
): number[] {
  const arr = Array.from({ length: tiles }, (_, i) => i);
  for (let i = tiles - 1; i > 0; i--) {
    const h = crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}:mine:${i}`).digest('hex');
    const r = parseInt(h.slice(0, 8), 16) / 0x100000000;
    const j = Math.floor(r * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, mines).sort((a, b) => a - b);
}