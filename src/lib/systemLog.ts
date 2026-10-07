import { isHostileFleetNotification } from "@/lib/notificationCategories";
import type { GameNotification, NotificationKind } from "@/types/game";

/* Niveau et couleur d'une ligne du Journal système (accueil). Couleur = sens (DESIGN.md) : rouge (`danger`) pour une menace,
   ember pour l'attention, mint pour une réussite, or pour une récompense, cyan pour l'information. */

export interface SystemLogStyle {
  level: string;
  className: string;
}

const LEVEL_STYLE: Record<NotificationKind, SystemLogStyle> = {
  building: { level: "SUCCESS", className: "text-mint-glow" },
  research: { level: "SUCCESS", className: "text-mint-glow" },
  unit: { level: "SUCCESS", className: "text-mint-glow" },
  mission: { level: "SUCCESS", className: "text-mint-glow" },
  "combat-attacker": { level: "INFO", className: "text-cyan-glow" },
  "combat-defender": { level: "WARN", className: "text-ember-glow" },
  achievement: { level: "UNLOCK", className: "text-gold-glow" },
  "spy-detected": { level: "ALERT", className: "text-ember-glow" },
  bounty: { level: "HUNT", className: "text-gold-glow" },
  spy: { level: "INTEL", className: "text-cyan-glow" },
  debris: { level: "INFO", className: "text-slate-300" },
  season: { level: "SAISON", className: "text-gold-glow" },
  alliance: { level: "ALLIANCE", className: "text-cyan-glow" },
  event: { level: "EVENT", className: "text-gold-glow" },
  gift: { level: "INFO", className: "text-mint-glow" },
  // 6.14.77 (É30-1f) : un retour de flotte ou un saut réussi est une information ; l'alerte rouge reste aux menaces.
  fleet: { level: "INFO", className: "text-cyan-glow" },
  report: { level: "SUPPORT", className: "text-gold-glow" },
  message: { level: "MESSAGE", className: "text-cyan-glow" },
  system: { level: "INFO", className: "text-cyan-glow" },
};

const HOSTILE_FLEET: SystemLogStyle = { level: "ALERTE", className: "text-danger-glow" };

/** Niveau affiché et couleur d'une notification dans le Journal système. */
export function systemLogStyle(n: Pick<GameNotification, "kind" | "title" | "message">): SystemLogStyle {
  if (isHostileFleetNotification(n)) return HOSTILE_FLEET;
  return LEVEL_STYLE[n.kind] ?? LEVEL_STYLE.system;
}
