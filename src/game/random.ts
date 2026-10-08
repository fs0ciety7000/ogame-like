/* =====================================================
   6.14.149 (AU27, AP-13) : tirage reproductible des générateurs (Chroniques, passe, saga, bibliothèque).
   Sorti de procedural.ts (qui le réexporte) pour être lu par chronicles.ts sans import circulaire.
   À ne pas confondre avec `dailyRandom` (contracts.ts : objectifs du jour, primes), autre algorithme.
===================================================== */

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Même graine, même suite (mulberry32 sur un hachage FNV-1a de la graine). */
export function seededRandom(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
