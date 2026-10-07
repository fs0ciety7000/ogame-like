/* 6.14.32 : décisions prises seules (règle n° 3), lues dans docs/QUESTIONS.md au build et montrées sur /decisions (admins).
   Une question « ouverte » attend la réponse de l'utilisateur ; une fois reportée (« validée », « changée », « close »), elle quitte la
   page au déploiement suivant. Les conseils et groupes viennent de docs/decisions-a-valider.md quand la question y figure. */

export interface DecisionQuestion {
  id: string;
  date: string;
  lot: string;
  question: string;
  choice: string;
  revert: string;
  status: string;
  open: boolean;
}

export interface DecisionAdvice {
  group: string;
  effect: string;
  reco: string;
}

const cells = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(" | ")
    .map((c) => c.trim());

/** Retire le markdown léger (gras, code) pour l'affichage en texte. */
export function plainText(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
}

/** Lignes « | Qn | date | lot | question | choix | revenir | statut | » de QUESTIONS.md. */
export function parseQuestions(md: string): DecisionQuestion[] {
  const out: DecisionQuestion[] = [];
  for (const line of md.split("\n")) {
    if (!/^\| Q\d+ \|/.test(line)) continue;
    const c = cells(line);
    if (c.length < 7) continue;
    const status = c.slice(6).join(" | ");
    out.push({ id: c[0], date: c[1], lot: c[2], question: c[3], choice: c[4], revert: c[5], status, open: /^ouverte/i.test(status) });
  }
  return out;
}

/** Groupes et conseils de decisions-a-valider.md (« ## 2. Joueurs et équilibre (…) » puis lignes « | Qn | … | »). */
export function parseAdvice(md: string): Record<string, DecisionAdvice> {
  const out: Record<string, DecisionAdvice> = {};
  let group = "Autres";
  for (const line of md.split("\n")) {
    const h = /^## \d+\. (.+)$/.exec(line);
    if (h) {
      group = h[1].replace(/\s*\(.*\)\s*$/, "").trim();
      continue;
    }
    if (!/^\| Q\d+ \|/.test(line)) continue;
    const c = cells(line);
    if (c.length === 4) out[c[0]] = { group, effect: c[2], reco: c[3] };
    else if (c.length === 3) out[c[0]] = { group, effect: "", reco: c[2] };
  }
  return out;
}

/** Numéro d'une question (« Q12 » → 12), pour l'ordre d'affichage. */
export const questionNumber = (id: string): number => Number(id.replace(/\D/g, "")) || 0;
