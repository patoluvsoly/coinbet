export default function GamesIndex() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Games</h1>
      <ul>
        <li><a href="/games/dice">Dice</a></li>
        <li><a href="/games/coinflip">Coinflip</a></li>
        <li><a href="/games/plinko">Plinko</a></li>
        <li><a href="/games/mines">Mines</a></li>
        <li><a href="/games/crash">Crash</a></li>
      </ul>
    </main>
  );
}