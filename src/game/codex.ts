import { chroniclesConfig, chronicleMonthId, codexRewards, episodeUnlockMs } from "@/game/chronicles";
import { ALLIANCE_BOSSES } from "@/game/allianceBoss";
import type { BossHistoryEntry } from "@/game/bossHistory";
import { GameActionError } from "@/game/errors";
import { grantPassReward } from "@/game/seasonPass";
import { PERSONALITY_LABELS, TIER_LABELS } from "@/game/warlords";
import { WORLD_BOSSES } from "@/game/worldBosses";
import { FACTIONS } from "@/game/pirates";
import { UNITS } from "@/game/units";
import { RELIC_EFFECT_LABELS, RELICS, relicImage, relicsState } from "@/game/relics";
import { COMMANDERS, commandersState } from "@/game/commanders";
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

export type CodexCategory = "factions" | "warlords" | "bosses" | "units" | "relics" | "officers" | "chronicles" | "legends";

export const CODEX_CATEGORIES: { id: CodexCategory; label: string; hint: string }[] = [
  { id: "factions", label: "Factions", hint: "Débloquée au premier ultimatum reçu." },
  { id: "warlords", label: "Seigneurs", hint: "Débloqué au premier combat contre lui." },
  { id: "bosses", label: "Boss", hint: "Abattu avec toi, ou archivé à la fin de son mois." },
  { id: "units", label: "Unités", hint: "Débloquée une fois construite." },
  // 5.15.12 : reliques possédées et officiers recrutés.
  { id: "relics", label: "Reliques", hint: "Débloquée en possédant cette relique." },
  { id: "officers", label: "Officiers", hint: "Débloqué en recrutant cet officier." },
  { id: "chronicles", label: "Chroniques", hint: "Débloqué à sa parution." },
  // v5.14.2 : exploits rarissimes.
  { id: "legends", label: "Légendes", hint: "Débloquée par un exploit rarissime." },
];

/** 5.15.11 : ligne de la fiche, tirée des données du jeu (« Faiblesse : Frégate »). */
export interface CodexFact {
  label: string;
  value: string;
}

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
  /** 5.15.11 : fiche technique générée depuis les données. */
  facts?: CodexFact[];
}

/** 5.15.11 : ce que le joueur a affronté hors rapports de combat (Hall of fame des boss). */
export interface CodexExtra {
  /** Noms des boss (mondiaux, d'alliance) contre lesquels le joueur a frappé. */
  bossesFought?: ReadonlySet<string>;
}

/** Boss contre lesquels `uid` figure au classement d'un combat archivé. */
export function bossesFoughtBy(history: BossHistoryEntry[], uid: string): Set<string> {
  const out = new Set<string>();
  for (const e of history) if ((e.ranking ?? e.top ?? []).some((r) => r.uid === uid)) out.add(e.name);
  return out;
}

const unitName = (id: string) => UNITS.find((u) => u.id === id)?.name ?? id;

type CodexPlayer = Pick<PlayerState, "stats" | "units" | "chronicle"> & Partial<Pick<PlayerState, "casino" | "relics" | "commanders">>;

/** Toutes les fiches, avec leur état. `fought` : identifiants des seigneurs déjà affrontés. */
export function codexEntries(player: CodexPlayer, fought: ReadonlySet<string>, now: number, extra: CodexExtra = {}): CodexEntry[] {
  const bossesFought = extra.bossesFought ?? new Set<string>();
  const out: CodexEntry[] = [];
  const threatened = new Set(player.stats?.threatenedBy ?? []);
  for (const f of FACTIONS.filter((x) => x.enabled)) {
    out.push({
      id: `faction:${f.id}`,
      category: "factions",
      name: f.name,
      subtitle: `${f.leader} · ${f.enforcer}`,
      image: f.emblem ?? f.art,
      text: f.story,
      unlocked: threatened.has(f.id),
      color: f.color,
      facts: [
        { label: "Chef", value: f.leader },
        { label: "Bras armé", value: f.enforcer },
      ],
    });
  }
  for (const d of warlordsConfig().defs.filter((x) => x.enabled)) {
    out.push({
      id: `warlord:${d.id}`,
      category: "warlords",
      name: d.name,
      subtitle: "Seigneur de guerre",
      image: d.portrait,
      text: d.bio,
      unlocked: fought.has(d.id),
      facts: [
        { label: "Tempérament", value: PERSONALITY_LABELS[d.personality] ?? d.personality },
        { label: "Puissance", value: TIER_LABELS[d.tier] ?? d.tier },
      ],
    });
  }
  // 5.15.11 : les boss mondiaux de la rotation, chacun sa fiche (le Léviathan garde la sienne).
  for (const b of WORLD_BOSSES.filter((x) => x.enabled !== false)) {
    const leviathan = b.id === "leviathan";
    out.push({
      id: leviathan ? "boss:leviathan" : `worldboss:${b.id}`,
      category: "bosses",
      name: b.name,
      subtitle: `Boss mondial · ${b.epithet}`,
      image: leviathan ? "/assets/leviathan/leviathan-portrait.webp" : b.image,
      text: b.story,
      unlocked: bossesFought.has(b.name) || (leviathan && (player.stats?.leviathanKills ?? 0) > 0),
      color: b.accent,
      facts: [
        { label: "Phases", value: b.phases.map((p) => p.name).join(" → ") },
        { label: "Structure", value: `×${b.hpMult} (Léviathan = ×1)` },
        { label: "Faiblesse en phase 3", value: b.weakness.map(unitName).join(", ") },
        { label: "Titre du premier", value: b.title },
      ],
    });
  }
  // 5.15.11 : boss d'alliance (débloqué au premier assaut de ton alliance où tu as frappé).
  for (const b of ALLIANCE_BOSSES) {
    out.push({ id: `allianceboss:${b.id}`, category: "bosses", name: b.name, subtitle: "Boss d'alliance", image: b.image, text: b.lore, unlocked: bossesFought.has(b.name), facts: [{ label: "Affronté", value: "en alliance, chaque semaine de boss" }] });
  }
  const currentMonth = chronicleMonthId(now);
  const emblems = new Set((player.chronicle as { emblems?: string[] } | undefined)?.emblems ?? []);
  for (const m of chroniclesConfig().months) {
    if (episodeUnlockMs(m.id, 0) > now) continue;
    out.push({ id: `boss:${m.id}`, category: "bosses", name: m.boss.name, subtitle: `Boss de la chronique « ${m.title} »`, image: m.boss.image, text: m.boss.lore, unlocked: emblems.has(m.id) || m.id < currentMonth });
    m.episodes.forEach((e, i) => {
      if (episodeUnlockMs(m.id, i) > now) return;
      out.push({ id: `chronicle:${m.id}:${i}`, category: "chronicles", name: e.title, subtitle: `${m.title} · épisode ${i + 1}`, image: m.boss.emblem, text: e.lines.map((l) => l.text).join("\n\n"), unlocked: true });
    });
    // v5.4 : fiches propres au chapitre (dossiers, archives du secteur).
    for (const c of m.codex ?? []) out.push({ id: `lore:${m.id}:${c.id}`, category: "chronicles", name: c.name, subtitle: c.subtitle, image: c.image, text: c.text, unlocked: true });
  }
  // v5.14.2 : la Main d'or (gros lot du casino).
  out.push({
    id: "legend:main_or",
    category: "legends",
    name: "La Main d'or",
    subtitle: "Casino orbital · gros lot 7-7-7",
    image: "/assets/casino/main-or.webp",
    text: "Au fond de la salle des machines, une colonne de sept dorés s'illumine une fois tous les mille tirages, à peine. Celui qui l'aligne rafle l'essentiel du pot commun du secteur, et son nom est gravé sur la plaque de laiton au-dessus des rouleaux. Les croupiers kesh'vaar l'appellent « la Main d'or ». Ils disent qu'elle ne revient jamais deux fois au même pilote. Ils mentent.",
    unlocked: Math.floor(Number((player.casino as { jackpots?: number } | undefined)?.jackpots) || 0) > 0,
  });
  // 5.15.12 : reliques (hors retirées) et officiers de base.
  const owned = new Set(relicsState({ relics: player.relics }).items.map((r) => r.template));
  for (const t of RELICS.filter((x) => !x.disabled)) {
    out.push({
      id: `relic:${t.id}`,
      category: "relics",
      name: t.name,
      subtitle: t.mythicOnly ? "Relique mythique" : t.legendaryOnly ? "Relique légendaire" : "Relique",
      image: t.image ?? relicImage(t.id),
      text: t.lore,
      unlocked: owned.has(t.id),
      facts: [{ label: "Effet", value: RELIC_EFFECT_LABELS[t.effect] ?? t.effect }],
    });
  }
  const roster = commandersState({ commanders: player.commanders }).roster;
  for (const c of COMMANDERS) {
    out.push({
      id: `officer:${c.id}`,
      category: "officers",
      name: c.name,
      subtitle: c.title,
      image: c.portrait,
      text: `${c.name}, ${c.title.toLowerCase()} de l'état-major.`,
      unlocked: !!roster[c.id],
      facts: [
        { label: "Au niveau 1", value: c.bonus(1) },
        { label: "Gagne de l'expérience", value: c.domain },
        ...(c.rare ? [{ label: "Rareté", value: "jamais recruté : passe ou butin de boss" }] : []),
      ],
    });
  }
  for (const u of UNITS) {
    out.push({
      id: `unit:${u.id}`,
      category: "units",
      name: u.name,
      subtitle: u.category === "defense" ? "Défense" : "Flotte",
      image: u.image,
      text: u.description,
      unlocked: !!player.units?.[u.id],
      facts: [
        { label: "Attaque", value: String(u.stats.attaque) },
        { label: "Défense", value: String(u.stats.defense) },
        ...(u.category === "defense" ? [] : [{ label: "Vitesse", value: String(u.stats.vitesse) }, { label: "Soute", value: String(u.stats.cargo) }]),
      ],
    });
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

/* ---------- 5.15.11 : récompense par catégorie complète ---------- */

/** Jetons et Ambre d'une catégorie terminée (une fois), réglables dans l'admin (onglet Chroniques).
 *  Les Chroniques, toujours ouvertes, ne paient pas par défaut. */
export function codexCategoryReward(category: CodexCategory): { tokens: number; amber: number } {
  return codexRewards()[category] ?? { tokens: 0, amber: 0 };
}

export function codexClaimedCategories(player: Pick<PlayerState, "stats">): string[] {
  const raw = (player.stats as { codexClaimed?: unknown } | undefined)?.codexClaimed;
  return Array.isArray(raw) ? raw.map(String) : [];
}

/** Avancement d'une catégorie et état de sa récompense. */
export function codexCategoryState(player: Pick<PlayerState, "stats">, entries: CodexEntry[], category: CodexCategory): { unlocked: number; total: number; complete: boolean; claimed: boolean; reward: { tokens: number; amber: number } } {
  const list = entries.filter((e) => e.category === category);
  const unlocked = list.filter((e) => e.unlocked).length;
  return { unlocked, total: list.length, complete: list.length > 0 && unlocked === list.length, claimed: codexClaimedCategories(player).includes(category), reward: codexCategoryReward(category) };
}

/** Réclame la récompense d'une catégorie complète (serveur). */
export function claimCodexCategory(player: PlayerState, entries: CodexEntry[], category: unknown, now: number): { tokens: number; amber: number } {
  const id = String(category) as CodexCategory;
  if (!CODEX_CATEGORIES.some((c) => c.id === id)) throw new GameActionError("Catégorie inconnue.");
  const st = codexCategoryState(player, entries, id);
  if (st.reward.tokens <= 0 && st.reward.amber <= 0) throw new GameActionError("Pas de récompense pour cette catégorie.");
  if (st.claimed) throw new GameActionError("Récompense déjà reçue.");
  if (!st.complete) throw new GameActionError(`Catégorie incomplète (${st.unlocked} / ${st.total}).`);
  if (st.reward.tokens > 0) grantPassReward(player, { kind: "tokens", count: st.reward.tokens }, "codex", now);
  if (st.reward.amber > 0) grantPassReward(player, { kind: "amber", amount: st.reward.amber }, "codex", now);
  player.stats = { ...(player.stats ?? {}), codexClaimed: [...codexClaimedCategories(player), id] } as PlayerState["stats"];
  return st.reward;
}

/** 5.15.12 : catégories complètes dont la récompense attend (pastille du menu). Sans les
 *  données du serveur (seigneurs, boss affrontés), seules les catégories sûres comptent. */
export function codexClaimableCount(player: CodexPlayer & Pick<PlayerState, "stats">, now: number): number {
  const entries = codexEntries(player, new Set(), now);
  return CODEX_CATEGORIES.filter((c) => {
    const st = codexCategoryState(player, entries, c.id);
    return st.complete && !st.claimed && (st.reward.tokens > 0 || st.reward.amber > 0);
  }).length;
}
