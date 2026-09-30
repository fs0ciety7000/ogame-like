import type { NotificationKind } from "@/types/game";

/* Catégories de la cloche et regroupement des toasts. */

export type NotificationCategory = "all" | "build" | "war" | "rewards" | "social";

export const NOTIFICATION_CATEGORIES: { id: NotificationCategory; label: string; kinds: NotificationKind[] | null }[] = [
  { id: "all", label: "Tout", kinds: null },
  { id: "build", label: "Chantiers", kinds: ["building", "research", "unit"] },
  { id: "war", label: "Combats et flottes", kinds: ["combat-attacker", "combat-defender", "fleet", "spy", "spy-detected", "debris"] },
  { id: "rewards", label: "Missions et récompenses", kinds: ["mission", "achievement", "gift", "season", "event"] },
  { id: "social", label: "Alliance et système", kinds: ["alliance", "system"] },
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
  achievement: ["succès", "succès"],
  "combat-attacker": ["combat", "combats"],
  spy: ["rapport d'espionnage", "rapports d'espionnage"],
  gift: ["don", "dons"],
  debris: ["recyclage", "recyclages"],
  alliance: ["message d'alliance", "messages d'alliance"],
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
