'use client';

import { useEffect, useState } from 'react';
import { plinkoTable, ROW_OPTIONS, RISKS, Risk } from '@/lib/plinkoMath';

export default function PlinkoPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [stake, setStake] = useState(10);
  const [rows, setRows] = useState(12);
  const [risk, setRisk] = useState<Risk>('medium');
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
    const res = await fetch('/api/games/plinko/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stake, rows, risk, clientSeed }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setResult(data);
      setBalance(data.newBalance);
      setCommit(data.nextServerSeedHash);
    } else alert(data.error);
  }

  const table = plinkoTable(rows, risk);

  return (
    <main style={{ padding: 40, maxWidth: 700 }}>
      <h1>Plinko (test credits)</h1>
      <p>Balance: {balance ?? '—'}</p>
      <button onClick={faucet}>Get 1000 test credits (dev)</button>
      <p style={{ fontSize: 12, color: '#666' }}>Next seed commit: {commit}</p>

      <div><label>Stake</label><br />
        <input type="number" value={stake} onChange={(e) => setStake(Number(e.target.value))} /></div>
      <div><label>Rows</label><br />
        <select value={rows} onChange={(e) => setRows(Number(e.target.value))}>
          {ROW_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select></div>
      <div><label>Risk</label><br />
        <select value={risk} onChange={(e) => setRisk(e.target.value as Risk)}>
          {RISKS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select></div>
      <div><label>Client seed</label><br />
        <input value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} /></div>

      <button onClick={play} disabled={loading} style={{ marginTop: 10 }}>{loading ? 'Dropping…' : 'Drop ball'}</button>

      <div style={{ display: 'flex', gap: 4, marginTop: 20, flexWrap: 'wrap' }}>
        {table.map((m, i) => (
          <div key={i} style={{
            padding: '6px 8px', border: '1px solid #ccc', fontSize: 12,
            background: result && result.slot === i ? '#ffd54f' : 'transparent',
          }}>{m.toFixed(2)}x</div>
        ))}
      </div>

      {result && (
        <div style={{ marginTop: 20, border: '1px solid #ccc', padding: 12 }}>
          <p>Slot {result.slot} — {result.multiplier.toFixed(2)}x — payout {result.payout.toFixed(2)}</p>
          <p style={{ fontSize: 12 }}>Path: {result.path.map((b: number) => (b ? 'R' : 'L')).join('')}</p>
          <p style={{ fontSize: 12, color: '#666' }}>Seed revealed: {result.serverSeedRevealed}<br />Nonce: {result.nonce}</p>
        </div>
      )}
    </main>
  );
}