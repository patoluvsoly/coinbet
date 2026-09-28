'use client';

import { useEffect, useState } from 'react';

export default function MinesPage() {
  const [game, setGame] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [stake, setStake] = useState(10);
  const [mines, setMines] = useState(3);
  const [clientSeed, setClientSeed] = useState('my-seed-123');

  async function load() {
    const res = await fetch('/api/games/mines/state');
    if (res.ok) {
      const d = await res.json();
      setGame(d.game);
      setBalance(d.balance);
    }
  }

  useEffect(() => { load(); }, []);

  async function post(url: string, body?: any) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setGame(data.game);
    setBalance(data.balance);
  }

  async function faucet() {
    const res = await fetch('/api/credits/faucet', { method: 'POST' });
    const data = await res.json();
    if (res.ok) setBalance(data.balance);
  }

  const active = game?.status === 'active';

  return (
    <main style={{ padding: 40, maxWidth: 500 }}>
      <h1>Mines (test credits)</h1>
      <p>Balance: {balance ?? '—'}</p>
      <button onClick={faucet}>Get 1000 test credits (dev)</button>

      {!active && (
        <div style={{ marginTop: 20 }}>
          <div><label>Stake</label><br />
            <input type="number" value={stake} onChange={(e) => setStake(Number(e.target.value))} /></div>
          <div><label>Mines (1–24)</label><br />
            <input type="number" value={mines} onChange={(e) => setMines(Number(e.target.value))} /></div>
          <div><label>Client seed</label><br />
            <input value={clientSeed} onChange={(e) => setClientSeed(e.target.value)} /></div>
          <button onClick={() => post('/api/games/mines/start', { stake, mines, clientSeed })} style={{ marginTop: 10 }}>
            Start game
          </button>
        </div>
      )}

      {game && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 12, color: '#666' }}>Seed commit: {game.seedHash}</p>
          <p>Status: {game.status} — multiplier {game.multiplier.toFixed(2)}x</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 60px)', gap: 6 }}>
            {Array.from({ length: 25 }, (_, i) => {
              const isRevealed = game.revealed.includes(i);
              const isMine = game.minePositions?.includes(i);
              return (
                <button
                  key={i}
                  disabled={!active || isRevealed}
                  onClick={() => post('/api/games/mines/reveal', { tile: i })}
                  style={{ height: 60, background: isMine ? '#e57373' : isRevealed ? '#81c784' : undefined }}
                >
                  {isMine ? '💣' : isRevealed ? '💎' : ''}
                </button>
              );
            })}
          </div>

          {active && (
            <button onClick={() => post('/api/games/mines/cashout')} style={{ marginTop: 10 }}>
              Cash out ({(game.stake * game.multiplier).toFixed(2)})
            </button>
          )}

          {!active && (
            <div style={{ marginTop: 10, border: '1px solid #ccc', padding: 12 }}>
              <p>{game.payout > 0 ? `Payout ${game.payout.toFixed(2)}` : 'LOST'}</p>
              <p style={{ fontSize: 12, color: '#666' }}>Seed revealed: {game.serverSeedRevealed}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}