export type Risk = 'low' | 'medium' | 'high';
export const ROW_OPTIONS = [8, 10, 12, 14, 16];
export const RISKS: Risk[] = ['low', 'medium', 'high'];
export const PLINKO_RTP = 0.98;

const PARAMS: Record<Risk, { base: number; power: number }> = {
  low: { base: 0.6, power: 3 },
  medium: { base: 0.25, power: 4 },
  high: { base: 0.05, power: 5 },
};

function binom(n: number, k: number): number {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
}

// Multipliers are scaled so sum(probability * multiplier) is EXACTLY
// PLINKO_RTP for every rows/risk combo. Edge slots pay most.
export function plinkoTable(rows: number, risk: Risk): number[] {
  const { base, power } = PARAMS[risk];
  const p = Array.from({ length: rows + 1 }, (_, k) => binom(rows, k) / Math.pow(2, rows));
  const raw = p.map((_, k) => base + Math.pow(Math.abs(k - rows / 2) / (rows / 2), power));
  const ev = raw.reduce((s, r, k) => s + r * p[k], 0);
  const scale = PLINKO_RTP / ev;
  return raw.map((r) => r * scale);
}