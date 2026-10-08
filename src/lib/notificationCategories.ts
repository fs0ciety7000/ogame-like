import type { NotificationKind } from "@/types/game";

/* Catégories de la cloche et regroupement des toasts. */

export type NotificationCategory = "all" | "build" | "war" | "rewards" | "social";

export const NOTIFICATION_CATEGORIES: { id: NotificationCategory; label: string; kinds: NotificationKind[] | null }[] = [
  { id: "all", label: "Tout", kinds: null },
  { id: "build", label: "Chantiers", kinds: ["building", "research", "unit"] },
  { id: "war", label: "Combats et flottes", kinds: ["combat-attacker", "combat-defender", "fleet", "spy", "spy-detected", "debris"] },
  { id: "rewards", label: "Missions et récompenses", kinds: ["mission", "bounty", "achievement", "gift", "season", "event"] },
  { id: "social", label: "Alliance et système", kinds: ["alliance", "message", "system", "report"] },
];

export function inCategory(kind: NotificationKind, category: NotificationCategory): boolean {
  const def = NOTIFICATION_CATEGORIES.find((c) => c.id === category);
  return !def?.kinds || def.kinds.includes(kind);
}

/** Alertes qui gardent toujours leur propre toast, même en rafale. */
export const URGENT_KINDS: NotificationKind[] = ["combat-defender", "spy-detected", "fleet", "season"];

const KIND_WORDS: Partial<Record<NotificationKind, [string, string]>> = {
  building: ["construction", "constructions"],
  research: ["recherche", "recherches"],
  unit: ["unité", "unités"],
  mission: ["mission", "missions"],
  bounty: ["prime", "primes"],
  achievement: ["succès", "succès"],
  "combat-attacker": ["combat", "combats"],
  "combat-defender": ["attaque subie", "attaques subies"],
  "spy-detected": ["sonde détectée", "sondes détectées"],
  fleet: ["alerte de flotte", "alertes de flotte"],
  spy: ["rapport d'espionnage", "rapports d'espionnage"],
  gift: ["don", "dons"],
  debris: ["recyclage", "recyclages"],
  alliance: ["message d'alliance", "messages d'alliance"],
  message: ["message privé", "messages privés"],
  season: ["annonce de saison", "annonces de saison"],
  event: ["évènement", "évènements"],
  report: ["réponse à un signalement", "réponses à des signalements"],
  system: ["message système", "messages système"],
};

/** « 3 constructions, 2 recherches et 1 mission » */
export function summarizeKinds(kinds: NotificationKind[]): string {
  const counts = new Map<NotificationKind, number>();
  for (const k of kinds) counts.set(k, (counts.get(k) ?? 0) + 1);
  const parts = [...counts.entries()].map(([k, n]) => {
    const words = KIND_WORDS[k] ?? ["évènement", "évènements"];
    return `${n} ${n > 1 ? words[1] : words[0]}`;
  });
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}`;
}

/** Page associée à chaque type de notification (clic dans la cloche, le journal, un toast). */
const KIND_LINKS: Partial<Record<NotificationKind, string>> = {
  building: "/game/batiments",
  research: "/game/labo",
  unit: "/game/unites",
  mission: "/game/missions",
  bounty: "/game/primes",
  "combat-attacker": "/game/combats",
  "combat-defender": "/game/combats",
  spy: "/game/combats",
  "spy-detected": "/game/combats",
  fleet: "/game/galaxie",
  achievement: "/game/succes",
  alliance: "/game/alliance",
  message: "/game/messages",
  debris: "/game/galaxie",
  report: "/game/signalements",
  season: "/game/palmares",
  event: "/game",
  gift: "/game/ressources",
};

/** Lien d'une notification : le sien (v3.8), sinon celui de son type. */
export function notificationLink(n: { kind: NotificationKind; link?: string | null; data?: unknown }): string | null {
  if (n.link && n.link.startsWith("/game")) return n.link;
  // 6.14.49 : balayage et saut de la phalange → panneau Lune (le radar d'alliance porte déjà son lien).
  const phalanx = n.data && typeof n.data === "object" ? (n.data as { phalanx?: unknown }).phalanx : undefined;
  if (phalanx === "scan" || phalanx === "jump") return "/game/statistiques?onglet=lune";
  return KIND_LINKS[n.kind] ?? null;
}

/* v5.11 : regroupement dans la cloche — des notifications consécutives de même
   type et de même titre, à moins de 6 h d'écart, forment un seul groupe dépliable. */
const GROUP_WINDOW_MS = 6 * 3600_000;

export interface NotificationGroup<T> {
  key: string;
  head: T;
  /** Les autres notifications du groupe (la plus récente est `head`). */
  rest: T[];
}

export function groupNotifications<T extends { id: string; kind: NotificationKind; title: string; createdAtMs: number }>(items: T[], windowMs = GROUP_WINDOW_MS): NotificationGroup<T>[] {
  const groups: NotificationGroup<T>[] = [];
  for (const n of items) {
    const last = groups[groups.length - 1];
    const prev = last ? (last.rest[last.rest.length - 1] ?? last.head) : null;
    if (last && prev && last.head.kind === n.kind && last.head.title === n.title && Math.abs(prev.createdAtMs - n.createdAtMs) <= windowMs) last.rest.push(n);
    else groups.push({ key: n.id, head: n, rest: [] });
  }
  return groups;
}

/* 6.14.77 (É30-1f, écart 6 de 6.14.70) : le genre `fleet` mêle les menaces (flotte hostile, raid, ultimatum, garnison au combat)
   et les retours sans danger (patrouille rentrée, saut réussi, livraison, expédition). Couleur = sens (DESIGN.md) : seul le premier
   cas est une alerte rouge. Classement par le texte, pour couvrir aussi les notifications déjà enregistrées. */
const HOSTILE_FLEET_TEXT = /hostile|impact dans|raid dans|exige|a combattu/i;

/** Notification de flotte qui annonce une menace ou une perte (alerte), par opposition à un retour ou un saut réussi. */
export function isHostileFleetNotification(n: { kind: NotificationKind; title?: string | null; message?: string | null }): boolean {
  if (n.kind !== "fleet") return false;
  return HOSTILE_FLEET_TEXT.test(`${n.title ?? ""} ${n.message ?? ""}`);
}
