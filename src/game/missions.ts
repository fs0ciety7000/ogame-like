import { formatInt } from "@/game/format";
export interface MissionDef {
  key: string;
  name: string;
  duration: number;
  reward: Record<string, number>;
  prereq: Record<string, number>;
}

/** XP des missions : 60 XP par heure de mission, quelle que soit la
 *  mission (arrondi, minimum 1). Les missions servent surtout à rattraper
 *  la lenteur de la production en début de partie ; l'XP vient
 *  principalement des combats, bâtiments et recherches. Relancer une
 *  mission courte en boucle ne rapporte donc pas plus d'XP par heure
 *  qu'une mission longue. */
export const MISSION_XP_PER_HOUR = 60;

export const DEFAULT_MISSIONS: Record<string, MissionDef> = {
  patrouille_courte: { key: "patrouille_courte", name: "Patrouille courte", duration: 60, reward: { scrap: 800, xp: 1 }, prereq: { drone_recuperateur: 2 } },
  forage_profond: { key: "forage_profond", name: "Forage profond", duration: 1800, reward: { scrap: 35000, xp: 30 }, prereq: { drone_recuperateur: 12, cargo: 3 } },
  collecte_energie: { key: "collecte_energie", name: "Collecte d'énergie", duration: 900, reward: { energy: 4000, xp: 15 }, prereq: { chasseur: 6, fregate: 2 } },
  analyse_signal: { key: "analyse_signal", name: "Analyse de signal", duration: 900, reward: { data: 2500, xp: 15 }, prereq: { drone_recuperateur: 6, sentinelle: 2 } },
  synthese_nano: { key: "synthese_nano", name: "Synthèse de nanocomposants", duration: 1800, reward: { nano: 600, xp: 30 }, prereq: { drone_recuperateur: 10, sentinelle: 4 } },
  expedition_longue: { key: "expedition_longue", name: "Expédition longue durée", duration: 3600, reward: { scrap: 60000, energy: 12000, xp: 60 }, prereq: { fregate: 5, cargo: 4, chasseur: 6 } },
  recuperation_acier: { key: "recuperation_acier", name: "Récupération d'acier renforcé", duration: 1200, reward: { reinforcedSteel: 30, xp: 20 }, prereq: { drone_recuperateur: 8, chasseur: 4 } },
  extraction_module: { key: "extraction_module", name: "Extraction de module cybernétique", duration: 1800, reward: { cyberModule: 40, xp: 30 }, prereq: { sentinelle: 5, fregate: 3 } },
  recolte_nanites: { key: "recolte_nanites", name: "Récolte de nanites synthétiques", duration: 2400, reward: { syntheticNanites: 50, xp: 40 }, prereq: { drone_recuperateur: 15, sentinelle: 6 } },
  fouille_archives_IA: { key: "fouille_archives_IA", name: "Fouille d'archives d'IA", duration: 3600, reward: { aiFragment: 60, xp: 60 }, prereq: { fregate: 6, sentinelle: 8 } },
  mission_elite: {
    key: "mission_elite",
    name: "Mission d'élite",
    duration: 7200,
    reward: { reinforcedSteel: 800, cyberModule: 600, syntheticNanites: 500, aiFragment: 400, xp: 120 },
    prereq: { fregate: 10, sentinelle: 10, chasseur: 10, cargo: 15 },
  },
  patrouille_perimetrique: {
  key: "patrouille_perimetrique", name: "Patrouille du périmètre", duration: 600, reward: { scrap: 8000, xp: 10 }, prereq: { roquette: 30 } },
  verrouillage_radar: { key: "verrouillage_radar", name: "Alerte invasion", duration: 1200, reward: { energy: 6000, xp: 20 }, prereq: { batterie_aa: 20, intercepteur: 10 } },
  suppression_blindee: { key: "suppression_blindee", name: "Repli des envahisseurs", duration: 1800, reward: { reinforcedSteel: 200, xp: 30 }, prereq: { canon_impulsion: 25, roquette: 50 } },
  bombardement_orbital: { key: "bombardement_orbital", name: "Siège repoussé", duration: 2700, reward: { scrap: 45000, cyberModule: 350, xp: 45 }, prereq: { canon_plasma: 50, canon_impulsion: 65 } },
  interception_prioritaire: { key: "interception_prioritaire", name: "Dernier bastion", duration: 3600, reward: { syntheticNanites: 400, aiFragment: 650, xp: 60 }, prereq: { intercepteur: 60, batterie_aa: 70 },
},
};

/* ---------- registre courant (remplacé par applyGameContent) ---------- */

export const MISSIONS: Record<string, MissionDef> = { ...DEFAULT_MISSIONS };

export function setMissions(defs: MissionDef[]) {
  for (const key of Object.keys(MISSIONS)) delete MISSIONS[key];
  for (const def of defs) MISSIONS[def.key] = def;
}

export function hasPrerequisites(mission: MissionDef, units: Record<string, { count: number }>): boolean {
  return Object.entries(mission.prereq).every(([unitId, req]) => (units[unitId]?.count ?? 0) >= req);
}

export function getRewardText(reward: Record<string, number>): string[] {
  const labels: Record<string, string> = {
    scrap: "🔩 Ferraille",
    energy: "⚡ Énergie",
    nano: "🧬 Nano-composants",
    data: "📡 Données anciennes",
    reinforcedSteel: "🛠️ Acier renforcé",
    cyberModule: "🧩 Module cybernétique",
    syntheticNanites: "🤖 Nanites synthétiques",
    aiFragment: "🧠 Fragment d'IA",
    xp: "⭐ XP",
  };
  const out = Object.entries(reward)
    .filter(([, v]) => v)
    .map(([k, v]) => `${labels[k] ?? k} ${formatInt(v)}`);
  return out.length ? out : ["Aucune récompense directe"];
}
