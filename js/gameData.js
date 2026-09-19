// =======================================
// Données globales du joueur
// =======================================

const GameData = {

    // XP du joueur (modifie cette valeur pour tester les rangs)

    
    // ============================
    // UNITÉS
    // ============================
    units: {
    drone_recuperateur: { level: 0, count: 0 },
    fregate: { level: 0, count: 0 },
    sentinelle: { level: 0, count: 0 },
    cargo: { level: 0, count: 0 },
    chasseur: { level: 0, count: 0 },
    intercepteur: { level: 0, count: 0 },
    etoile_noire: { level: 0, count: 0 },
    roquette: { level: 0, count: 0 },
    canon_impulsion: { level: 0, count: 0 },
    canon_plasma: { level: 0, count: 0 },
    batterie_aa: { level: 0, count: 0 }
},

    // ============================
    // BÂTIMENTS
    // ============================
    buildings: {
        extracteur_ferraille: { level: 1 },
        reacteur_instable: { level: 1, unlocked: false },
        extracteur_nanocomposants: { level: 1, unlocked: false },
        archives_fracturees: { level: 1, unlocked: false },
        atelier_reparation: { level: 1, unlocked: false },
        hangar_attaque: { level: 1, unlocked: false },
        hangar_defense: { level: 1, unlocked: false }
    },

    // ============================
    // RESSOURCES
    // ============================
    resources: {
        scrap: 0,
        energy: 0,
        nano: 0,
        signal: 0,
        tools: 0,
        robots: 0,
        modules: 0,
        knowledge: 0
    }
};

/* ============================================================
   FONCTIONS MANQUANTES POUR LA PAGE UNITÉS
   ============================================================ */

// Total d’unités possédées
function getTotalUnits() {
    let total = 0;

    for (const id in GameData.units) {
        const u = GameData.units[id];
        if (u.count) total += u.count;
    }

    return total;
}

// Capacité maximale (basée sur les hangars)
function getUnitCapacity() {
    let base = 10;
    let bonus = 0;

    if (GameData.buildings.hangar_attaque) {
        bonus += GameData.buildings.hangar_attaque.level * 50;
    }

    if (GameData.buildings.hangar_defense) {
        bonus += GameData.buildings.hangar_defense.level * 50;
    }

    return base + bonus;
}


// Mise à jour du HUD global (pour plus tard)
function updateGlobalUnitHUD() {
    // Tu pourras afficher le total dans le HUD ici
    // Pour l’instant, on laisse vide pour éviter les erreurs
}
