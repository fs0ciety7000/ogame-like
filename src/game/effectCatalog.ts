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

export type EffectBudgetId = "unit" | "group" | "wide" | "edge" | "elite";
type Suggest = EffectPreset["suggest"];

/** 6.14.104 (AU27, lot AA3, constat AA-13) : barèmes des préréglages d'effets, réglables dans l'admin (registre
 *  « effectPresets »). Ils guident l'admin quand il compose un effet (relique, techno, officier) : aucun effet en jeu n'en dépend. */
export const EFFECT_PRESET_RULES = {
  budgets: {
    /** Une unité précise. */
    unit: { relic: 2.5, tech: 0.03, officer: 0.01 },
    /** Une classe d'unités. */
    group: { relic: 1.5, tech: 0.02, officer: 0.006 },
    /** Une catégorie entière (toutes les défenses, tous les vaisseaux). */
    wide: { relic: 1, tech: 0.01, officer: 0.004 },
    /** Effet très large ou très fort. */
    edge: { relic: 0.5, tech: 0.005, officer: 0.002 },
    /** 6.14.12 : unités d'élite (très fortes) : même barème que l'Étoile noire. */
    elite: { relic: 1, tech: 0.01, officer: 0.004 },
  } as Record<EffectBudgetId, Suggest>,
};

/** 6.14.104 (AA3) : libellé et aide de chaque réglage (admin, Tous les réglages). */
export const EFFECT_PRESET_RULES_META = {
  budgets: {
    label: "Barèmes des préréglages d'effets",
    hint: "Par barème (unit : une unité ; group : une classe ; wide : une catégorie ; edge : effet très large ; elite : unités d'élite), valeur suggérée pour une relique (multiplicateur du bonus de rareté), une techno et un officier (par niveau). Simple aide à l'édition : aucun effet en jeu ne change.",
  },
};

const p = (id: string, name: string, family: EffectPresetFamily, effect: ComposedEffect, suggest: Suggest | EffectBudgetId, idea: string): EffectPreset => ({
  id,
  name,
  family,
  effect,
  // Barème nommé : lu à l'usage dans EFFECT_PRESET_RULES (copie) ; barème propre au préréglage : valeurs en dur.
  get suggest(): Suggest {
    if (typeof suggest !== "string") return suggest;
    const b = EFFECT_PRESET_RULES.budgets[suggest] ?? { relic: 0, tech: 0, officer: 0 };
    return { relic: Number(b.relic) || 0, tech: Number(b.tech) || 0, officer: Number(b.officer) || 0 };
  },
  idea,
});

export const EFFECT_PRESETS: EffectPreset[] = [
  // Unités : une unité précise, attaque ou points de vie.
  p("sentinelle_attaque", "Veille des Sentinelles", "unites", { stat: "unitAttack", target: "unit:sentinelle" }, "unit", "Les Sentinelles (vaisseaux de classe Moyen) frappent plus fort."),
  p("sentinelle_pv", "Blindage de Sentinelle", "unites", { stat: "unitHp", target: "unit:sentinelle" }, "unit", "Les Sentinelles tiennent plus longtemps."),
  p("plasma_attaque", "Plasma surchauffé", "unites", { stat: "unitAttack", target: "unit:canon_plasma" }, "unit", "Technologie de fin de branche défensive."),
  p("impulsion_attaque", "Condensateurs d'impulsion", "unites", { stat: "unitAttack", target: "unit:canon_impulsion" }, "unit", "Canons à impulsion plus mordants."),
  p("aa_pv", "Tourelles blindées", "unites", { stat: "unitHp", target: "unit:batterie_aa" }, "unit", "Batteries anti-aériennes plus résistantes."),
  p("bastion_pv", "Bastion inébranlable", "unites", { stat: "unitHp", target: "unit:bastion" }, "unit", "Le Bastion devient un mur."),
  p("essaim_attaque", "Salves anti-essaim", "unites", { stat: "unitAttack", target: "unit:batterie_essaim" }, "unit", "Contre les flottes de Chasseurs."),
  p("chasseur_attaque", "Pilotes d'élite", "unites", { stat: "unitAttack", target: "unit:chasseur" }, "unit", "Officier : les Chasseurs gagnent en mordant."),
  p("fregate_pv", "Coque de Frégate", "unites", { stat: "unitHp", target: "unit:fregate" }, "unit", "Frégates plus durables en première ligne."),
  p("intercepteur_attaque", "Ailes d'Intercepteur", "unites", { stat: "unitAttack", target: "unit:intercepteur" }, "unit", "Intercepteurs plus meurtriers."),
  p("nova_attaque", "Cœur de Nova", "unites", { stat: "unitAttack", target: "unit:croiseur_nova" }, "unit", "Croiseurs Nova surpuissants."),
  p("lance_attaque", "Lance focalisée", "unites", { stat: "unitAttack", target: "unit:lance_gravitationnelle" }, "unit", "Lance gravitationnelle plus précise."),
  p("etoile_pv", "Écorce de l'Étoile noire", "unites", { stat: "unitHp", target: "unit:etoile_noire" }, { relic: 1, tech: 0.01, officer: 0.004 }, "Pour la plus grosse unité : valeur prudente."),
  p("atelier_pv", "Coque d'Atelier", "unites", { stat: "unitHp", target: "unit:vaisseau_atelier" }, "unit", "Les Vaisseaux-ateliers survivent aux raids."),
  // 6.14.12 (C3) : une suggestion pour chaque unité (garde de la chaîne de contenu). PV pour les unités qui ne combattent pas,
  // et pour le Traqueur Kesh (son bonus contre les PNJ existe déjà : KESH_PVE_BONUS) ; barème prudent pour les élites.
  p("sonde_pv", "Coque furtive", "unites", { stat: "unitHp", target: "unit:sonde_espionnage" }, "unit", "Les Sondes survivent mieux aux défenses adverses."),
  p("cargo_pv", "Soute blindée", "unites", { stat: "unitHp", target: "unit:cargo" }, "unit", "Les Cargos rentrent plus souvent avec le butin."),
  p("roquette_attaque", "Têtes à fragmentation", "unites", { stat: "unitAttack", target: "unit:roquette" }, "unit", "Les Roquettes frappent plus fort."),
  p("traqueur_pv", "Carapace de traqueur", "unites", { stat: "unitHp", target: "unit:traqueur_kesh" }, "unit", "Traqueurs Kesh plus durables (leur bonus contre les PNJ existe déjà)."),
  p("fantome_attaque", "Frappe fantôme", "unites", { stat: "unitAttack", target: "unit:chasse_fantome" }, "elite", "Unité d'élite : valeur prudente."),
  p("rempart_pv", "Bélier renforcé", "unites", { stat: "unitHp", target: "unit:brise_rempart" }, "elite", "Unité d'élite : valeur prudente."),
  p("lame_attaque", "Fil écarlate", "unites", { stat: "unitAttack", target: "unit:lame_ecarlate" }, "elite", "Unité d'élite : valeur prudente."),
  p("recolteur_pv", "Bennes renforcées", "unites", { stat: "unitHp", target: "unit:recolteur" }, "unit", "Les Récolteurs (classe Industriel) tiennent mieux."),
  p("raid_attaque", "Salve de raid", "unites", { stat: "unitAttack", target: "unit:croiseur_raid" }, "unit", "Croiseurs de raid (classe Seigneur) plus mordants."),
  p("eclaireur_pv", "Coque d'exploration", "unites", { stat: "unitHp", target: "unit:eclaireur_lointain" }, "unit", "Les Éclaireurs (classe Explorateur) reviennent plus souvent."),
  // Classes et catégories.
  p("classe_faible", "Doctrine de l'essaim", "classes", { stat: "unitAttack", target: "class:light" }, "group", "Toutes les unités de classe Faible."),
  p("classe_moyen", "Doctrine de ligne", "classes", { stat: "unitHp", target: "class:medium" }, "group", "Toutes les unités de classe Moyen."),
  p("classe_fort", "Doctrine du marteau", "classes", { stat: "unitAttack", target: "class:heavy" }, "group", "Toutes les unités de classe Fort."),
  p("classe_fort_pv", "Plaques lourdes", "classes", { stat: "unitHp", target: "class:heavy" }, "group", "Unités Fortes plus résistantes."),
  p("defenses_pv", "Fortifications", "classes", { stat: "unitHp", target: "cat:defense" }, "wide", "Toutes les défenses."),
  p("defenses_attaque", "Batteries calibrées", "classes", { stat: "unitAttack", target: "cat:defense" }, "wide", "Toutes les défenses tirent plus fort."),
  p("vaisseaux_pv", "Coques renforcées", "classes", { stat: "unitHp", target: "cat:attack" }, "wide", "Tous les vaisseaux."),
  p("avantage_classe", "Maître tacticien", "classes", { stat: "classEdge" }, "edge", "Avantage de classe plus marqué (Fort > Moyen > Faible > Fort)."),
  p("bouclier", "Générateur auxiliaire", "classes", { stat: "shield" }, "edge", "Bouclier planétaire en plus (défense de la base)."),
  // JcJ.
  p("jcj_attaque", "Duelliste", "jcj", { stat: "unitAttack", scope: "pvp" }, "wide", "Attaque de toutes les unités, seulement contre les joueurs."),
  p("jcj_defenses", "Garde planétaire", "jcj", { stat: "unitHp", target: "cat:defense", scope: "pvp" }, "group", "Défenses plus solides face aux joueurs."),
  p("jcj_avantage", "Lecture du duel", "jcj", { stat: "classEdge", scope: "pvp" }, "edge", "Avantage de classe, contre les joueurs."),
  p("jcj_butin", "Pillard", "jcj", { stat: "loot" }, "wide", "Plus de butin pillé (comme le Corsaire)."),
  p("jcj_abri", "Coffre enterré", "jcj", { stat: "protectedStorage" }, { relic: 0.5, tech: 0.01, officer: 0.004 }, "Plus de stock à l'abri du pillage."),
  // PNJ et seigneurs.
  p("pnj_attaque", "Chasseur de primes", "pnj", { stat: "unitAttack", scope: "pve" }, "wide", "Attaque contre pirates, primes, expéditions, boss et seigneurs."),
  p("pnj_defenses", "Rempart anti-pirates", "pnj", { stat: "unitHp", target: "cat:defense", scope: "pve" }, "group", "Défenses plus solides face aux raids PNJ."),
  p("seigneur_attaque", "Tueur de seigneurs", "pnj", { stat: "unitAttack", scope: "warlord" }, "group", "Attaque contre les seigneurs de guerre seulement."),
  p("seigneur_avantage", "Lire le seigneur", "pnj", { stat: "classEdge", scope: "warlord" }, "edge", "Avantage de classe contre les seigneurs."),
  p("boss", "Brise-colosse", "pnj", { stat: "bossDamage" }, "wide", "Dégâts contre les boss (comme le Chasseur)."),
  // Chantier.
  p("chantier_faible", "Chaîne légère", "chantier", { stat: "unitBuildTime", target: "class:light" }, "group", "Unités Faibles plus vite construites."),
  p("chantier_fort", "Cales sèches", "chantier", { stat: "unitBuildTime", target: "class:heavy" }, "group", "Unités Fortes plus vite construites."),
  p("chantier_defenses", "Préfabriqués", "chantier", { stat: "unitBuildTime", target: "cat:defense" }, "group", "Défenses plus vite construites."),
  p("cout_fort", "Forge des lourds", "chantier", { stat: "unitCost", target: "class:heavy" }, { relic: 1, tech: 0.01, officer: 0.004 }, "Unités Fortes moins chères."),
  p("cout_vaisseaux", "Économie de guerre", "chantier", { stat: "unitCost", target: "cat:attack" }, { relic: 0.5, tech: 0.005, officer: 0.002 }, "Tous les vaisseaux un peu moins chers."),
  p("cout_sentinelle", "Sentinelles en série", "chantier", { stat: "unitCost", target: "unit:sentinelle" }, { relic: 1.5, tech: 0.02, officer: 0.006 }, "Sentinelles moins chères."),
  p("cout_drone", "Drones recyclés", "chantier", { stat: "unitCost", target: "unit:drone_recuperateur" }, { relic: 1.5, tech: 0.02, officer: 0.006 }, "Drones récupérateurs moins chers."),
  p("hangar_attaque", "Hangar en extension", "chantier", { stat: "hangarCapacity", target: "attack" }, "wide", "Plus de places au hangar d'attaque."),
  p("hangar_defense", "Casemates", "chantier", { stat: "hangarCapacity", target: "defense" }, "wide", "Plus de places au hangar de défense."),
  p("cale_postes", "Berceaux repliables", "chantier", { stat: "dockCapacity" }, "wide", "Plus de postes à la Cale sèche."),
  // Économie et Atelier.
  p("atelier_cadence", "Soudeurs de nuit", "economie", { stat: "repairSpeed" }, { relic: 2, tech: 0.05, officer: 0.02 }, "+ % de PV/s à l'Atelier de réparation."),
  p("reparation", "Nanites de coque", "economie", { stat: "repair" }, "wide", "Plus de vaisseaux réparés après un combat."),
  p("ferraille", "Broyeurs", "economie", { stat: "production", target: "scrap" }, "wide", "Production de ferraille."),
  p("energie", "Réacteurs", "economie", { stat: "production", target: "energy" }, "wide", "Production d'énergie."),
  p("colonies", "Intendance coloniale", "economie", { stat: "productionAll", scope: "colonies" }, "wide", "Production des colonies seulement."),
  p("mere_entrepot", "Silos de la capitale", "economie", { stat: "storage", scope: "home" }, "group", "Entrepôts de la planète mère."),
  p("marche", "Courtier", "economie", { stat: "tradeTax" }, "wide", "Taxe du marché et des cadeaux réduite."),
  p("vol", "Couloirs de vol", "economie", { stat: "fleetSpeed" }, "wide", "Temps de vol réduit."),
  p("soute", "Soutes pliées", "economie", { stat: "cargo" }, "wide", "Plus de soute (butin, transports)."),
  p("entretien", "Intendance de flotte", "economie", { stat: "fleetUpkeep" }, "wide", "Entretien de la flotte réduit."),
  // Renseignement.
  p("espion", "Lentilles profondes", "renseignement", { stat: "spyLevel" }, { relic: 10, tech: 0.2, officer: 0.1 }, "Niveau d'espionnage en plus."),
  p("detection", "Réseau d'écoute", "renseignement", { stat: "detection" }, "wide", "Détecte mieux les sondes adverses."),
  p("contre", "Brouilleurs", "renseignement", { stat: "counterSpy" }, { relic: 20, tech: 0.5, officer: 0.1 }, "Points de contre-espionnage."),
  // 6.14.69 (É30-1d) : lune. Relique × 2 : +20 % de portée en épique ; × 1,5 : −15 % de recharge en épique (Lentille de Séléné, Clé du seuil).
  p("phalange_portee", "Lentille lunaire", "renseignement", { stat: "phalanxRange" }, { relic: 2, tech: 0.04, officer: 0.01 }, "+20 % de portée de phalange (radar d'alliance, balayage)."),
  p("porte_recharge", "Seuil apprivoisé", "renseignement", { stat: "jumpGateCooldown" }, { relic: 1.5, tech: 0.03, officer: 0.0075 }, "−15 % de recharge de la porte de saut."),
];

export function findEffectPreset(id: string): EffectPreset | undefined {
  return EFFECT_PRESETS.find((x) => x.id === id);
}
