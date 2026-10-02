import { parisLocalToUtc } from "@/game/events";
import { allianceWeekId } from "@/game/allianceBoss";

/* =====================================================
   v4.6 : la Gazette du secteur. Chaque lundi à 9 h (Paris), un numéro
   résume la semaine écoulée : boss tombés, vendettas, guerres, meilleures
   progressions, plus gros pillage, seigneur le plus menaçant, nouveaux
   venus. Les 8 derniers numéros restent consultables (game_config
   « gazette »).
===================================================== */

export const GAZETTE_KEY = "gazette";
export const GAZETTE_RULES = { publishHour: 9, keepIssues: 8 };

export type GazetteSectionKind = "boss" | "vendetta" | "war" | "progress" | "raid" | "warlord" | "newcomers";

export interface GazetteSection {
  kind: GazetteSectionKind;
  title: string;
  lines: string[];
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
}

export interface GazetteState {
  issues: GazetteIssue[];
  lastWeekId: string;
  /** XP de chaque joueur à la dernière publication (progressions de la semaine). */
  xpSnapshot: Record<string, number>;
}

export function gazetteState(raw: unknown): GazetteState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<GazetteState>;
  return {
    issues: Array.isArray(r.issues) ? r.issues.filter((i) => i && typeof i.id === "string") : [],
    lastWeekId: typeof r.lastWeekId === "string" ? r.lastWeekId : "",
    xpSnapshot: r.xpSnapshot && typeof r.xpSnapshot === "object" ? r.xpSnapshot : {},
  };
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

export interface GazetteInput {
  now: number;
  sinceMs: number;
  players: { uid: string; pseudo: string; xp: number; seasonXp?: number; createdAtMs?: number }[];
  xpSnapshot: Record<string, number>;
  bosses: { name: string; status: "killed" | "failed"; endedAtMs: number; top: string[] }[];
  vendettas: { warlordName: string; ownerPseudo: string; won: boolean; finishedAtMs: number }[];
  wars: { attackerTag: string; defenderTag: string; winnerTag: string | null; endedAtMs: number }[];
  raids: { attackerPseudo: string; defenderPseudo: string; loot: number; timestamp: number }[];
  warlords: { name: string; power: number }[];
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
      lines: progress.map((p, i) => `${["🥇", "🥈", "🥉"][i]} ${p.pseudo} : +${fmt(p.gain)} XP`),
    });
  }

  const raid = input.raids.filter((r) => inWeek(r.timestamp) && r.loot > 0).sort((a, b) => b.loot - a.loot)[0];
  if (raid) {
    sections.push({ kind: "raid", title: "Le casse de la semaine", lines: [`${raid.attackerPseudo} a vidé les coffres de ${raid.defenderPseudo} : ${fmt(raid.loot)} ressources emportées.`] });
  }

  const warlord = [...input.warlords].sort((a, b) => b.power - a.power)[0];
  if (warlord) {
    sections.push({ kind: "warlord", title: "Le seigneur à surveiller", lines: [`${warlord.name} aligne ${fmt(warlord.power)} de puissance. Prudence aux abords de son territoire.`] });
  }

  const newcomers = input.players.filter((p) => p.createdAtMs && inWeek(p.createdAtMs)).map((p) => p.pseudo);
  if (newcomers.length > 0) {
    sections.push({ kind: "newcomers", title: "Bienvenue aux nouveaux commandants", lines: [newcomers.slice(0, 12).join(", ") + (newcomers.length > 12 ? ` et ${newcomers.length - 12} autres` : "") + "."] });
  }

  const killed = bosses.find((b) => b.status === "killed");
  const headline = killed
    ? `${killed.name} tombe sous les coups du secteur`
    : wars.find((w) => w.winnerTag)
      ? `[${wars.find((w) => w.winnerTag)!.winnerTag}] gagne sa guerre`
      : vendettas.find((v) => v.won)
        ? `${vendettas.find((v) => v.won)!.warlordName} humilié par ${vendettas.find((v) => v.won)!.ownerPseudo}`
        : raid
          ? `${raid.attackerPseudo} signe le casse de la semaine`
          : progress[0]
            ? `${progress[0].pseudo} file en tête`
            : "Semaine calme dans le secteur";

  const weekId = allianceWeekId(now);
  return { id: `gz-${weekId}-${now}`, number, weekId, publishedAtMs: now, fromMs: sinceMs, toMs: now, headline, sections };
}

/** Ajoute un numéro (8 gardés) et prend l'instantané d'XP pour la semaine suivante. */
export function publishGazette(state: GazetteState, issue: GazetteIssue, players: { uid: string; xp: number }[]): GazetteState {
  return {
    issues: [issue, ...state.issues.filter((i) => i.weekId !== issue.weekId)].slice(0, GAZETTE_RULES.keepIssues),
    lastWeekId: issue.weekId,
    xpSnapshot: Object.fromEntries(players.map((p) => [p.uid, p.xp])),
  };
}
