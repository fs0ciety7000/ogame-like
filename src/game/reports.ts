import { GameActionError } from "@/game/errors";

/* =====================================================
   Signalements de problèmes (v2.7) : un joueur décrit un souci (avec une
   capture facultative et le contexte technique joint automatiquement),
   l'équipe le trie, répond et le résout. Chaque échange est consigné dans
   l'historique du signalement ; le joueur est notifié à chaque réponse.
===================================================== */

export type ReportCategory = "bug" | "display" | "balance" | "account" | "idea" | "other";
export type ReportStatus = "new" | "in_progress" | "resolved" | "rejected";

export const REPORT_CATEGORIES: { id: ReportCategory; label: string; hint: string }[] = [
  { id: "bug", label: "Bug", hint: "Quelque chose ne marche pas comme prévu" },
  { id: "display", label: "Affichage", hint: "Page mal affichée, texte coupé, mobile…" },
  { id: "balance", label: "Équilibrage", hint: "Coûts, gains, combats, factions…" },
  { id: "account", label: "Compte", hint: "Connexion, mot de passe, progression perdue" },
  { id: "idea", label: "Suggestion", hint: "Une idée pour améliorer le jeu" },
  { id: "other", label: "Autre", hint: "Tout le reste" },
];

export const REPORT_STATUSES: { id: ReportStatus; label: string; tone: "accent" | "gold" | "mint" | "danger" }[] = [
  { id: "new", label: "Nouveau", tone: "accent" },
  { id: "in_progress", label: "En cours", tone: "gold" },
  { id: "resolved", label: "Résolu", tone: "mint" },
  { id: "rejected", label: "Non retenu", tone: "danger" },
];

export const REPORT_RULES = {
  titleMax: 120,
  descriptionMin: 10,
  descriptionMax: 4000,
  commentMax: 2000,
  resolutionMax: 2000,
  /** Signalements par joueur sur 24 h glissantes. */
  maxPerDay: 5,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const REPORT_RULES_META = {
  titleMax: { label: "Titre : longueur", unit: "caractères", min: 20, max: 500 },
  descriptionMin: { label: "Description : longueur minimale", unit: "caractères", min: 0, max: 200 },
  descriptionMax: { label: "Description : longueur maximale", unit: "caractères", min: 100, max: 20_000 },
  commentMax: { label: "Commentaire : longueur", unit: "caractères", min: 100, max: 20_000 },
  resolutionMax: { label: "Résolution : longueur", unit: "caractères", min: 100, max: 20_000 },
  maxPerDay: { label: "Signalements par joueur sur 24 h", min: 1, max: 100 },
};

export interface ReportEntry {
  kind: "created" | "comment" | "status";
  atMs: number;
  byId: string;
  byName: string;
  /** Message de l'équipe (et non du joueur). */
  staff: boolean;
  text?: string;
  status?: ReportStatus;
}

export interface ReportContext {
  version?: string;
  page?: string;
  theme?: string;
  userAgent?: string;
  screen?: string;
}

export interface GameReport {
  id: string;
  reporterId: string;
  reporterPseudo: string;
  category: ReportCategory;
  title: string;
  description: string;
  context: ReportContext | null;
  status: ReportStatus;
  resolution: string;
  githubUrl: string;
  history: ReportEntry[];
  screenshot: string;
  createdAtMs: number;
  updatedAtMs: number;
  /** Dernière consultation par le joueur (réponses non lues au-delà). */
  reporterSeenAtMs: number;
  /** v2.8 : erreur remontée automatiquement (empreinte, occurrences, joueurs touchés). */
  autoKey?: string;
  occurrences?: number;
  affected?: string[];
}

function isReportCategory(v: unknown): v is ReportCategory {
  return REPORT_CATEGORIES.some((c) => c.id === v);
}

function isReportStatus(v: unknown): v is ReportStatus {
  return REPORT_STATUSES.some((s) => s.id === v);
}

export function reportStatusLabel(status: string): string {
  return REPORT_STATUSES.find((s) => s.id === status)?.label ?? status;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Champs d'un nouveau signalement, validés et nettoyés (le serveur fixe le reste). */
export function sanitizeNewReport(input: { category?: unknown; title?: unknown; description?: unknown; context?: unknown }): {
  category: ReportCategory;
  title: string;
  description: string;
  context: ReportContext;
} {
  const title = clean(input.title, REPORT_RULES.titleMax);
  const description = clean(input.description, REPORT_RULES.descriptionMax);
  if (!title) throw new GameActionError("Donne un titre à ton signalement.");
  if (description.length < REPORT_RULES.descriptionMin) throw new GameActionError("Décris le problème en quelques mots de plus.");
  const raw = input.context && typeof input.context === "object" ? (input.context as Record<string, unknown>) : {};
  return {
    category: isReportCategory(input.category) ? input.category : "other",
    title,
    description,
    context: {
      version: clean(raw.version, 20),
      page: clean(raw.page, 200),
      theme: clean(raw.theme, 20),
      userAgent: clean(raw.userAgent, 300),
      screen: clean(raw.screen, 40),
    },
  };
}

/** Limite de signalements sur 24 h (horodatages des précédents). */
export function assertReportQuota(previousCreatedAtMs: number[], now: number): void {
  const recent = previousCreatedAtMs.filter((t) => now - t < 24 * 3600_000).length;
  if (recent >= REPORT_RULES.maxPerDay) throw new GameActionError(`Tu as déjà envoyé ${REPORT_RULES.maxPerDay} signalements aujourd'hui : réessaie demain ou complète un signalement existant.`);
}

/** Message ajouté au fil (joueur ou équipe). */
export function addReportComment(history: ReportEntry[], author: { id: string; name: string; staff: boolean }, text: unknown, now: number): ReportEntry[] {
  const body = clean(text, REPORT_RULES.commentMax);
  if (!body) throw new GameActionError("Le message est vide.");
  return [...history, { kind: "comment", atMs: now, byId: author.id, byName: author.name, staff: author.staff, text: body }];
}

/** Mise à jour par l'équipe : statut, résolution, message. Renvoie ce qui change. */
export function applyStaffUpdate(
  report: Pick<GameReport, "status" | "resolution" | "history">,
  author: { id: string; name: string },
  update: { status?: unknown; resolution?: unknown; comment?: unknown },
  now: number,
): { status: ReportStatus; resolution: string; history: ReportEntry[]; changed: boolean; notify: string | null } {
  let history = [...(report.history ?? [])];
  let status = report.status;
  let resolution = report.resolution ?? "";
  const notes: string[] = [];
  if (update.status !== undefined) {
    if (!isReportStatus(update.status)) throw new GameActionError("Statut inconnu.");
    if (update.status !== status) {
      status = update.status;
      history.push({ kind: "status", atMs: now, byId: author.id, byName: author.name, staff: true, status });
      notes.push(`statut : ${reportStatusLabel(status)}`);
    }
  }
  if (update.resolution !== undefined) {
    const next = clean(update.resolution, REPORT_RULES.resolutionMax);
    if (next !== resolution) {
      resolution = next;
      if (next) notes.push("résolution renseignée");
    }
  }
  if (typeof update.comment === "string" && update.comment.trim()) {
    history = addReportComment(history, { id: author.id, name: author.name, staff: true }, update.comment, now);
    notes.push("nouvelle réponse");
  }
  const changed = status !== report.status || resolution !== (report.resolution ?? "") || history.length !== (report.history ?? []).length;
  return { status, resolution, history, changed, notify: notes.length > 0 ? notes.join(", ") : null };
}

/** Réponses de l'équipe que le joueur n'a pas encore vues. */
export function unreadStaffReplies(report: Pick<GameReport, "history" | "reporterSeenAtMs">): number {
  return (report.history ?? []).filter((h) => h.staff && h.atMs > (report.reporterSeenAtMs ?? 0)).length;
}

/** Corps Markdown d'une issue GitHub créée depuis un signalement. */
export function githubIssueBody(report: GameReport, link: string): string {
  const ctx = report.context ?? {};
  const cat = REPORT_CATEGORIES.find((c) => c.id === report.category)?.label ?? report.category;
  return [
    `**Signalé en jeu** par ${report.reporterPseudo || "un joueur"} · ${cat}`,
    "",
    report.description,
    "",
    "| Contexte | |",
    "|---|---|",
    `| Version | ${ctx.version || "?"} |`,
    `| Page | ${ctx.page || "?"} |`,
    `| Thème | ${ctx.theme || "?"} |`,
    `| Écran | ${ctx.screen || "?"} |`,
    `| Navigateur | ${ctx.userAgent || "?"} |`,
    "",
    report.screenshot ? `Capture jointe au signalement (voir l'administration).` : "",
    `Suivi dans l'administration : ${link}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
