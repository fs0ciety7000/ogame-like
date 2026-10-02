import { chroniclesConfig, chronicleMonthId, episodeUnlockMs } from "@/game/chronicles";
import { FACTIONS } from "@/game/pirates";
import { UNITS } from "@/game/units";
import { warlordUid, warlordsConfig } from "@/game/warlords";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v4.8 : le Codex. Une fiche par faction, seigneur de guerre, boss, unité
   et épisode des Chroniques, débloquée en jouant :
   - faction : premier ultimatum reçu ;
   - seigneur : premier combat contre lui (rapport de combat) ;
   - Léviathan : abattu au moins une fois ;
   - boss du mois : sceau gagné, ou mois terminé (archives) ;
   - unité : construite au moins une fois ;
   - épisode : dès sa parution.
   À 100 %, le titre « Archiviste ».
===================================================== */

export const CODEX_TITLE = "Archiviste";

export type CodexCategory = "factions" | "warlords" | "bosses" | "units" | "chronicles";

export const CODEX_CATEGORIES: { id: CodexCategory; label: string; hint: string }[] = [
  { id: "factions", label: "Factions", hint: "Débloquée au premier ultimatum reçu." },
  { id: "warlords", label: "Seigneurs", hint: "Débloqué au premier combat contre lui." },
  { id: "bosses", label: "Boss", hint: "Abattu avec toi, ou archivé à la fin de son mois." },
  { id: "units", label: "Unités", hint: "Débloquée une fois construite." },
  { id: "chronicles", label: "Chroniques", hint: "Débloqué à sa parution." },
];

export interface CodexEntry {
  id: string;
  category: CodexCategory;
  name: string;
  subtitle: string;
  image: string;
  text: string;
  unlocked: boolean;
  /** Couleur d'accent (factions, seigneurs). */
  color?: string;
}

type CodexPlayer = Pick<PlayerState, "stats" | "units" | "chronicle">;

/** Toutes les fiches, avec leur état. `fought` : identifiants des seigneurs déjà affrontés. */
export function codexEntries(player: CodexPlayer, fought: ReadonlySet<string>, now: number): CodexEntry[] {
  const out: CodexEntry[] = [];
  const threatened = new Set(player.stats?.threatenedBy ?? []);
  for (const f of FACTIONS.filter((x) => x.enabled)) {
    out.push({ id: `faction:${f.id}`, category: "factions", name: f.name, subtitle: `${f.leader} · ${f.enforcer}`, image: f.emblem ?? f.art, text: f.story, unlocked: threatened.has(f.id), color: f.color });
  }
  for (const d of warlordsConfig().defs.filter((x) => x.enabled)) {
    out.push({ id: `warlord:${d.id}`, category: "warlords", name: d.name, subtitle: "Seigneur de guerre", image: d.portrait, text: d.bio, unlocked: fought.has(d.id) });
  }
  out.push({
    id: "boss:leviathan",
    category: "bosses",
    name: "Le Léviathan",
    subtitle: "Boss mondial",
    image: "/assets/leviathan/leviathan-portrait.webp",
    text: "Une bête de la taille d'une lune qui remonte des abysses du secteur un week-end par mois. Tout le serveur frappe ensemble ; ceux qui frappent le plus fort repartent avec ses reliques.",
    unlocked: (player.stats?.leviathanKills ?? 0) > 0,
  });
  const currentMonth = chronicleMonthId(now);
  const emblems = new Set((player.chronicle as { emblems?: string[] } | undefined)?.emblems ?? []);
  for (const m of chroniclesConfig().months) {
    if (episodeUnlockMs(m.id, 0) > now) continue;
    out.push({ id: `boss:${m.id}`, category: "bosses", name: m.boss.name, subtitle: `Boss de la chronique « ${m.title} »`, image: m.boss.image, text: m.boss.lore, unlocked: emblems.has(m.id) || m.id < currentMonth });
    m.episodes.forEach((e, i) => {
      if (episodeUnlockMs(m.id, i) > now) return;
      out.push({ id: `chronicle:${m.id}:${i}`, category: "chronicles", name: e.title, subtitle: `${m.title} · épisode ${i + 1}`, image: m.boss.emblem, text: e.lines.map((l) => l.text).join("\n\n"), unlocked: true });
    });
  }
  for (const u of UNITS) {
    out.push({ id: `unit:${u.id}`, category: "units", name: u.name, subtitle: u.category === "defense" ? "Défense" : "Flotte", image: u.image, text: u.description, unlocked: !!player.units?.[u.id] });
  }
  return out;
}

export function codexProgress(entries: CodexEntry[]): { unlocked: number; total: number; pct: number } {
  const unlocked = entries.filter((e) => e.unlocked).length;
  const total = entries.length;
  return { unlocked, total, pct: total > 0 ? Math.floor((unlocked / total) * 100) : 0 };
}

/** Seigneurs affrontés, d'après les identifiants des adversaires des rapports de combat. */
export function foughtWarlords(opponentUids: string[]): Set<string> {
  const byUid = new Map(warlordsConfig().defs.map((d) => [warlordUid(d.id), d.id]));
  return new Set(opponentUids.map((u) => byUid.get(u)).filter((x): x is string => !!x));
}

/** Titre « Archiviste » à 100 % (une seule fois). */
export function grantCodexTitle(player: PlayerState, entries: CodexEntry[]): boolean {
  if (codexProgress(entries).pct < 100) return false;
  if ((player.titles ?? []).some((t) => t.label === CODEX_TITLE)) return false;
  player.titles = [...(player.titles ?? []), { label: CODEX_TITLE, seasonId: "codex", rank: 1 }];
  return true;
}
