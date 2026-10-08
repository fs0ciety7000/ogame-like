import { MOON_RULES, moonLevel, playerMoon } from "@/game/moon";
import { PHALANX_RULES } from "@/game/phalanx";
import { PRESTIGE_IMAGE, PRESTIGE_RULES, prestigeMonument, prestigeState } from "@/game/prestige";
import { gateMinLevel, JUMP_GATE_RULES } from "@/game/jumpGate";
import { chroniclesConfig, chronicleMonthId, codexRewards, episodeUnlockMs } from "@/game/chronicles";
import { ALLIANCE_BOSSES } from "@/game/allianceBoss";
import type { BossHistoryEntry } from "@/game/bossHistory";
import { GameActionError } from "@/game/errors";
import { formatDecimal } from "@/game/format";
import { grantPassReward } from "@/game/seasonPass";
import { PERSONALITY_LABELS, TIER_LABELS } from "@/game/warlords";
import { WORLD_BOSSES } from "@/game/worldBosses";
import { FACTIONS } from "@/game/pirates";
import { UNITS } from "@/game/units";
import { BUILDINGS, effectiveBuildingLevel, findBuilding } from "@/game/buildings";
import { describeTechEffect, TECHNOLOGIES, techEffects, techImage } from "@/game/technologies";
import { RESOURCE_LIST } from "@/game/resources";
import { RELIC_EFFECT_LABELS, RELICS, relicImage, relicsState } from "@/game/relics";
import { COMMANDERS, commandersState } from "@/game/commanders";
import { BIOMES, biomeImage, colonyBiome, COLONY_SPEC_LORE, COLONY_SPECS, colonySpecImage, DEPOSIT_RULES, RARE_DEPOSITS } from "@/game/colonies";
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

export type CodexCategory = "factions" | "warlords" | "bosses" | "units" | "buildings" | "technologies" | "colonies" | "relics" | "officers" | "chronicles" | "legends";

export const CODEX_CATEGORIES: { id: CodexCategory; label: string; hint: string }[] = [
  { id: "factions", label: "Factions", hint: "Débloquée au premier ultimatum reçu." },
  { id: "warlords", label: "Seigneurs", hint: "Débloqué au premier combat contre lui." },
  { id: "bosses", label: "Boss", hint: "Abattu avec toi, ou archivé à la fin de son mois." },
  { id: "units", label: "Unités", hint: "Débloquée une fois construite." },
  // 6.14.12 (C2) : bâtiments construits et technos recherchées.
  { id: "buildings", label: "Bâtiments", hint: "Débloqué une fois construit." },
  { id: "technologies", label: "Technologies", hint: "Débloquée une fois recherchée." },
  // 6.14.115 (AJ27-5, QJ5) : biomes (relevé du secteur à la première colonie) et spécialisations (choisie une fois).
  { id: "colonies", label: "Colonies", hint: "Biomes : à ta première colonie. Spécialisation : choisie une fois." },
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
const resourceName = (id: string) => RESOURCE_LIST.find((r) => r.id === id)?.name ?? id;

type CodexPlayer = Pick<PlayerState, "stats" | "units" | "chronicle"> & Partial<Pick<PlayerState, "casino" | "relics" | "commanders" | "moon" | "buildings" | "techLevels" | "prestige" | "colonies">>;

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
  // 6.14.1 : les lunes (proposals/lunes.md), débloquée à la naissance de sa propre lune.
  const moon = playerMoon(player);
  out.push({
    id: "legend:lune",
    category: "legends",
    name: moon ? `Lune ${moon.name}` : "Les lunes",
    subtitle: "Née d'un grand combat au-dessus de la planète mère",
    image: "/assets/moon/lune.webp",
    text: "Quand deux flottes se brisent l'une contre l'autre en orbite basse, toute la ferraille ne retombe pas. Une partie reste en suspension, s'agrège et finit par tourner, assez lourde pour accrocher la lumière de l'étoile. Les vieux pilotes y voient un présage : une planète qui a encaissé un tel choc mérite qu'on veille sur elle. Les ingénieurs y voient surtout un relais de bouclier gratuit.",
    unlocked: !!moon,
    facts: [
      { label: "Chance", value: `1 % par ${Math.round(MOON_RULES.debrisPerPercent / 1000)} k de débris, ${Math.round(MOON_RULES.maxChance * 100)} % au plus` },
      { label: "Bonus", value: `bouclier +${Math.round(MOON_RULES.shieldBonus * 100)} % (jusqu'à +${Math.round((MOON_RULES.shieldBonus + MOON_RULES.shieldPerLevel * (MOON_RULES.maxLevel - 1)) * 100)} % au niveau ${MOON_RULES.maxLevel}), entrepôt à l'abri +${Math.round(MOON_RULES.protectedStorageBonus * 100)} %` },
      ...(moon ? [{ label: "Niveau", value: String(moonLevel(moon)) }] : []),
    ],
  });
  // 6.14.69 (É30-1d) : phalange et porte de saut, débloquées au premier usage (balayage, saut).
  const scans = Math.floor(Number(player.stats?.phalanxScans) || 0);
  const jumps = Math.floor(Number(player.stats?.gateJumps) || 0);
  out.push({
    id: "legend:phalange",
    category: "legends",
    name: "La phalange",
    subtitle: "L'œil de la lune",
    image: "/assets/moon/phalange.webp",
    text: "Les ingénieurs ont fini par tourner vers le ciel ce que la lune leur offrait : un socle stable, loin des parasites de la planète. Une parabole de coques soudées, un faisceau qui balaie le vide. La phalange ne voit pas tout. Elle voit ce qui vient vers toi et vers les tiens, et elle ne se laisse pas tromper par un leurre.",
    unlocked: scans > 0,
    facts: [
      { label: "Portée", value: `${PHALANX_RULES.rangePerLevel} par niveau de lune` },
      { label: "Perce les leurres", value: PHALANX_RULES.revealDecoyLevel > 0 ? `dès le niveau ${PHALANX_RULES.revealDecoyLevel}` : "jamais" },
      { label: "Révèle les capsules", value: PHALANX_RULES.revealBoostLevel > 0 ? `dès le niveau ${PHALANX_RULES.revealBoostLevel}` : "jamais" },
      ...(scans > 0 ? [{ label: "Tes balayages", value: String(scans) }] : []),
    ],
  });
  out.push({
    id: "legend:porte_saut",
    category: "legends",
    name: "La porte de saut",
    subtitle: "Le seuil de la lune",
    image: "/assets/moon/porte-de-saut.webp",
    text: "Un anneau ancré dans la roche, une membrane violette qui frémit au moindre signal. Personne ne sait vraiment pourquoi elle ne mène qu'à la planète mère. Les pilotes disent qu'elle reconnaît le chemin de la maison. Elle ne s'ouvre qu'une fois par jour, et jamais pour un pillard.",
    unlocked: jumps > 0,
    facts: [
      { label: "Ouverte", value: `dès le niveau ${gateMinLevel()} de la lune` },
      { label: "Recharge", value: `${JUMP_GATE_RULES.cooldownHours} h, ${JUMP_GATE_RULES.cooldownMinHours} h au moins` },
      ...(jumps > 0 ? [{ label: "Tes sauts", value: String(jumps) }] : []),
    ],
  });
  // 6.14.85 (RL-2) : projets de prestige, débloquée au premier projet achevé.
  const prestige = prestigeState(player);
  const monument = prestigeMonument(prestige.projects);
  out.push({
    id: "legend:prestige",
    category: "legends",
    name: "Les projets de prestige",
    subtitle: "Bâtir pour la postérité",
    image: PRESTIGE_IMAGE,
    text: "Quand les entrepôts débordent et que les chantiers n'ont plus rien à promettre, les grands empires se mettent à bâtir pour rien. Pour rien d'utile, du moins : des stèles gravées au nom des équipages, des arches que personne ne franchit, des flèches plantées dans le vide pour accrocher la lumière. Les voisins y voient du gaspillage. Les historiens, eux, ne retiennent que ces empires-là.",
    unlocked: prestige.projects > 0,
    facts: [
      { label: "Coût", value: `${PRESTIGE_RULES.hoursPerProject} h de ta production commune` },
      { label: "Durée", value: `${PRESTIGE_RULES.durationHours} h, un projet à la fois` },
      { label: "Récompense", value: `${PRESTIGE_RULES.pointsPerProject} points de prestige, monument, succès (aucun bonus)` },
      ...(prestige.projects > 0 ? [{ label: "Tes projets", value: String(prestige.projects) }] : []),
      ...(monument ? [{ label: "Ton monument", value: monument.name }] : []),
    ],
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
  // 6.14.12 (C2) : une fiche par bâtiment et par techno en vigueur.
  for (const b of BUILDINGS) {
    const prod = b.production ? RESOURCE_LIST.find((r) => r.id === b.production?.resource)?.name ?? b.production.resource : "";
    out.push({
      id: `building:${b.id}`,
      category: "buildings",
      name: b.name,
      subtitle: b.startsUnlocked ? "Bâtiment de départ" : "Bâtiment",
      image: b.image,
      text: b.description,
      unlocked: !!player.buildings && effectiveBuildingLevel(player.buildings, b.id) >= 1,
      facts: [{ label: "Niveau max", value: String(b.maxLevel) }, ...(prod ? [{ label: "Produit", value: prod }] : [])],
    });
  }
  for (const t of TECHNOLOGIES) {
    const effects = techEffects(t).map((e) => describeTechEffect(e, 1, { resource: resourceName, unit: unitName, building: (id) => findBuilding(id)?.name ?? id }));
    out.push({
      id: `tech:${t.id}`,
      category: "technologies",
      name: t.nom,
      subtitle: "Technologie",
      image: techImage(t),
      text: t.desc,
      unlocked: (player.techLevels?.[t.id] ?? 0) >= 1,
      facts: [{ label: "Niveau max", value: String(t.maxLevel) }, ...effects.slice(0, 2).map((value) => ({ label: "Au niveau 1", value }))],
    });
  }
  // 6.14.115 (AJ27-5, AJ-3) : colonies. Biomes ouverts par le relevé de la première colonie (deux colonies au plus : chaque biome
  // doit rester accessible), spécialisations ouvertes au premier choix et gardées après un changement.
  const colonies = player.colonies ?? [];
  const specsUsed = new Set([...((player.stats as { colonySpecsUsed?: string[] } | undefined)?.colonySpecsUsed ?? []), ...colonies.map((c) => c.spec).filter((x): x is NonNullable<typeof x> => !!x)]);
  const perSecond = DEPOSIT_RULES.perSecond;
  for (const b of RARE_DEPOSITS) {
    const mine = colonies.filter((c) => colonyBiome(c) === b).map((c) => c.name);
    out.push({
      id: `colony:biome:${b}`,
      category: "colonies",
      name: BIOMES[b].name,
      subtitle: `Biome · ${resourceName(b)}`,
      image: biomeImage(b),
      text: BIOMES[b].lore,
      unlocked: colonies.length > 0,
      color: BIOMES[b].tone,
      facts: [
        { label: "Gisement", value: BIOMES[b].deposit },
        ...(perSecond.length > 0 ? [{ label: "Extraction", value: `${formatDecimal(perSecond[0], 2)} à ${formatDecimal(perSecond[perSecond.length - 1], 2)} ${resourceName(b).toLowerCase()} par seconde (niveaux 1 à ${perSecond.length})` }] : []),
        ...(mine.length > 0 ? [{ label: "Tes colonies", value: mine.join(", ") }] : []),
      ],
    });
  }
  for (const sp of COLONY_SPECS) {
    out.push({
      id: `colony:spec:${sp.id}`,
      category: "colonies",
      name: sp.name,
      subtitle: "Spécialisation de colonie",
      image: colonySpecImage(sp.id),
      text: COLONY_SPEC_LORE[sp.id] ?? sp.summary,
      unlocked: specsUsed.has(sp.id),
      facts: [{ label: "Effet", value: sp.summary }],
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
  if (st.reward.amber > 0) grantPassReward(player, { kind: "amber", amount: st.reward.amber }, "codex", now, Math.random, "codex");
  player.stats = { ...(player.stats ?? {}), codexClaimed: [...codexClaimedCategories(player), id] } as PlayerState["stats"];
  return st.reward;
}

/** 5.15.12 : catégories complètes dont la récompense attend (pastille du menu). Sans les
 *  données du serveur (seigneurs, boss affrontés), seules les catégories sûres comptent. */
/** 6.14.25 (H29-3) : données du serveur pour les catégories Seigneurs et Boss (seigneurs affrontés, boss du Hall of fame). */
export interface CodexContext {
  fought: string[];
  bossesFought: string[];
}

const contextEntries = (player: CodexPlayer, now: number, ctx?: CodexContext) =>
  codexEntries(player, new Set(ctx?.fought ?? []), now, { bossesFought: new Set(ctx?.bossesFought ?? []) });

/** Catégories complètes à réclamer. Sans `ctx` (client), Seigneurs et Boss ne sont jamais complètes : pas de faux positif. */
export function codexClaimableCategories(player: CodexPlayer & Pick<PlayerState, "stats">, now: number, ctx?: CodexContext): CodexCategory[] {
  const entries = contextEntries(player, now, ctx);
  return CODEX_CATEGORIES.filter((c) => {
    const st = codexCategoryState(player, entries, c.id);
    return st.complete && !st.claimed && (st.reward.tokens > 0 || st.reward.amber > 0);
  }).map((c) => c.id);
}

export function codexClaimableCount(player: CodexPlayer & Pick<PlayerState, "stats">, now: number): number {
  return codexClaimableCategories(player, now).length;
}

/** 6.14.17 (Z1-2) : réclamation depuis « Tout réclamer » (action du joueur). 6.14.25 : le serveur fournit `ctx`, les
 *  catégories Seigneurs et Boss y passent aussi ; sans lui, elles ne sont jamais complètes. */
export function claimCodexCategoryLocal(player: PlayerState, category: unknown, now: number, ctx?: CodexContext): { tokens: number; amber: number } {
  return claimCodexCategory(player, contextEntries(player, now, ctx), category, now);
}

/** 6.14.113 (AU27, AC-G, AC-15) : titre « Archiviste » prêt ? Il exige 100 % du Codex, Seigneurs et Boss compris : sans `ctx`
 *  (client), jamais prêt (pas de faux positif sur la pastille) ; le serveur le compte dans « Tout réclamer ». */
export function codexTitleClaimable(player: CodexPlayer & Pick<PlayerState, "titles">, now: number, ctx?: CodexContext): boolean {
  if (!ctx) return false;
  if ((player.titles ?? []).some((t) => t.label === CODEX_TITLE)) return false;
  return codexProgress(contextEntries(player, now, ctx)).pct >= 100;
}

/** 6.14.113 (AC-19) : titre du Codex par l'action du joueur (un seul chemin, avec le rattrapage et la garde des vacances). */
export function claimCodexTitleLocal(player: PlayerState, now: number, ctx?: CodexContext): { title: string } {
  const entries = contextEntries(player, now, ctx);
  const progress = codexProgress(entries);
  if (progress.pct < 100) throw new GameActionError(`Codex complété à ${progress.pct} % : il faut 100 %.`);
  if (!grantCodexTitle(player, entries)) throw new GameActionError("Titre déjà reçu.");
  return { title: CODEX_TITLE };
}
