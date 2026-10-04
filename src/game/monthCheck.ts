import { bossWindows } from "@/game/events";
import { seasonBossSchedule, type ChroniclesConfig } from "@/game/chronicles";
import { leviathanSchedule, worldBossForStart } from "@/game/leviathan";
import { hasFullChallenges, validatePassSeasons, type PassSeasonsConfig } from "@/game/passSeasons";
import { defaultSimProfiles, passDurationVerdict, simulatePass } from "@/game/passSimulator";
import { seasonLabel } from "@/game/seasons";

/* =====================================================
   5.15.4 : vérification d'un mois avant son ouverture (administration et
   test de CI) : passe de saison, Chroniques, boss de saison et alternance
   avec le boss mondial. Une ligne par point, « ok » / « attention » / « bloquant ».
===================================================== */

export type CheckStatus = "ok" | "warn" | "bad";
export interface MonthCheckItem {
  area: "Passe" | "Chroniques" | "Boss de saison" | "Alternance";
  label: string;
  status: CheckStatus;
  detail: string;
}

const HOUR = 3600_000;

/** Bornes du mois (heure de Paris, à une heure près : suffisant pour des rendez-vous à 18 h). */
export function monthBounds(monthId: string): { startMs: number; endMs: number; days: number } {
  const [y, m] = monthId.split("-").map(Number);
  const startMs = Date.UTC(y, m - 1, 1) - HOUR;
  const endMs = Date.UTC(y, m, 1) - HOUR;
  return { startMs, endMs, days: Math.round((endMs - startMs) / (24 * HOUR)) };
}

/** Apparitions d'un calendrier de boss qui commencent dans le mois. */
export function windowsInMonth(monthId: string, schedule: Parameters<typeof bossWindows>[1]): { startMs: number; endMs: number }[] {
  const { startMs, endMs } = monthBounds(monthId);
  return bossWindows(startMs, schedule, 12).filter((w) => w.startMs >= startMs && w.startMs < endMs);
}

const fmt = (ms: number) => {
  const d = new Date(ms + HOUR);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")} h`;
};

export function checkMonth(monthId: string, content: { passSeasons: PassSeasonsConfig; chronicles: ChroniclesConfig }): MonthCheckItem[] {
  const out: MonthCheckItem[] = [];
  const { days } = monthBounds(monthId);
  const label = seasonLabel(monthId);

  // ---- Passe ----
  const pass = content.passSeasons.seasons.find((s) => s.id === monthId);
  if (!pass) {
    out.push({ area: "Passe", label: "Brouillon", status: "warn", detail: `Pas encore de passe pour ${label} : le générateur l'écrit à partir du jour réglé (ou « Générer » dans Passes de saison).` });
  } else {
    out.push({
      area: "Passe",
      label: pass.status === "published" ? "Publié" : "Brouillon",
      status: pass.status === "published" ? "ok" : "warn",
      detail: pass.status === "published" ? `« ${pass.theme.name} » est publié.` : `« ${pass.theme.name} » attend sa relecture ; il sera publié d'office au début du mois.`,
    });
    const errors = validatePassSeasons({ seasons: [pass] });
    out.push({ area: "Passe", label: "Contenu valide", status: errors.length ? "bad" : "ok", detail: errors.length ? errors.join(" ") : `${pass.tiers.length} paliers, ${pass.pointsPerTier} points par palier.` });
    out.push({
      area: "Passe",
      label: "Défis des paliers",
      status: hasFullChallenges(pass) ? "ok" : "bad",
      detail: hasFullChallenges(pass) ? "Un défi à chacun des paliers." : "Des paliers n'ont pas de défi : « Nouveaux défis » dans Passes de saison.",
    });
    const [, median] = defaultSimProfiles().map((p) => simulatePass(pass, p, days));
    const verdict = passDurationVerdict(median, days);
    out.push({ area: "Passe", label: "Durée (joueur médian)", status: verdict.tone === "mint" ? "ok" : verdict.tone === "ember" ? "warn" : "bad", detail: verdict.text });
    if (!pass.commander?.name) out.push({ area: "Passe", label: "Commandant du dernier palier", status: "bad", detail: "Aucun commandant de saison." });
  }

  // ---- Chroniques ----
  const month = content.chronicles.months.find((m) => m.id === monthId);
  if (!month) {
    out.push({ area: "Chroniques", label: "Chapitre", status: "bad", detail: `Aucun chapitre pour ${label} : pas d'épisodes ni de boss de saison ce mois-là.` });
  } else {
    out.push({
      area: "Chroniques",
      label: "Épisodes",
      status: month.episodes.length === 4 ? "ok" : month.episodes.length > 0 ? "warn" : "bad",
      detail: `« ${month.title} » : ${month.episodes.length} épisode${month.episodes.length > 1 ? "s" : ""} sur 4.`,
    });
    const bad = month.episodes.filter((e) => !(e.objective?.count > 0));
    if (bad.length) out.push({ area: "Chroniques", label: "Objectifs", status: "bad", detail: `${bad.length} épisode(s) sans objectif chiffré.` });
    out.push({
      area: "Boss de saison",
      label: "Identité",
      status: month.boss?.name && month.boss?.image ? "ok" : "bad",
      detail: month.boss?.name ? `${month.boss.name}${month.boss.image ? "" : " (sans image)"}.` : "Boss du mois sans nom.",
    });
  }

  // ---- Boss de saison : calendrier et alternance avec le boss mondial ----
  const sb = seasonBossSchedule();
  const world = windowsInMonth(monthId, leviathanSchedule());
  const season = sb.enabled ? windowsInMonth(monthId, sb) : [];
  // En alternance, une apparition par intervalle entre deux boss mondiaux : bien moins, c'est que la durée ne tient pas.
  const thin = !!sb.weekly?.between && season.length > 0 && season.length < world.length - 1;
  out.push({
    area: "Boss de saison",
    label: "Apparitions",
    status: !sb.enabled ? "warn" : season.length === 0 ? "bad" : thin ? "warn" : "ok",
    detail: !sb.enabled
      ? "Boss de saison désactivé dans les réglages."
      : season.length
        ? `${season.length} : ${season.map((w) => fmt(w.startMs)).join(", ")} (${sb.durationHours} h).${thin ? ` Seulement ${season.length} pour ${world.length} boss mondiaux : ${sb.durationHours} h ne tiennent pas dans tous les intervalles.` : ""}`
        : `Aucune apparition en ${label} (durée trop longue pour tenir entre deux boss mondiaux ?).`,
  });
  out.push({
    area: "Alternance",
    label: "Boss mondiaux",
    status: world.length > 0 ? "ok" : "warn",
    detail: world.length ? world.map((w) => `${fmt(w.startMs)} ${worldBossForStart(w.startMs).name}`).join(" · ") : "Aucun boss mondial ce mois-ci.",
  });
  const overlaps = season.filter((s) => world.some((w) => s.startMs < w.endMs && w.startMs < s.endMs));
  out.push({
    area: "Alternance",
    label: "Jamais en même temps",
    status: overlaps.length ? "bad" : "ok",
    detail: overlaps.length ? `${overlaps.length} apparition(s) du boss de saison chevauchent un boss mondial : ${overlaps.map((w) => fmt(w.startMs)).join(", ")}.` : "Aucun chevauchement entre boss de saison et boss mondial.",
  });
  return out;
}

export function monthCheckSummary(items: MonthCheckItem[]): CheckStatus {
  return items.some((i) => i.status === "bad") ? "bad" : items.some((i) => i.status === "warn") ? "warn" : "ok";
}
