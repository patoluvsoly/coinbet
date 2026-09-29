import Link from 'next/link';

const GAMES = [
  { href: '/games/dice', label: 'Dice', desc: 'Pick a target, roll under or over.', color: 'from-neon-green/20' },
  { href: '/games/coinflip', label: 'Coinflip', desc: 'Heads or tails, 2x on a win.', color: 'from-neon-blue/20' },
  { href: '/games/plinko', label: 'Plinko', desc: 'Drop the ball, watch it bounce.', color: 'from-neon-purple/20' },
  { href: '/games/mines', label: 'Mines', desc: 'Reveal tiles, avoid the bombs.', color: 'from-neon-red/20' },
  { href: '/games/crash', label: 'Crash', desc: 'Cash out before it crashes.', color: 'from-neon-green/20' },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Provably fair. <span className="text-neon-green">On-chain.</span>
        </h1>
        <p className="mt-3 text-gray-400">Every roll is verifiable. Nothing hidden, nothing rigged.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className={`group rounded-xl border border-border bg-gradient-to-br ${g.color} to-panel p-6 transition hover:border-neon-green/50 hover:shadow-neon`}
          >
            <h2 className="text-xl font-bold text-white group-hover:text-neon-green">{g.label}</h2>
            <p className="mt-2 text-sm text-gray-400">{g.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}