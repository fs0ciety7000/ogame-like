import { parisLocalToUtc } from "@/game/events";
import { allianceWeekId } from "@/game/allianceBoss";
import { upcomingAgenda } from "@/game/agenda";

/* =====================================================
   v4.6 : la Gazette du secteur. Chaque lundi à 9 h (Paris), un numéro
   résume la semaine écoulée : boss tombés, vendettas, guerres, meilleures
   progressions, plus gros pillage, seigneur le plus menaçant, nouveaux
   venus. Les 8 derniers numéros restent consultables (game_config
   « gazette »).
   5.15.15 : un numéro couvre la période depuis le précédent (plus de
   chevauchement après une publication manuelle), ne reprend pas une rubrique
   identique au numéro d'avant, et gagne des rubriques : chiffres de la
   semaine (comparés au numéro précédent), ascensions, rempart, marché,
   entraide, alliances, seigneur qui monte et agenda de la semaine.
===================================================== */

export const GAZETTE_KEY = "gazette";
export const GAZETTE_RULES = { publishHour: 9, keepIssues: 8 };

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const GAZETTE_RULES_META = {
  publishHour: { label: "Heure de parution (lundi, Paris)", unit: "h", min: 0, max: 23 },
  keepIssues: { label: "Numéros gardés", min: 1, max: 52 },
};

export type GazetteSectionKind = "boss" | "vendetta" | "war" | "progress" | "raid" | "warlord" | "newcomers" | "ascension" | "defense" | "market" | "solidarity" | "alliance" | "agenda";

export interface GazetteSection {
  kind: GazetteSectionKind;
  title: string;
  lines: string[];
}

/** 5.15.15 : les chiffres de la semaine, comparés d'un numéro à l'autre. */
export interface GazetteStats {
  battles: number;
  raids: number;
  defenses: number;
  loot: number;
  trades: number;
  tradeVolume: number;
  gifts: number;
  newcomers: number;
  activePlayers: number;
}

export interface GazetteIssue {
  id: string;
  number: number;
  weekId: string;
  publishedAtMs: number;
  /** Semaine couverte. */
  fromMs: number;
  toMs: number;
  headline: string;
  sections: GazetteSection[];
  stats?: GazetteStats;
}

export interface GazetteState {
  issues: GazetteIssue[];
  lastWeekId: string;
  /** XP de chaque joueur à la dernière publication (progressions de la semaine). */
  xpSnapshot: Record<string, number>;
  /** 5.15.15 : ascensions de chaque joueur à la dernière publication. */
  ascSnapshot: Record<string, number>;
  /** 5.15.15 : puissance de chaque seigneur à la dernière publication. */
  powerSnapshot: Record<string, number>;
  /** 5.15.15 : instantanés d'avant la dernière publication (si elle est remplacée dans la même semaine). */
  prevSnapshots?: GazetteSnapshots;
}

export interface GazetteSnapshots {
  xp: Record<string, number>;
  asc: Record<string, number>;
  power: Record<string, number>;
}

const numMap = (v: unknown): Record<string, number> => (v && typeof v === "object" ? (v as Record<string, number>) : {});

export function gazetteState(raw: unknown): GazetteState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<GazetteState>;
  return {
    issues: Array.isArray(r.issues) ? r.issues.filter((i) => i && typeof i.id === "string") : [],
    lastWeekId: typeof r.lastWeekId === "string" ? r.lastWeekId : "",
    xpSnapshot: numMap(r.xpSnapshot),
    ascSnapshot: numMap(r.ascSnapshot),
    powerSnapshot: numMap(r.powerSnapshot),
    ...(r.prevSnapshots && typeof r.prevSnapshots === "object"
      ? { prevSnapshots: { xp: numMap(r.prevSnapshots.xp), asc: numMap(r.prevSnapshots.asc), power: numMap(r.prevSnapshots.power) } }
      : {}),
  };
}

/** 5.15.15 : instantanés de référence : ceux d'avant le numéro de la semaine s'il va être remplacé. */
export function gazetteSnapshots(state: GazetteState, now: number): GazetteSnapshots {
  const replacing = state.issues[0]?.weekId === allianceWeekId(now);
  if (replacing && state.prevSnapshots) return state.prevSnapshots;
  return { xp: state.xpSnapshot, asc: state.ascSnapshot, power: state.powerSnapshot };
}

/** Heure de publication de la semaine en cours (lundi 9 h, Paris). */
export function gazettePublishAt(now: number): number {
  const monday = Date.parse(`${allianceWeekId(now)}T00:00:00Z`);
  return parisLocalToUtc(monday + GAZETTE_RULES.publishHour * 3600_000);
}

/** Le numéro de la semaine est-il dû ? */
export function gazetteDue(state: GazetteState, now: number): boolean {
  return state.lastWeekId !== allianceWeekId(now) && now >= gazettePublishAt(now);
}

/** 5.15.15 : numéro précédent d'une autre semaine (celui de la semaine en cours est remplacé). */
export function gazettePrevious(state: GazetteState, now: number): GazetteIssue | undefined {
  const week = allianceWeekId(now);
  return state.issues.find((i) => i.weekId !== week);
}

/** 5.15.15 : début de la période couverte : le numéro précédent (au plus 7 jours avant). */
export function gazetteSince(state: GazetteState, now: number): number {
  const week = now - 7 * 86400_000;
  const last = gazettePrevious(state, now)?.toMs ?? 0;
  return last > week && last < now ? last : week;
}

export interface GazetteInput {
  now: number;
  sinceMs: number;
  players: { uid: string; pseudo: string; xp: number; seasonXp?: number; createdAtMs?: number; ascensions?: number; lastActiveMs?: number }[];
  xpSnapshot: Record<string, number>;
  ascSnapshot?: Record<string, number>;
  powerSnapshot?: Record<string, number>;
  bosses: { name: string; status: "killed" | "failed"; endedAtMs: number; top: string[] }[];
  vendettas: { warlordName: string; ownerPseudo: string; won: boolean; finishedAtMs: number }[];
  wars: { attackerTag: string; defenderTag: string; winnerTag: string | null; endedAtMs: number }[];
  /** Combats gagnés par l'attaquant (pillages). */
  raids: { attackerPseudo: string; defenderPseudo: string; loot: number; timestamp: number }[];
  /** 5.15.15 : défenses réussies (le défenseur tient). */
  defenses?: { defenderPseudo: string; attackerPseudo: string; timestamp: number }[];
  /** 5.15.15 : nombre total de combats joueur contre joueur. */
  battles?: number;
  warlords: { name: string; power: number }[];
  /** 5.15.15 : échanges conclus au marché. */
  trades?: { sellerPseudo: string; buyerPseudo: string; amount: number; filledAtMs: number }[];
  /** 5.15.15 : dons de ressources entre joueurs. */
  gifts?: { fromPseudo: string; toPseudo: string; amount: number; timestamp: number }[];
  /** 5.15.15 : alliances fondées. */
  alliances?: { name: string; tag: string; createdAtMs: number }[];
  /** Numéro précédent (chiffres comparés, rubriques identiques écartées). */
  previous?: GazetteIssue;
}

/** Nombre court (sans Intl : le moteur du serveur n'en a pas). */
export function gazetteNumber(n: number): string {
  const v = Math.round(n);
  const short = (x: number, unit: string) => `${(Math.round(x * 10) / 10).toString().replace(".", ",")} ${unit}`;
  if (v >= 1e9) return short(v / 1e9, "Md");
  if (v >= 1e6) return short(v / 1e6, "M");
  if (v >= 1e4) return short(v / 1e3, "k");
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
const fmt = gazetteNumber;
const MEDALS = ["🥇", "🥈", "🥉"];
// 6.14.88 (RL-3) : jusqu'à l'Ascension X (même liste que `ASCENSION_ROMAN`, ascension.ts).
const ASCENSION_ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const DAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
/** « mardi 18 h » à l'heure de Paris (sans Intl). */
function parisDay(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const lastSunday = (m: number) => {
    const end = new Date(Date.UTC(y, m + 1, 0));
    return Date.UTC(y, m, end.getUTCDate() - end.getUTCDay(), 1);
  };
  const local = new Date(ms + (ms >= lastSunday(2) && ms < lastSunday(9) ? 2 : 1) * 3600_000);
  return `${DAY_NAMES[local.getUTCDay()]} ${local.getUTCHours()} h`;
}

/** Tri par nombre d'occurrences d'une clé (le plus fréquent d'abord). */
function topCounts<T>(items: T[], key: (t: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function compileGazette(input: GazetteInput, number: number): GazetteIssue {
  const { now, sinceMs } = input;
  const inWeek = (t: number) => t >= sinceMs && t < now;
  const sections: GazetteSection[] = [];

  const bosses = input.bosses.filter((b) => inWeek(b.endedAtMs));
  if (bosses.length > 0) {
    sections.push({
      kind: "boss",
      title: "Les géants de la semaine",
      lines: bosses.map((b) => (b.status === "killed" ? `${b.name} est tombé${b.top.length ? `. En première ligne : ${b.top.slice(0, 3).join(", ")}.` : "."}` : `${b.name} a résisté et s'est retiré.`)),
    });
  }

  const vendettas = input.vendettas.filter((v) => inWeek(v.finishedAtMs));
  if (vendettas.length > 0) {
    sections.push({
      kind: "vendetta",
      title: "Vendettas",
      lines: vendettas.map((v) => (v.won ? `${v.ownerPseudo} a fait plier ${v.warlordName}, qui fuit le secteur.` : `${v.warlordName} a tenu bon face à ${v.ownerPseudo}. La riposte approche.`)),
    });
  }

  const wars = input.wars.filter((w) => inWeek(w.endedAtMs));
  if (wars.length > 0) {
    sections.push({
      kind: "war",
      title: "Front des alliances",
      lines: wars.map((w) => (w.winnerTag ? `[${w.winnerTag}] remporte la guerre contre [${w.winnerTag === w.attackerTag ? w.defenderTag : w.attackerTag}].` : `[${w.attackerTag}] et [${w.defenderTag}] se quittent sur un match nul.`)),
    });
  }

  const hasSnapshot = Object.keys(input.xpSnapshot).length > 0;
  const progress = input.players
    .map((p) => ({ pseudo: p.pseudo, gain: hasSnapshot ? p.xp - (input.xpSnapshot[p.uid] ?? p.xp) : p.seasonXp ?? 0 }))
    .filter((p) => p.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 3);
  if (progress.length > 0) {
    sections.push({
      kind: "progress",
      title: hasSnapshot ? "Ils ont le plus progressé" : "En tête de la saison",
      lines: progress.map((p, i) => `${MEDALS[i]} ${p.pseudo} : +${fmt(p.gain)} XP`),
    });
  }

  // 5.15.15 : ascensions depuis le numéro précédent (sans instantané : rien, pour ne pas tout annoncer d'un coup).
  const ascSnap = input.ascSnapshot ?? {};
  if (Object.keys(ascSnap).length > 0) {
    const asc = input.players.filter((p) => (p.ascensions ?? 0) > (ascSnap[p.uid] ?? 0));
    if (asc.length > 0) {
      sections.push({ kind: "ascension", title: "Ascensions", lines: asc.slice(0, 6).map((p) => `${p.pseudo} franchit l'Ascension ${ASCENSION_ROMAN[p.ascensions ?? 0] || p.ascensions} et repart plus fort.`) });
    }
  }

  const weekRaids = input.raids.filter((r) => inWeek(r.timestamp) && r.loot > 0);
  const raid = [...weekRaids].sort((a, b) => b.loot - a.loot)[0];
  if (raid) {
    const raiders = topCounts(weekRaids, (r) => r.attackerPseudo);
    const lines = [`${raid.attackerPseudo} a vidé les coffres de ${raid.defenderPseudo} : ${fmt(raid.loot)} ressources emportées.`];
    if (raiders[0] && raiders[0][1] >= 2) lines.push(`Le plus actif : ${raiders[0][0]}, avec ${raiders[0][1]} pillages réussis.`);
    sections.push({ kind: "raid", title: "Le casse de la semaine", lines });
  }

  const defenses = (input.defenses ?? []).filter((d) => inWeek(d.timestamp));
  const wall = topCounts(defenses, (d) => d.defenderPseudo)[0];
  if (wall) {
    sections.push({ kind: "defense", title: "Le rempart", lines: [`${wall[0]} a repoussé ${wall[1]} attaque${wall[1] > 1 ? "s" : ""}. Les pillards iront voir ailleurs.`] });
  }

  const trades = (input.trades ?? []).filter((t) => inWeek(t.filledAtMs));
  if (trades.length > 0) {
    const big = [...trades].sort((a, b) => b.amount - a.amount)[0];
    const seller = topCounts(trades, (t) => t.sellerPseudo)[0];
    sections.push({
      kind: "market",
      title: "La place du marché",
      lines: [
        `${trades.length} échange${trades.length > 1 ? "s" : ""} conclu${trades.length > 1 ? "s" : ""}, ${fmt(trades.reduce((a, t) => a + t.amount, 0))} ressources ont changé de mains.`,
        `Plus grosse affaire : ${big.sellerPseudo} cède ${fmt(big.amount)} ressources à ${big.buyerPseudo}.`,
        ...(seller && seller[1] >= 3 ? [`Marchand de la semaine : ${seller[0]} (${seller[1]} ventes).`] : []),
      ],
    });
  }

  const gifts = (input.gifts ?? []).filter((g) => inWeek(g.timestamp));
  if (gifts.length > 0) {
    const giver = topCounts(gifts, (g) => g.fromPseudo)[0];
    sections.push({
      kind: "solidarity",
      title: "Entraide",
      lines: [`${gifts.length} envoi${gifts.length > 1 ? "s" : ""} de ressources entre commandants, ${fmt(gifts.reduce((a, g) => a + g.amount, 0))} au total.`, ...(giver ? [`Le plus généreux : ${giver[0]}.`] : [])],
    });
  }

  const founded = (input.alliances ?? []).filter((a) => inWeek(a.createdAtMs));
  if (founded.length > 0) {
    sections.push({ kind: "alliance", title: "Nouvelles bannières", lines: founded.slice(0, 6).map((a) => `[${a.tag}] ${a.name} hisse ses couleurs.`) });
  }

  // 5.15.15 : le seigneur qui a le plus grandi depuis le numéro précédent ; sans instantané, le plus fort.
  const powerSnap = input.powerSnapshot ?? {};
  const rising = input.warlords
    .map((w) => ({ ...w, gain: powerSnap[w.name] !== undefined ? w.power - powerSnap[w.name] : 0 }))
    .filter((w) => w.gain > 0)
    .sort((a, b) => b.gain - a.gain)[0];
  const strongest = [...input.warlords].sort((a, b) => b.power - a.power)[0];
  if (rising) {
    sections.push({ kind: "warlord", title: "Le seigneur qui monte", lines: [`${rising.name} gagne ${fmt(rising.gain)} de puissance en une semaine (${fmt(rising.power)} au total). Prudence aux abords de son territoire.`] });
  } else if (strongest) {
    sections.push({ kind: "warlord", title: "Le seigneur à surveiller", lines: [`${strongest.name} aligne ${fmt(strongest.power)} de puissance. Prudence aux abords de son territoire.`] });
  }

  const newcomers = input.players.filter((p) => p.createdAtMs && inWeek(p.createdAtMs)).map((p) => p.pseudo);
  if (newcomers.length > 0) {
    sections.push({ kind: "newcomers", title: "Bienvenue aux nouveaux commandants", lines: [newcomers.slice(0, 12).join(", ") + (newcomers.length > 12 ? ` et ${newcomers.length - 12} autres` : "") + "."] });
  }

  // 5.15.15 : la semaine qui vient (boss, week-end, Chroniques, fin de saison).
  const agenda = upcomingAgenda(now, 7).filter((i) => i.startMs >= now);
  if (agenda.length > 0) {
    sections.push({ kind: "agenda", title: "Cette semaine dans le secteur", lines: agenda.slice(0, 6).map((i) => `${parisDay(i.startMs)} : ${i.title}.`) });
  }

  // Une rubrique mot pour mot identique au numéro précédent n'apprend rien : on l'écarte.
  const prevSections = new Map((input.previous?.sections ?? []).map((s) => [s.kind, JSON.stringify(s.lines)]));
  const fresh = sections.filter((s) => s.kind === "agenda" || prevSections.get(s.kind) !== JSON.stringify(s.lines));

  const stats: GazetteStats = {
    battles: input.battles ?? weekRaids.length + defenses.length,
    raids: weekRaids.length,
    defenses: defenses.length,
    loot: weekRaids.reduce((a, r) => a + r.loot, 0),
    trades: trades.length,
    tradeVolume: trades.reduce((a, t) => a + t.amount, 0),
    gifts: gifts.length,
    newcomers: newcomers.length,
    activePlayers: input.players.filter((p) => (p.lastActiveMs ?? 0) >= sinceMs).length,
  };

  const killed = bosses.find((b) => b.status === "killed");
  const wonWar = wars.find((w) => w.winnerTag);
  const wonVendetta = vendettas.find((v) => v.won);
  const candidates = [
    killed && `${killed.name} tombe sous les coups du secteur`,
    wonWar && `[${wonWar.winnerTag}] gagne sa guerre`,
    wonVendetta && `${wonVendetta.warlordName} humilié par ${wonVendetta.ownerPseudo}`,
    raid && `${raid.attackerPseudo} signe le casse de la semaine`,
    wall && wall[1] >= 2 && `${wall[0]}, rempart du secteur`,
    progress[0] && `${progress[0].pseudo} file en tête`,
    rising && `${rising.name} gagne en puissance`,
    founded[0] && `[${founded[0].tag}] hisse ses couleurs`,
  ].filter((h): h is string => typeof h === "string");
  const headline = candidates.find((h) => h !== input.previous?.headline) ?? candidates[0] ?? "Semaine calme dans le secteur";

  const weekId = allianceWeekId(now);
  return { id: `gz-${weekId}-${now}`, number, weekId, publishedAtMs: now, fromMs: sinceMs, toMs: now, headline, sections: fresh, stats };
}

/** Ajoute un numéro (8 gardés) et prend les instantanés pour la semaine suivante. */
export function publishGazette(
  state: GazetteState,
  issue: GazetteIssue,
  players: { uid: string; xp: number; ascensions?: number }[],
  warlords: { name: string; power: number }[] = [],
): GazetteState {
  const replacing = state.issues[0]?.weekId === issue.weekId;
  return {
    issues: [issue, ...state.issues.filter((i) => i.weekId !== issue.weekId)].slice(0, GAZETTE_RULES.keepIssues),
    lastWeekId: issue.weekId,
    prevSnapshots: replacing && state.prevSnapshots ? state.prevSnapshots : { xp: state.xpSnapshot, asc: state.ascSnapshot, power: state.powerSnapshot },
    xpSnapshot: Object.fromEntries(players.map((p) => [p.uid, p.xp])),
    ascSnapshot: Object.fromEntries(players.map((p) => [p.uid, p.ascensions ?? 0])),
    powerSnapshot: Object.fromEntries(warlords.map((w) => [w.name, Math.round(w.power)])),
  };
}

/** Écart d'un chiffre avec le numéro précédent (affichage). */
export function gazetteTrend(cur: number, prev: number | undefined): { dir: "up" | "down" | "flat"; text: string } | null {
  if (prev === undefined) return null;
  const d = cur - prev;
  if (d === 0) return { dir: "flat", text: "=" };
  return { dir: d > 0 ? "up" : "down", text: `${d > 0 ? "+" : "−"}${fmt(Math.abs(d))}` };
}
