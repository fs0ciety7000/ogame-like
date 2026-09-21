import { LOCKABLE_BUILDINGS } from "@/game/buildings";
import { getRankIndex } from "@/game/ranks";
import type { PlayerState } from "@/types/game";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  condition: (p: PlayerState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_blood",
    name: "Premier sang",
    description: "Remporte ton premier combat.",
    emoji: "⚔️",
    condition: (p) => p.victories >= 1,
  },
  {
    id: "veteran",
    name: "Vétéran",
    description: "Remporte 10 combats.",
    emoji: "🎖️",
    condition: (p) => p.victories >= 10,
  },
  {
    id: "architect",
    name: "Architecte",
    description: "Amène un bâtiment au niveau 10.",
    emoji: "🏛️",
    condition: (p) => Object.values(p.buildings).some((b) => b.level >= 10),
  },
  {
    id: "expansion",
    name: "Empire en expansion",
    description: "Débloque tous les bâtiments.",
    emoji: "🗺️",
    condition: (p) => LOCKABLE_BUILDINGS.every((id) => p.buildings[id]?.unlocked),
  },
  {
    id: "researcher",
    name: "Chercheur",
    description: "Termine 5 recherches.",
    emoji: "🔬",
    condition: (p) => Object.values(p.techLevels).filter((lvl) => lvl > 0).length >= 5,
  },
  {
    id: "commander",
    name: "Commandant",
    description: "Atteins le rang Bronze III.",
    emoji: "🏅",
    condition: (p) => getRankIndex(p.xp) >= 4,
  },
  {
    id: "fleet",
    name: "Flotte redoutable",
    description: "Possède 50 unités au total.",
    emoji: "🚀",
    condition: (p) => Object.values(p.units).reduce((sum, u) => sum + u.count, 0) >= 50,
  },
  {
    id: "tireless",
    name: "Increvable",
    description: "Cumule 24h de temps de jeu.",
    emoji: "⏱️",
    condition: (p) => p.playtimeSeconds >= 86_400,
  },
];

export function checkNewAchievements(player: PlayerState): Achievement[] {
  const unlocked = new Set(player.unlockedAchievements ?? []);
  return ACHIEVEMENTS.filter((a) => !unlocked.has(a.id) && a.condition(player));
}
