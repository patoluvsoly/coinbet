'use client';

import { useEffect, useState } from 'react';

export default function CoinflipPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [stake, setStake] = useState(10);
  const [side, setSide] = useState<'heads' | 'tails'>('heads');
  const [clientSeed, setClientSeed] = useState('my-seed-123');
  const [commit, setCommit] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/credits/balance').then((r) => r.json()).then((d) => setBalance(d.balance ?? null));
    fetch('/api/games/dice/seed').then((r) => r.json()).then((d) => setCommit(d.serverSeedHash ?? ''));
  }, []);

  async function faucet() {
    const res = await fetch('/api/credits/faucet', { method: 'POST' });
    const data = await res.json();
    if (res.ok) setBalance(data.balance);
  }

  async function play() {
    setLoading(true);
    const res = await fetch('/api/games/coinflip/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stake, side, clientSeed }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult(data);
      setBalance(data.newBalance);
      setCommit(data.nextServerSeedHash);
    } else alert(data.error);
  }

  return (
    <main style={{ padding: 40, maxWidth: 500 }}>
      <h1>Coinflip (test credits)</h1>
      <p>Balance: {balance ?? '—'}</p>
      <button onClick={faucet}>Get 1000 test credits (dev)</button>
      <p style={{ fontSize: 12, color: '#666' }}>Next seed commit: {commit}</p>

      <div><label>Stake</label><br />
        <input type="number" value={stake} onChange={(e) => setStake(Number(e.target.value))} /></div>
      <div><label>Side</label><br />
        <select value={side} onChange={(e) => setSide(e.target.value as any)}>
          <option value="heads">Heads</option><option value="tails">Tails</option>
        </select></div>
      <div><label>Client seed</label><br />
        <input value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} /></div>

      <button onClick={play} disabled={loading} style={{ marginTop: 10 }}>{loading ? 'Flipping…' : 'Flip'}</button>

      {result && (
        <div style={{ marginTop: 20, border: '1px solid #ccc', padding: 12 }}>
          <p>{result.outcome.toUpperCase()} — {result.won ? `WON ${result.payout.toFixed(2)}` : 'LOST'}</p>
          <p style={{ fontSize: 12, color: '#666' }}>Seed revealed: {result.serverSeedRevealed}<br />Nonce: {result.nonce}</p>
        </div>
      )}
    </main>
  );
}