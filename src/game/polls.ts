/* =====================================================
   5.26 : sondages communautaires, rattachés à une annonce de
   l'administration. Un vote par joueur (modifiable jusqu'à la clôture),
   résultats visibles après avoir voté (ou toujours, selon le réglage).
   Votes dans la collection `poll_votes`, écrite par le serveur seul.
===================================================== */

export interface Poll {
  question: string;
  options: string[];
  /** Clôture (null : ouvert tant que l'annonce est en ligne). */
  closesAtMs: number | null;
  /** Résultats visibles avant d'avoir voté. */
  showResults: "after_vote" | "always";
}

export interface PollResults {
  counts: number[];
  total: number;
  mine: number | null;
  open: boolean;
}

export const POLL_RULES = { minOptions: 2, maxOptions: 6, maxQuestion: 160, maxOption: 80 };

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const POLL_RULES_META = {
  minOptions: { label: "Choix d'un sondage : au moins", min: 2, max: 10 },
  maxOptions: { label: "Choix d'un sondage : au plus", min: 2, max: 20 },
  maxQuestion: { label: "Question : longueur", unit: "caractères", min: 20, max: 1000 },
  maxOption: { label: "Choix : longueur", unit: "caractères", min: 10, max: 500 },
};

export function normalizePoll(raw: unknown): Poll | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const question = typeof r.question === "string" ? r.question.trim().slice(0, POLL_RULES.maxQuestion) : "";
  const options = (Array.isArray(r.options) ? r.options : [])
    .map((o) => (typeof o === "string" ? o.trim().slice(0, POLL_RULES.maxOption) : ""))
    .filter(Boolean)
    .slice(0, POLL_RULES.maxOptions);
  if (!question || options.length < POLL_RULES.minOptions) return null;
  const closes = Number(r.closesAtMs);
  return { question, options, closesAtMs: Number.isFinite(closes) && closes > 0 ? closes : null, showResults: r.showResults === "always" ? "always" : "after_vote" };
}

export function pollOpen(poll: Poll, now: number): boolean {
  return poll.closesAtMs === null || now < poll.closesAtMs;
}

/** Vérifie un vote ; renvoie l'index du choix. */
export function validateVote(poll: Poll | null, choice: unknown, now: number): number {
  if (!poll) throw new Error("Sondage introuvable.");
  if (!pollOpen(poll, now)) throw new Error("Ce sondage est clos.");
  const i = Math.floor(Number(choice));
  if (!(i >= 0 && i < poll.options.length) || String(i) !== String(choice).trim()) throw new Error("Choix invalide.");
  return i;
}

export function tally(poll: Poll, choices: number[], mine: number | null, now: number): PollResults {
  const counts = poll.options.map(() => 0);
  for (const c of choices) if (c >= 0 && c < counts.length) counts[c]++;
  return { counts, total: counts.reduce((a, b) => a + b, 0), mine, open: pollOpen(poll, now) };
}

/** Résultats montrés au joueur ? (après son vote, à la clôture, ou toujours selon le réglage) */
export function resultsVisible(poll: Poll, results: Pick<PollResults, "mine" | "open">): boolean {
  return poll.showResults === "always" || results.mine !== null || !results.open;
}
