import type { ComposedEffect } from "@/game/effects";

/* =====================================================
   5.23 : catalogue d'effets composés, prêts à poser sur une relique, une
   technologie ou un rôle d'officier depuis l'administration. Inspirés des
   unités, bâtiments, technologies et modes de jeu (JcJ, PNJ, seigneurs).

   Valeurs suggérées :
     relic   multiplicateur du bonus de rareté (1 = +6 % en rare) ;
     tech    valeur par niveau ;
     officer valeur par niveau (niveau maximal 20 en général).
===================================================== */

export type EffectPresetFamily = "unites" | "classes" | "jcj" | "pnj" | "chantier" | "economie" | "renseignement";

export const EFFECT_PRESET_FAMILIES: Record<EffectPresetFamily, string> = {
  unites: "Unités",
  classes: "Classes et catégories",
  jcj: "Joueur contre joueur",
  pnj: "PNJ et seigneurs",
  chantier: "Chantier",
  economie: "Économie et Atelier",
  renseignement: "Renseignement",
};

export interface EffectPreset {
  id: string;
  name: string;
  family: EffectPresetFamily;
  effect: ComposedEffect;
  suggest: { relic: number; tech: number; officer: number };
  /** Idée de mise en jeu. */
  idea: string;
}

const UNIT = { relic: 2.5, tech: 0.03, officer: 0.01 };
const GROUP = { relic: 1.5, tech: 0.02, officer: 0.006 };
const WIDE = { relic: 1, tech: 0.01, officer: 0.004 };
const EDGE = { relic: 0.5, tech: 0.005, officer: 0.002 };

const p = (id: string, name: string, family: EffectPresetFamily, effect: ComposedEffect, suggest: EffectPreset["suggest"], idea: string): EffectPreset => ({ id, name, family, effect, suggest, idea });

export const EFFECT_PRESETS: EffectPreset[] = [
  // Unités : une unité précise, attaque ou points de vie.
  p("sentinelle_attaque", "Veille des Sentinelles", "unites", { stat: "unitAttack", target: "unit:sentinelle" }, UNIT, "Les Sentinelles (vaisseaux de classe Moyen) frappent plus fort."),
  p("sentinelle_pv", "Blindage de Sentinelle", "unites", { stat: "unitHp", target: "unit:sentinelle" }, UNIT, "Les Sentinelles tiennent plus longtemps."),
  p("plasma_attaque", "Plasma surchauffé", "unites", { stat: "unitAttack", target: "unit:canon_plasma" }, UNIT, "Technologie de fin de branche défensive."),
  p("impulsion_attaque", "Condensateurs d'impulsion", "unites", { stat: "unitAttack", target: "unit:canon_impulsion" }, UNIT, "Canons à impulsion plus mordants."),
  p("aa_pv", "Tourelles blindées", "unites", { stat: "unitHp", target: "unit:batterie_aa" }, UNIT, "Batteries anti-aériennes plus résistantes."),
  p("bastion_pv", "Bastion inébranlable", "unites", { stat: "unitHp", target: "unit:bastion" }, UNIT, "Le Bastion devient un mur."),
  p("essaim_attaque", "Salves anti-essaim", "unites", { stat: "unitAttack", target: "unit:batterie_essaim" }, UNIT, "Contre les flottes de Chasseurs."),
  p("chasseur_attaque", "Pilotes d'élite", "unites", { stat: "unitAttack", target: "unit:chasseur" }, UNIT, "Officier : les Chasseurs gagnent en mordant."),
  p("fregate_pv", "Coque de Frégate", "unites", { stat: "unitHp", target: "unit:fregate" }, UNIT, "Frégates plus durables en première ligne."),
  p("intercepteur_attaque", "Ailes d'Intercepteur", "unites", { stat: "unitAttack", target: "unit:intercepteur" }, UNIT, "Intercepteurs plus meurtriers."),
  p("nova_attaque", "Cœur de Nova", "unites", { stat: "unitAttack", target: "unit:croiseur_nova" }, UNIT, "Croiseurs Nova surpuissants."),
  p("lance_attaque", "Lance focalisée", "unites", { stat: "unitAttack", target: "unit:lance_gravitationnelle" }, UNIT, "Lance gravitationnelle plus précise."),
  p("etoile_pv", "Écorce de l'Étoile noire", "unites", { stat: "unitHp", target: "unit:etoile_noire" }, { relic: 1, tech: 0.01, officer: 0.004 }, "Pour la plus grosse unité : valeur prudente."),
  p("atelier_pv", "Coque d'Atelier", "unites", { stat: "unitHp", target: "unit:vaisseau_atelier" }, UNIT, "Les Vaisseaux-ateliers survivent aux raids."),
  // Classes et catégories.
  p("classe_faible", "Doctrine de l'essaim", "classes", { stat: "unitAttack", target: "class:light" }, GROUP, "Toutes les unités de classe Faible."),
  p("classe_moyen", "Doctrine de ligne", "classes", { stat: "unitHp", target: "class:medium" }, GROUP, "Toutes les unités de classe Moyen."),
  p("classe_fort", "Doctrine du marteau", "classes", { stat: "unitAttack", target: "class:heavy" }, GROUP, "Toutes les unités de classe Fort."),
  p("classe_fort_pv", "Plaques lourdes", "classes", { stat: "unitHp", target: "class:heavy" }, GROUP, "Unités Fortes plus résistantes."),
  p("defenses_pv", "Fortifications", "classes", { stat: "unitHp", target: "cat:defense" }, WIDE, "Toutes les défenses."),
  p("defenses_attaque", "Batteries calibrées", "classes", { stat: "unitAttack", target: "cat:defense" }, WIDE, "Toutes les défenses tirent plus fort."),
  p("vaisseaux_pv", "Coques renforcées", "classes", { stat: "unitHp", target: "cat:attack" }, WIDE, "Tous les vaisseaux."),
  p("avantage_classe", "Maître tacticien", "classes", { stat: "classEdge" }, EDGE, "Avantage de classe plus marqué (Fort > Moyen > Faible > Fort)."),
  p("bouclier", "Générateur auxiliaire", "classes", { stat: "shield" }, EDGE, "Bouclier planétaire en plus (défense de la base)."),
  // JcJ.
  p("jcj_attaque", "Duelliste", "jcj", { stat: "unitAttack", scope: "pvp" }, WIDE, "Attaque de toutes les unités, seulement contre les joueurs."),
  p("jcj_defenses", "Garde planétaire", "jcj", { stat: "unitHp", target: "cat:defense", scope: "pvp" }, GROUP, "Défenses plus solides face aux joueurs."),
  p("jcj_avantage", "Lecture du duel", "jcj", { stat: "classEdge", scope: "pvp" }, EDGE, "Avantage de classe, contre les joueurs."),
  p("jcj_butin", "Pillard", "jcj", { stat: "loot" }, WIDE, "Plus de butin pillé (comme le Corsaire)."),
  p("jcj_abri", "Coffre enterré", "jcj", { stat: "protectedStorage" }, { relic: 0.5, tech: 0.01, officer: 0.004 }, "Plus de stock à l'abri du pillage."),
  // PNJ et seigneurs.
  p("pnj_attaque", "Chasseur de primes", "pnj", { stat: "unitAttack", scope: "pve" }, WIDE, "Attaque contre pirates, primes, expéditions, boss et seigneurs."),
  p("pnj_defenses", "Rempart anti-pirates", "pnj", { stat: "unitHp", target: "cat:defense", scope: "pve" }, GROUP, "Défenses plus solides face aux raids PNJ."),
  p("seigneur_attaque", "Tueur de seigneurs", "pnj", { stat: "unitAttack", scope: "warlord" }, GROUP, "Attaque contre les seigneurs de guerre seulement."),
  p("seigneur_avantage", "Lire le seigneur", "pnj", { stat: "classEdge", scope: "warlord" }, EDGE, "Avantage de classe contre les seigneurs."),
  p("boss", "Brise-colosse", "pnj", { stat: "bossDamage" }, WIDE, "Dégâts contre les boss (comme le Chasseur)."),
  // Chantier.
  p("chantier_faible", "Chaîne légère", "chantier", { stat: "unitBuildTime", target: "class:light" }, GROUP, "Unités Faibles plus vite construites."),
  p("chantier_fort", "Cales sèches", "chantier", { stat: "unitBuildTime", target: "class:heavy" }, GROUP, "Unités Fortes plus vite construites."),
  p("chantier_defenses", "Préfabriqués", "chantier", { stat: "unitBuildTime", target: "cat:defense" }, GROUP, "Défenses plus vite construites."),
  p("cout_fort", "Forge des lourds", "chantier", { stat: "unitCost", target: "class:heavy" }, { relic: 1, tech: 0.01, officer: 0.004 }, "Unités Fortes moins chères."),
  p("cout_vaisseaux", "Économie de guerre", "chantier", { stat: "unitCost", target: "cat:attack" }, { relic: 0.5, tech: 0.005, officer: 0.002 }, "Tous les vaisseaux un peu moins chers."),
  p("cout_sentinelle", "Sentinelles en série", "chantier", { stat: "unitCost", target: "unit:sentinelle" }, { relic: 1.5, tech: 0.02, officer: 0.006 }, "Sentinelles moins chères."),
  p("cout_drone", "Drones recyclés", "chantier", { stat: "unitCost", target: "unit:drone_recuperateur" }, { relic: 1.5, tech: 0.02, officer: 0.006 }, "Drones récupérateurs moins chers."),
  p("hangar_attaque", "Hangar en extension", "chantier", { stat: "hangarCapacity", target: "attack" }, WIDE, "Plus de places au hangar d'attaque."),
  p("hangar_defense", "Casemates", "chantier", { stat: "hangarCapacity", target: "defense" }, WIDE, "Plus de places au hangar de défense."),
  p("cale_postes", "Berceaux repliables", "chantier", { stat: "dockCapacity" }, WIDE, "Plus de postes à la Cale sèche."),
  // Économie et Atelier.
  p("atelier_cadence", "Soudeurs de nuit", "economie", { stat: "repairSpeed" }, { relic: 2, tech: 0.05, officer: 0.02 }, "+ % de PV/s à l'Atelier de réparation."),
  p("reparation", "Nanites de coque", "economie", { stat: "repair" }, WIDE, "Plus de vaisseaux réparés après un combat."),
  p("ferraille", "Broyeurs", "economie", { stat: "production", target: "scrap" }, WIDE, "Production de ferraille."),
  p("energie", "Réacteurs", "economie", { stat: "production", target: "energy" }, WIDE, "Production d'énergie."),
  p("colonies", "Intendance coloniale", "economie", { stat: "productionAll", scope: "colonies" }, WIDE, "Production des colonies seulement."),
  p("mere_entrepot", "Silos de la capitale", "economie", { stat: "storage", scope: "home" }, GROUP, "Entrepôts de la planète mère."),
  p("marche", "Courtier", "economie", { stat: "tradeTax" }, WIDE, "Taxe du marché et des cadeaux réduite."),
  p("vol", "Couloirs de vol", "economie", { stat: "fleetSpeed" }, WIDE, "Temps de vol réduit."),
  p("soute", "Soutes pliées", "economie", { stat: "cargo" }, WIDE, "Plus de soute (butin, transports)."),
  p("entretien", "Intendance de flotte", "economie", { stat: "fleetUpkeep" }, WIDE, "Entretien de la flotte réduit."),
  // Renseignement.
  p("espion", "Lentilles profondes", "renseignement", { stat: "spyLevel" }, { relic: 10, tech: 0.2, officer: 0.1 }, "Niveau d'espionnage en plus."),
  p("detection", "Réseau d'écoute", "renseignement", { stat: "detection" }, WIDE, "Détecte mieux les sondes adverses."),
  p("contre", "Brouilleurs", "renseignement", { stat: "counterSpy" }, { relic: 20, tech: 0.5, officer: 0.1 }, "Points de contre-espionnage."),
];

export function findEffectPreset(id: string): EffectPreset | undefined {
  return EFFECT_PRESETS.find((x) => x.id === id);
}
