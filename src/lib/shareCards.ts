import { publicShowcase } from "@/game/profile";
import { getRankIcon, getRankLabel } from "@/game/ranks";
import type { BossRecap } from "@/game/leviathan";
import { weekLabel, type WeeklyRecap } from "@/game/weeklyRecap";
import { formatCompact, formatDuration } from "@/lib/utils";
import type { VictoryCardInput } from "@/lib/victoryCard";
import type { PlayerState } from "@/types/game";

/* v5.10 : cartes partageables (même rendu que la carte de victoire). */

const FOOTER = "empire.fs0ciety.org";

/** Bilan d'un boss : l'image du boss en fond, la ligne du joueur. */
export function bossCardInput(recap: BossRecap, bossName: string, bossImage: string | undefined, player: PlayerState, tag?: string): VictoryCardInput {
  const show = publicShowcase(player);
  const mine = recap.mine;
  return {
    headline: recap.won ? "Boss abattu" : "Il a survécu",
    subtitle: mine ? `${bossName} · rang ${mine.rank} sur ${recap.participants}` : bossName,
    pseudo: player.pseudo,
    tag,
    rank: getRankLabel(player.xp ?? 0),
    banner: bossImage ? { image: bossImage } : show.banner,
    emblem: show.emblem ?? getRankIcon(player.xp ?? 0),
    stats: [
      { label: "Mes dégâts", value: formatCompact(mine?.damage ?? 0) },
      { label: "Part du total", value: `${Math.round((mine?.share ?? 0) * 1000) / 10} %` },
      { label: "Commandants", value: String(recap.participants) },
      { label: "Durée", value: formatDuration(recap.durationMs / 1000) },
    ],
    footer: `${recap.won ? "Victoire du serveur" : "Structure entamée à " + Math.round(recap.hpDealtPct * 100) + " %"} · ${FOOTER}`,
  };
}

/** Résumé de la semaine. */
export function weeklyCardInput(recap: WeeklyRecap, player: PlayerState, tag?: string): VictoryCardInput {
  const show = publicShowcase(player);
  const stats = [
    { label: "Victoires", value: String(recap.victories) },
    { label: "Butin", value: formatCompact(recap.loot) },
    { label: "Missions", value: String(recap.missions) },
    { label: "XP", value: `${recap.xp >= 0 ? "+" : ""}${formatCompact(recap.xp)}` },
  ];
  return {
    headline: "Ma semaine",
    subtitle: `${weekLabel(recap.weekId)}${recap.achievements ? ` · ${recap.achievements} succès` : ""}`,
    pseudo: player.pseudo,
    tag,
    rank: getRankLabel(player.xp ?? 0),
    banner: show.banner,
    emblem: show.emblem ?? getRankIcon(player.xp ?? 0),
    stats,
    footer: FOOTER,
  };
}
