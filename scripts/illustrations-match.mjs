// 6.14.23 : reconnaissance d'un rendu Midjourney d'après son nom de fichier (« <pseudo>_<début du prompt>_<identifiant>.png »).
// Utilisé par scripts/preprod-illustrations.mjs ; essai : node scripts/illustrations-match.mjs "<nom de fichier>".
const words = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/** Longueur du début commun entre le nom de fichier (pseudo éventuel en tête) et le prompt ; le dernier mot du nom peut être tronqué. */
export function matchScore(fileName, prompt) {
  const f = words(fileName.replace(/\.[a-z0-9]+$/i, "")).filter((w) => !/^[0-9a-f]{8,}$/.test(w) && !/^\d+$/.test(w));
  const p = words(prompt.replace(/^\/imagine prompt:\s*/i, ""));
  let best = 0;
  for (let skip = 0; skip <= 2; skip++) {
    let n = 0;
    while (n < p.length && skip + n < f.length) {
      const a = f[skip + n];
      const b = p[n];
      if (a === b || (skip + n === f.length - 1 && a.length >= 2 && b.startsWith(a))) n++;
      else break;
    }
    best = Math.max(best, n);
  }
  return best;
}

/** Image reconnue (score d'au moins 4 mots, 2 de plus que la suivante), sinon null. */
export function recognizeImage(fileName, slots) {
  const ranked = slots.map((s) => ({ id: s.id, score: matchScore(fileName, s.prompt) })).sort((a, b) => b.score - a.score);
  const [first, second] = ranked;
  return first && first.score >= 4 && first.score - (second?.score ?? 0) >= 2 ? first : null;
}


if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import("node:fs");
  const slots = JSON.parse(readFileSync(new URL("./illustrations.json", import.meta.url), "utf8")).slots;
  for (const name of process.argv.slice(2)) console.log(name, "→", recognizeImage(name, slots) ?? "à identifier");
}
