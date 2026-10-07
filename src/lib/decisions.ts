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

/** 6.14.37 : dépôt et branche où lire les documents (pré-prod : branche de travail ; production : main). */
export const DOCS_REPO = "https://github.com/fs0ciety7000/ogame-like/blob";

/** Fiches de changement de l'index docs/changes/README.md : version → fichier. */
export function parseChangeIndex(md: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of md.split("\n")) {
    const m = /^\| (\d+\.\d+\.\d+) \| \[[^\]]*\]\(([^)]+\.md)\)/.exec(line);
    if (m) out[m[1]] = `docs/changes/${m[2]}`;
  }
  return out;
}

/** Documents qui présentent une décision : fichiers `docs/…md` cités dans sa ligne, puis la fiche de chaque version du lot. */
export function decisionDocs(q: DecisionQuestion, changes: Record<string, string>): string[] {
  const text = [q.lot, q.question, q.choice, q.revert, q.status].join(" ");
  const out: string[] = [];
  const re = /(docs\/[0-9A-Za-z_./-]+\.md)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) if (!out.includes(m[1])) out.push(m[1]);
  const vre = /\b(\d+\.\d+\.\d+)\b/g;
  while ((m = vre.exec(q.lot))) {
    const f = changes[m[1]];
    if (f && !out.includes(f)) out.push(f);
  }
  return out;
}

/* 6.14.41 : feuille de route et plans sur /decisions (onglet « Feuille de route »). L'utilisateur valide ou modifie un lot (réponse
   `R:<lot>`) et ajoute des actions (réponse `A<horodatage>`) ; une réponse est traitée quand son identifiant est cité dans une
   feuille de route (scripts/decisions.mjs la signale sinon). */

export interface RoadmapLot {
  n: string;
  id: string;
  content: string;
  size: string;
  state: string;
}

export interface Roadmap {
  file: string;
  title: string;
  status: string;
  current: boolean;
  lots: RoadmapLot[];
}

/** Titre (« # Proposition : X » → « X ») et premier paragraphe « Statut : … » d'une proposition. */
function titleAndStatus(md: string): { title: string; status: string } {
  const lines = md.split("\n");
  const title = (lines.find((l) => l.startsWith("# ")) ?? "").replace(/^# /, "").replace(/^Proposition\s*:\s*/i, "").trim();
  const at = lines.findIndex((l) => /^Statut\s*:/i.test(l));
  const para: string[] = [];
  if (at >= 0) for (let i = at; i < lines.length && lines[i].trim() !== ""; i++) para.push(lines[i].trim());
  return { title, status: para.join(" ").replace(/^Statut\s*:\s*/i, "") };
}

/** Feuille de route : titre, statut, lots du tableau « | # | Lot | Contenu | Taille | État | ». */
export function parseRoadmap(file: string, md: string): Roadmap {
  const { title, status } = titleAndStatus(md);
  const lots: RoadmapLot[] = [];
  let inTable = false;
  for (const line of md.split("\n")) {
    if (/^\| # \| Lot \|/.test(line)) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.startsWith("|")) {
      inTable = false;
      continue;
    }
    if (/^\|[:\s-]+\|/.test(line)) continue;
    const c = cells(line);
    if (c.length >= 5) lots.push({ n: c[0], id: c[1], content: c[2], size: c[3], state: c.slice(4).join(" | ") });
  }
  return { file, title, status, current: /\*\*en cours\*\*/.test(status), lots };
}

export interface Plan {
  file: string;
  title: string;
  status: string;
}

/** Proposition (plan) : titre et statut, coupé à la première phrase. */
export function parsePlan(file: string, md: string): Plan {
  const { title, status } = titleAndStatus(md);
  const first = /^(.+?[.!?])(\s|$)/.exec(status)?.[1] ?? status;
  return { file, title, status: first.length > 220 ? `${first.slice(0, 217)}…` : first };
}

/** Identifiant de réponse d'un lot (le champ `qid` tient en 10 caractères). */
export const roadmapQid = (lotId: string): string => `R:${lotId}`.slice(0, 10);
/** Identifiant d'une action ajoutée. */
export const additionQid = (now: number): string => `A${now.toString(36)}`;
export const isAdditionQid = (qid: string): boolean => /^A[0-9a-z]+$/.test(qid);
/** Une réponse est traitée quand son identifiant est cité dans un des textes (feuilles de route). */
export const isHandled = (qid: string, texts: string[]): boolean => texts.some((t) => t.includes(qid));
/** État lu comme livré ou écarté (lot fini : plus de boutons). */
export const lotDone = (state: string): boolean => /^(livré|écarté|close|abandonné)/i.test(state.trim());

const SEASONS: Record<string, number> = { printemps: 1, ete: 2, q4: 3, automne: 3, hiver: 4 };
/** Ordre chronologique d'une feuille de route d'après son nom (`feuille-de-route-2030-ete.md` → 20302). */
export function roadmapOrder(file: string): number {
  const m = /feuille-de-route-(\d{4})-([a-z0-9]+)\.md$/.exec(file);
  return m ? Number(m[1]) * 10 + (SEASONS[m[2]] ?? 0) : 0;
}

/** Feuilles de route triées, la plus récente d'abord : la courante est la plus récente « en cours ». */
export function splitRoadmaps(list: Roadmap[]): { current: Roadmap | null; past: Roadmap[] } {
  const sorted = [...list].sort((a, b) => roadmapOrder(b.file) - roadmapOrder(a.file));
  const current = sorted.find((r) => r.current) ?? null;
  return { current, past: sorted.filter((r) => r !== current) };
}
