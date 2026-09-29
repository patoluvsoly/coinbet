'use client';

import { useState } from 'react';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react';

const DICE_ICONS = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export default function DicePage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [stake, setStake] = useState(10);
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<'over' | 'under'>('under');
  const [clientSeed, setClientSeed] = useState('my-seed-123');
  const [result, setResult] = useState<any>(null);
  const [rolling, setRolling] = useState(false);
  const [diceFace, setDiceFace] = useState(0);

  async function faucet() {
    const res = await fetch('/api/credits/faucet', { method: 'POST' });
    const data = await res.json();
    if (res.ok) setBalance(data.balance);
  }

  async function play() {
    setRolling(true);
    setResult(null);

    // Purely cosmetic tumble — actual outcome comes from the server call below.
    const spin = setInterval(() => setDiceFace(Math.floor(Math.random() * 6)), 90);

    const res = await fetch('/api/games/dice/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stake, target, direction, clientSeed }),
    });
    const data = await res.json();

    await new Promise((r) => setTimeout(r, 600)); // let the tumble play out
    clearInterval(spin);
    setRolling(false);

    if (res.ok) {
      setDiceFace(Math.min(5, Math.floor(data.roll / (100 / 6))));
      setResult(data);
      setBalance(data.newBalance);
    } else alert(data.error);
  }

  const DiceIcon = DICE_ICONS[diceFace];
  const inputClass =
    'w-full rounded-md border border-border bg-panel2 px-3 py-2 text-sm text-gray-100 outline-none focus:border-neon-green';

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">Roll the dice</h1>
      <p className="mt-1 text-sm text-gray-500">provably fair, test credits</p>

      <div className="mt-6 rounded-xl border border-border bg-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">Balance</span>
          <span className="font-semibold text-neon-green">{balance !== null ? balance.toFixed(2) : '—'}</span>
        </div>
        <button onClick={faucet} className="mb-6 w-full rounded-md border border-border py-2 text-sm text-gray-300 hover:bg-panel2">
          Get 1000 test credits (dev)
        </button>

        <div className="mb-6 flex justify-center">
          <DiceIcon size={64} className={rolling ? 'animate-dice-tumble text-neon-green' : 'text-gray-500'} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-gray-400">Stake</label>
            <input type="number" value={stake} onChange={(e) => setStake(Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Target (2–98)</label>
            <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Direction</label>
            <select value={direction} onChange={(e) => setDirection(e.target.value as any)} className={inputClass}>
              <option value="under">Under</option>
              <option value="over">Over</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-400">Client seed</label>
            <input value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} className={inputClass} />
          </div>
        </div>

        <button
          onClick={play}
          disabled={rolling}
          className="mt-6 w-full rounded-md bg-neon-green py-2.5 font-semibold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {rolling ? 'Rolling…' : 'Roll'}
        </button>

        {result && (
          <div className={`mt-6 rounded-lg border p-4 ${result.won ? 'border-neon-green/40 bg-neon-green/5' : 'border-neon-red/40 bg-neon-red/5'}`}>
            <p className="text-lg font-bold">
              Roll: {result.roll.toFixed(2)} — {result.won ? `WON ${result.payout.toFixed(2)}` : 'LOST'}
            </p>
            <p className="mt-2 break-all text-xs text-gray-500">
              Seed revealed: {result.serverSeedRevealed}<br />Nonce: {result.nonce}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}