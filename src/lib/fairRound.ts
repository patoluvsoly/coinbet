import { getOrCreateSession, incrementNonce, rotateSeed } from './diceStore';
import { generateServerSeed, hashServerSeed } from './provablyFair';

// Runs one provably-fair bet: uses the committed seed, reveals it,
// then commits a fresh one. Never reveal without rotating.
export function playFair<T>(sessionId: string, compute: (serverSeed: string, nonce: number) => T) {
  const session = getOrCreateSession(sessionId, generateServerSeed);
  const nonce = incrementNonce(sessionId);
  const result = compute(session.serverSeed, nonce);

  const revealed = session.serverSeed;
  const next = generateServerSeed();
  rotateSeed(sessionId, () => next);

  return {
    result,
    nonce,
    serverSeedRevealed: revealed,
    serverSeedHashConfirm: hashServerSeed(revealed),
    nextServerSeedHash: hashServerSeed(next),
  };
}