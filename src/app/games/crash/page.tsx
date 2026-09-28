'use client';

import { useEffect, useRef, useState } from 'react';

export default function CrashPage() {
  const [state, setState] = useState<any>(null);
  const [stake, setStake] = useState(10);
  const [balance, setBalance] = useState<number | null>(null);
  const pollRef = useRef<any>(null);

  async function faucet() {
    const res = await fetch('/api/credits/faucet', { method: 'POST' });
    const data = await res.json();
    setBalance(data.balance);
  }

  async function poll() {
    const res = await fetch('/api/games/crash/state');
    if (res.ok) setState(await res.json());
  }

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, 200);
    return () => clearInterval(pollRef.current);
  }, []);

  async function bet() {
    const res = await fetch('/api/games/crash/bet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stake }),
    });
    const data = await res.json();
    if (res.ok) setBalance(data.balance);
    else alert(data.error);
  }

  async function doCashOut() {
    const res = await fetch('/api/games/crash/cashout', { method: 'POST' });
    const data = await res.json();
    if (res.ok) setBalance(data.balance);
    else alert(data.error);
  }

  if (!state) return <main style={{ padding: 40 }}>Loading…</main>;
  const secondsLeft = state.status === 'waiting' ? Math.max(0, (state.bettingEndsAt - Date.now()) / 1000) : null;

  return (
    <main style={{ padding: 40, maxWidth: 500 }}>
      <h1>Crash (provably fair — test credits only)</h1>
      <p>Balance: {balance ?? '—'}</p>
      <button onClick={faucet}>Get 1000 test credits (dev only)</button>

      <div style={{ marginTop: 20, fontSize: 32 }}>
        {state.status === 'waiting' && `Next round in ${secondsLeft?.toFixed(1)}s`}
        {state.status === 'running' && `${state.multiplier.toFixed(2)}x`}
        {state.status === 'crashed' && `CRASHED @ ${state.crashPoint.toFixed(2)}x`}
      </div>

      <p style={{ fontSize: 12, color: '#666' }}>Seed hash (commit): {state.seedHash}</p>
      {state.serverSeedRevealed && <p style={{ fontSize: 12, color: '#666' }}>Seed revealed: {state.serverSeedRevealed}</p>}

      <div style={{ marginTop: 20 }}>
        <label>Stake</label><br />
        <input type="number" value={stake} onChange={(e) => setStake(Number(e.target.value))} />
      </div>

      {state.status === 'waiting' && !state.yourBet && <button onClick={bet}>Place bet</button>}
      {state.yourBet?.status === 'active' && state.status === 'running' && <button onClick={doCashOut}>Cash out</button>}
      {state.yourBet && (
        <p>
          Your bet: {state.yourBet.stake} — {state.yourBet.status}
          {state.yourBet.payout ? ` — payout ${state.yourBet.payout.toFixed(2)}` : ''}
        </p>
      )}
    </main>
  );
}