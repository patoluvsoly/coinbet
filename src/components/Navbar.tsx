'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Dices, Coins, CircleDot, Bomb, Rocket, RotateCcw } from 'lucide-react';

const GAMES = [
  { href: '/games/dice', label: 'Dice', icon: Dices },
  { href: '/games/coinflip', label: 'Coinflip', icon: Coins },
  { href: '/games/plinko', label: 'Plinko', icon: CircleDot },
  { href: '/games/mines', label: 'Mines', icon: Bomb },
  { href: '/games/crash', label: 'Crash', icon: Rocket },
];

export function Navbar() {
  const [balance, setBalance] = useState<number | null>(null);

  function refreshBalance() {
    fetch('/api/credits/balance')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setBalance(d.balance))
      .catch(() => {});
  }

  useEffect(refreshBalance, []);

  async function devReset() {
    await fetch('/api/credits/reset', { method: 'POST' });
    refreshBalance();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-panel/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight text-neon-green">
          CoinBet
        </Link>

        <div className="hidden gap-1 md:flex">
          {GAMES.map((g) => {
            const Icon = g.icon;
            return (
              <Link
                key={g.href}
                href={g.href}
                title={g.label}
                className="rounded-md p-2.5 text-gray-300 transition hover:bg-panel2 hover:text-neon-green"
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {balance !== null && (
            <button
              onClick={devReset}
              title="Reset test credits (dev only)"
              className="flex items-center gap-1.5 rounded-md border border-border bg-panel2 px-3 py-1.5 text-sm font-medium text-neon-green hover:border-neon-green/40"
            >
              {balance.toFixed(2)} cr <RotateCcw size={13} className="opacity-50" />
            </button>
          )}
          <ConnectButton showBalance={false} />
        </div>
      </div>
    </nav>
  );
}