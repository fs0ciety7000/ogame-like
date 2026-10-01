import type { ReportEntry } from "@/game/reports";

/* =====================================================
   Erreurs remontées automatiquement (v2.8) : une erreur JavaScript chez un
   joueur devient un signalement « Bug (auto) » réservé à l'équipe. Les
   occurrences d'une même erreur (même message, même pile une fois les
   numéros de ligne et les noms de fichiers versionnés retirés) sont
   regroupées sur un seul signalement, avec un compteur.
===================================================== */

export const AUTO_ERROR_RULES = {
  /** Erreurs envoyées par joueur sur une journée (UTC). */
  maxPerDay: 10,
  messageMax: 300,
  stackMax: 3000,
  /** Joueurs touchés gardés en mémoire sur le signalement. */
  affectedMax: 30,
};

/** Identifiant d'auteur des signalements automatiques (invisibles aux joueurs). */
export const AUTO_REPORTER_ID = "system";

/** Bruit sans intérêt : erreurs d'extensions, scripts tiers, réseau, déploiement. */
const IGNORED = [
  /^Script error\.?$/i,
  /ResizeObserver loop/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
  /^(TypeError: )?(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/i,
  /The user aborted a request|AbortError|autocancelled/i,
];
const EXTENSION = /chrome-extension:|moz-extension:|safari-extension:/i;

export interface ClientError {
  message: string;
  stack: string;
  page: string;
  version: string;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function sanitizeClientError(input: { message?: unknown; stack?: unknown; page?: unknown; version?: unknown }): ClientError | null {
  const message = str(input.message, AUTO_ERROR_RULES.messageMax);
  const stack = str(input.stack, AUTO_ERROR_RULES.stackMax);
  if (!message || isIgnoredError(message, stack)) return null;
  return { message, stack, page: str(input.page, 200), version: str(input.version, 20) };
}

export function isIgnoredError(message: string, stack = ""): boolean {
  return IGNORED.some((re) => re.test(message)) || EXTENSION.test(message) || EXTENSION.test(stack);
}

/** Pile normalisée : sans numéros de ligne, empreintes de fichiers ni origine. */
export function normalizeStack(stack: string): string {
  return stack
    .split("\n")
    .slice(0, 6)
    .map((l) =>
      l
        .replace(/https?:\/\/[^/\s)]+/g, "")
        .replace(/-[A-Za-z0-9_-]{6,}\.js/g, ".js")
        .replace(/\?[^\s):]*/g, "")
        .replace(/:\d+:\d+/g, "")
        .replace(/:\d+/g, "")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
}

/** Hachage court et stable (djb2), suffisant pour regrouper les doublons. */
export function errorKey(message: string, stack: string): string {
  const text = `${message.replace(/\d+/g, "#")}\n${normalizeStack(stack)}`;
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `e${(h >>> 0).toString(16)}`;
}

export function autoReportTitle(message: string): string {
  return `[Auto] ${message}`.slice(0, 120);
}

export function autoReportDescription(err: ClientError): string {
  return [err.message, "", err.stack || "(pile indisponible)"].join("\n").slice(0, 4000);
}

/** Nouvelle occurrence sur un signalement existant. `reopened` : il était clos. */
export function addOccurrence(
  report: { status: string; history: ReportEntry[]; occurrences: number; affected: string[] },
  pseudo: string,
  now: number,
): { status: string; history: ReportEntry[]; occurrences: number; affected: string[]; reopened: boolean } {
  const closed = report.status === "resolved" || report.status === "rejected";
  const affected = report.affected.includes(pseudo) || !pseudo ? report.affected : [...report.affected, pseudo].slice(-AUTO_ERROR_RULES.affectedMax);
  const history = closed
    ? [...report.history, { kind: "status" as const, atMs: now, byId: AUTO_REPORTER_ID, byName: "Système", staff: true, status: "new" as const, text: "L'erreur s'est reproduite après la clôture." }]
    : report.history;
  return { status: closed ? "new" : report.status, history, occurrences: (report.occurrences || 1) + 1, affected, reopened: closed };
}

/** Clé du quota quotidien d'un joueur. */
export function errorQuotaKey(uid: string, now: number): string {
  return `cosmic-err:${uid}:${new Date(now).toISOString().slice(0, 10)}`;
}
