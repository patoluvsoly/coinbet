'use client';

import { useEffect, useRef, useState } from 'react';
import { Plane } from 'lucide-react';

const TRACK_W = 100;
const TRACK_H = 100;

function progressFor(mult: number) {
  return 1 - 1 / mult;
}

// Both trail and plane use TOP-based y (y=0 at top, matches SVG natively).
function pointFor(mult: number) {
  const p = progressFor(mult);
  return { x: p * TRACK_W, y: TRACK_H - p * TRACK_H };
}

export default function CrashPage() {
  const [state, setState] = useState<any>(null);
  const [stake, setStake] = useState(10);
  const [balance, setBalance] = useState<number | null>(null);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);
  const pollRef = useRef<any>(null);
  const lastRoundId = useRef<string | null>(null);

  async function faucet() {
    const res = await fetch('/api/credits/faucet', { method: 'POST' });
    const data = await res.json();
    if (res.ok) setBalance(data.balance);
  }

  async function poll() {
    const res = await fetch('/api/games/crash/state');
    if (!res.ok) return;
    const data = await res.json();

    if (data.roundId !== lastRoundId.current) {
      lastRoundId.current = data.roundId;
      setTrail([]);
    }

    if (data.status === 'running') {
      setTrail((prev) => [...prev, pointFor(data.multiplier)]);
    }

    setState(data);
  }

  useEffect(() => {
    poll();
    pollRef.current = setInterval(poll, 150);
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

  if (!state) return <main className="px-4 py-10 text-center text-gray-500">Loading…</main>;
  const secondsLeft = state.status === 'waiting' ? Math.max(0, (state.bettingEndsAt - Date.now()) / 1000) : null;

  const mult = state.status === 'crashed' ? state.crashPoint : state.multiplier ?? 1;
  const current = pointFor(mult);

  // Angle of travel from the last two trail points, so the nose always
  // matches the actual direction — no guessed constant.
  let angleDeg = -45;
  if (trail.length >= 2) {
    const a = trail[trail.length - 2];
    const b = trail[trail.length - 1];
    angleDeg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
  }

  const pathD = trail.length > 1 ? `M ${trail.map((pt) => `${pt.x},${pt.y}`).join(' L ')}` : '';

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">Crash</h1>
      <p className="mt-1 text-sm text-gray-500">cash out before it drops</p>

      <div className="mt-6 rounded-xl border border-border bg-panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">Balance</span>
          <span className="font-semibold text-neon-green">{balance !== null ? balance.toFixed(2) : '—'}</span>
        </div>
        <button onClick={faucet} className="mb-6 w-full rounded-md border border-border py-2 text-sm text-gray-300 hover:bg-panel2">
          Get 1000 test credits (dev)
        </button>

        <div className="relative mb-6 h-40 overflow-hidden rounded-lg border border-border bg-panel2">
          <svg viewBox={`0 0 ${TRACK_W} ${TRACK_H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={state.status === 'crashed' ? '#ff4d6d' : '#00ffa3'}
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.8"
              />
            )}
          </svg>

          <div
            className={`absolute transition-[top,left] duration-150 ease-linear ${state.status === 'crashed' ? 'animate-plane-crash' : ''}`}
            style={{
              left: `${current.x}%`,
              top: `${current.y}%`,
              transform: `translate(-50%, -50%) rotate(${angleDeg + 45}deg)`,
            }}
          >
            {/*
              lucide's Plane icon faces up-right by default (~-45deg
              already). If the nose still looks backwards on your
              screen, add +180 to angleDeg above — that's the only
              adjustment this needs, since the direction math itself
              is now derived from the real trail, not guessed.
            */}
            <Plane
              size={28}
              className={
                state.status === 'crashed' ? 'text-neon-red' : state.status === 'running' ? 'text-neon-green' : 'text-gray-600'
              }
            />
          </div>

          <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
            {state.status === 'waiting' && <span className="text-gray-400">{secondsLeft?.toFixed(1)}s</span>}
            {state.status === 'running' && <span className="text-neon-green">{state.multiplier.toFixed(2)}x</span>}
            {state.status === 'crashed' && <span className="text-neon-red">CRASHED {state.crashPoint.toFixed(2)}x</span>}
          </div>
        </div>

        <p className="mb-4 break-all text-xs text-gray-500">
          Seed hash: {state.seedHash}
          {state.serverSeedRevealed && <><br />Revealed: {state.serverSeedRevealed}</>}
        </p>

        <div className="mb-4">
          <label className="mb-1 block text-xs text-gray-400">Stake</label>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-panel2 px-3 py-2 text-sm outline-none focus:border-neon-green"
          />
        </div>

        {state.status === 'waiting' && !state.yourBet && (
          <button onClick={bet} className="w-full rounded-md bg-neon-green py-2.5 font-semibold text-black hover:brightness-110">
            Place bet
          </button>
        )}
        {state.yourBet?.status === 'active' && state.status === 'running' && (
          <button onClick={doCashOut} className="w-full rounded-md bg-neon-purple py-2.5 font-semibold text-white hover:brightness-110">
            Cash out ({(state.yourBet.stake * state.multiplier).toFixed(2)})
          </button>
        )}
        {state.yourBet && (
          <p className="mt-3 text-sm text-gray-400">
            Your bet: {state.yourBet.stake} — {state.yourBet.status}
            {state.yourBet.payout ? ` — payout ${state.yourBet.payout.toFixed(2)}` : ''}
          </p>
        )}
      </div>
    </main>
  );
}