import { ASCENSION_INSIGNIA, ascensionCount, ascensionLabel } from "@/game/ascension";
import { assetUrl } from "@/lib/assets";
import type { EmpireStats } from "@/game/empireStats";
import { publicShowcase } from "@/game/profile";
import { getRankIcon, getRankLabel } from "@/game/ranks";
import type { EmpireCardInput } from "@/lib/empireCard";
import { formatCompact } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/** v5.7 : carte d'empire (page Statistiques) ou de profil, à partir du joueur. */
export function empireCardFromPlayer(
  player: PlayerState,
  st: EmpireStats,
  opts: { kind: "empire" | "profile"; tag?: string; avatar?: string; now: number },
): EmpireCardInput {
  const show = publicShowcase(player);
  const o = st.overview;
  const m = st.military;
  const titles = [...(player.titles ?? [])].reverse().map((t) => t.label);
  const date = new Date(opts.now).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const empire = [
    { label: "Production / h", value: formatCompact(Math.round(st.economy.totalPerHour)) },
    { label: "Attaque", value: formatCompact(Math.round(m.modifiedAttack)), tone: "#ff8a4c" },
    { label: "Défense", value: formatCompact(Math.round(m.modifiedDefense)), tone: "#5cf2b0" },
    { label: "Combats", value: `${o.victories} V · ${o.defeats} D` },
    { label: "Planètes", value: String(st.planets.length) },
    { label: "Succès", value: `${st.progression.achievements} / ${st.progression.achievementsTotal}` },
  ];
  const profile = [
    { label: "XP", value: formatCompact(o.xp) },
    { label: "Victoires", value: `${o.victories} (${o.winPct} %)` },
    { label: "Succès", value: `${st.progression.achievements} / ${st.progression.achievementsTotal}` },
    { label: "Titres", value: String(st.progression.titles), tone: "#ffd86b" },
    { label: "Ascensions", value: String(o.ascensions) },
    { label: "Ancienneté", value: `${o.accountDays} j` },
  ];
  return {
    kicker: opts.kind === "empire" ? "État de l'empire" : "Profil",
    pseudo: player.pseudo,
    tag: opts.tag || undefined,
    rank: getRankLabel(player.xp ?? 0),
    rankIcon: getRankIcon(player.xp ?? 0),
    ascensions: ascensionCount(player),
    ascensionLabel: ascensionLabel(ascensionCount(player)),
    ascensionIcon: ASCENSION_INSIGNIA ? assetUrl(ASCENSION_INSIGNIA) : undefined,
    title: player.activeTitle || undefined,
    avatar: opts.avatar || undefined,
    banner: show.banner,
    emblem: show.emblem,
    motto: show.motto || undefined,
    stats: opts.kind === "empire" ? empire : profile,
    titles: titles.filter((t) => t !== player.activeTitle),
    footer: `${date} · empire.fs0ciety.org`,
  };
}
