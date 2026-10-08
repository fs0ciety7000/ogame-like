/* v5.9 : badges du journal des nouveautés. Dans un fichier du changelog, un
   élément de liste peut commencer par une étiquette entre crochets :
     - [Nouveau] …   - [Amélioration] …   - [Fix] …   - [Équilibrage] …   - [Admin] …
   Elle s'affiche en pastille colorée, et l'en-tête de la version résume le
   nombre d'éléments de chaque type. */

export type ChangelogBadgeId = "new" | "improvement" | "fix" | "balance" | "admin";

export interface ChangelogBadge {
  id: ChangelogBadgeId;
  label: string;
  plural: string;
  color: string;
}

const CHANGELOG_BADGES: ChangelogBadge[] = [
  { id: "new", label: "Nouveau", plural: "Nouveautés", color: "var(--color-mint-glow)" },
  { id: "improvement", label: "Amélioration", plural: "Améliorations", color: "var(--color-cyan-glow)" },
  { id: "fix", label: "Fix", plural: "Corrections", color: "var(--color-ember-glow)" },
  { id: "balance", label: "Équilibrage", plural: "Équilibrages", color: "var(--color-gold-glow)" },
  { id: "admin", label: "Admin", plural: "Admin", color: "var(--color-violet-glow)" },
];

const ALIASES: Record<string, ChangelogBadgeId> = {
  nouveau: "new",
  nouveaute: "new",
  nouveautes: "new",
  new: "new",
  amelioration: "improvement",
  ameliorations: "improvement",
  fix: "fix",
  correction: "fix",
  corrections: "fix",
  correctif: "fix",
  equilibrage: "balance",
  admin: "admin",
  administration: "admin",
};

function key(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function changelogBadge(id: ChangelogBadgeId): ChangelogBadge {
  return CHANGELOG_BADGES.find((b) => b.id === id)!;
}

/** « [Fix] Texte » → badge + reste du texte ; sinon null. (Un lien « [x](url) » n'est pas un badge.) */
export function splitBadge(text: string): { badge: ChangelogBadge; rest: string } | null {
  const m = text.match(/^\[([^\]]{2,20})\](?!\()\s*(.*)$/);
  if (!m) return null;
  const id = ALIASES[key(m[1])];
  return id ? { badge: changelogBadge(id), rest: m[2] } : null;
}

/** Nombre d'éléments de chaque type dans un texte du changelog (ordre des badges). */
export function countBadges(body: string): { badge: ChangelogBadge; count: number }[] {
  const counts = new Map<ChangelogBadgeId, number>();
  for (const line of body.split("\n")) {
    const item = line.match(/^\s*[-*] (.*)$/);
    const found = item ? splitBadge(item[1]) : null;
    if (found) counts.set(found.badge.id, (counts.get(found.badge.id) ?? 0) + 1);
  }
  return CHANGELOG_BADGES.filter((b) => counts.has(b.id)).map((badge) => ({ badge, count: counts.get(badge.id)! }));
}
