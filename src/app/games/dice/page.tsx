'use client';

import { useEffect, useState } from 'react';

export default function DicePage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [stake, setStake] = useState(10);
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<'over' | 'under'>('under');
  const [clientSeed, setClientSeed] = useState('my-seed-123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function faucet() {
    const res = await fetch('/api/credits/faucet', { method: 'POST' });
    const data = await res.json();
    setBalance(data.balance);
  }

  async function play() {
    setLoading(true);
    const res = await fetch('/api/games/dice/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stake, target, direction, clientSeed }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult(data);
      setBalance(data.newBalance);
    } else {
      alert(data.error);
    }
  }

  return (
    <main style={{ padding: 40, maxWidth: 500 }}>
      <h1>Dice (provably fair — test credits only)</h1>
      <p>Balance: {balance ?? '—'}</p>
      <button onClick={faucet}>Get 1000 test credits (dev only)</button>

      <div style={{ marginTop: 20 }}>
        <label>Stake</label><br />
        <input type="number" value={stake} onChange={(e) => setStake(Number(e.target.value))} />
      </div>
      <div>
        <label>Target (2–98)</label><br />
        <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
      </div>
      <div>
        <label>Direction</label><br />
        <select value={direction} onChange={(e) => setDirection(e.target.value as 'over' | 'under')}>
          <option value="under">Under</option>
          <option value="over">Over</option>
        </select>
      </div>
      <div>
        <label>Client seed (yours — change it any time)</label><br />
        <input value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} />
      </div>

      <button onClick={play} disabled={loading} style={{ marginTop: 10 }}>
        {loading ? 'Rolling…' : 'Roll'}
      </button>

      {result && (
        <div style={{ marginTop: 20, border: '1px solid #ccc', padding: 12 }}>
          <p>Roll: {result.roll.toFixed(4)}</p>
          <p>{result.won ? `WON — payout ${result.payout.toFixed(2)}` : 'LOST'}</p>
          <p style={{ fontSize: 12, color: '#666' }}>
            Server seed (revealed): {result.serverSeedRevealed}<br />
            Nonce: {result.nonce}
          </p>
        </div>
      )}
    </main>
  );
}