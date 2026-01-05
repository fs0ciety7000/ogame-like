// ===============================
// DONNÉES GLOBALES DU JEU
// ===============================

// Valeurs par défaut
let GameData = {
    resources: {
        scrap: 0,
        energy: 0,
        nano: 0,
        data: 0
    },

    // XP du joueur (utilisé pour le rang dans la page Profil)
    xp: 0,

    // Niveaux des bâtiments
    buildings: {
        extracteur_ferraille: { level: 1 },
        reacteur_instable: { level: 1 },
        extracteur_nanocomposants: { level: 1 },
        archives_fracturees: { level: 1 },
        atelier_reparation: { level: 1 }
    },

    // Niveaux + quantités des unités
    units: {
        hangar:              { level: 1, count: 0 },
        drone_recuperateur:  { level: 1, count: 0 },
        fregate:             { level: 1, count: 0 },
        sentinelle:          { level: 1, count: 0 },
        cargo:               { level: 1, count: 0 },
        chasseur:            { level: 1, count: 0 }
    }
};

// ===============================
// DÉFINITION DES BÂTIMENTS
// ===============================

const buildings = [
    {
        id: "extracteur_ferraille",
        name: "Extracteur de ferraille",
        maxLevel: 10,
        description: "Récupère des matériaux bruts dans les débris environnants.",
        bonus: "+5% récupération de ferraille",
        cost: { scrap: 200, energy: 50 },
        time: "30s",
        imageBase: "assets/batiments/extracteur_ferraille",
        production: { resource: "scrap", base: 5 }
    },
    {
        id: "reacteur_instable",
        name: "Réacteur instable",
        maxLevel: 10,
        description: "Fournit une énergie instable mais puissante.",
        bonus: "+8% production énergétique",
        cost: { scrap: 300, energy: 120 },
        time: "45s",
        imageBase: "assets/batiments/reacteur_instable",
        production: { resource: "energy", base: 3 }
    },
    {
        id: "extracteur_nanocomposants",
        name: "Extracteur de nano‑composants",
        maxLevel: 10,
        description: "Permet de récupérer des nano‑composants rares.",
        bonus: "+4% extraction avancée",
        cost: { scrap: 250, energy: 200 },
        time: "60s",
        imageBase: "assets/batiments/extracteur_nanocomposants",
        production: { resource: "nano", base: 1 }
    },
    {
        id: "archives_fracturees",
        name: "Centre d’archives fracturées",
        maxLevel: 10,
        description: "Contient des données anciennes et instables.",
        bonus: "+6% vitesse de recherche",
        cost: { scrap: 150, energy: 300 },
        time: "40s",
        imageBase: "assets/batiments/archives_fracturees",
        production: { resource: "data", base: 2 }
    },
    {
        id: "atelier_reparation",
        name: "Atelier de réparation",
        maxLevel: 10,
        description: "Répare les unités endommagées.",
        bonus: "+10% vitesse de réparation",
        cost: { scrap: 180, energy: 80 },
        time: "35s",
        imageBase: "assets/batiments/atelier_reparation"
        // pas de production
    }
];

// ===============================
// CHARGEMENT DE LA SAUVEGARDE
// ===============================

const saved = localStorage.getItem("CosmicEmpiresSave");
if (saved) {
    try {
        const parsed = JSON.parse(saved);
        // On fusionne prudemment pour éviter de perdre des clés
        GameData = {
            ...GameData,
            ...parsed,
            resources: { ...GameData.resources, ...(parsed.resources || {}) },
            buildings: { ...GameData.buildings, ...(parsed.buildings || {}) },
            units:     { ...GameData.units,     ...(parsed.units || {}) }
        };
    } catch (e) {
        console.warn("Sauvegarde corrompue, utilisation des valeurs par défaut.", e);
    }
}

// Sécurité : si l'XP n'existe pas (anciennes sauvegardes) → on l'ajoute
if (GameData.xp === undefined) {
    GameData.xp = 0;
}

// ===============================
// CORRECTION DES BÂTIMENTS
// ===============================

buildings.forEach(b => {
    if (!GameData.buildings[b.id]) {
        GameData.buildings[b.id] = { level: 1 };
    }

    const current = GameData.buildings[b.id].level;
    if (current > b.maxLevel) {
        GameData.buildings[b.id].level = b.maxLevel;
    }
});

// ===============================
// CORRECTION / INITIALISATION DES UNITÉS
// ===============================

const defaultUnits = [
    "hangar",
    "drone_recuperateur",
    "fregate",
    "sentinelle",
    "cargo",
    "chasseur"
];

if (!GameData.units) {
    GameData.units = {};
}

defaultUnits.forEach(id => {
    if (!GameData.units[id]) {
        GameData.units[id] = { level: 1, count: 0 };
    } else {
        if (GameData.units[id].level === undefined) {
            GameData.units[id].level = 1;
        }
        if (GameData.units[id].count === undefined) {
            GameData.units[id].count = 0;
        }
    }
});

// Sécurité supplémentaire : le hangar doit toujours exister et avoir au moins le niveau 1
if (!GameData.units.hangar) {
    GameData.units.hangar = { level: 1, count: 0 };
} else {
    if (!GameData.units.hangar.level || GameData.units.hangar.level < 1) {
        GameData.units.hangar.level = 1;
    }
    if (GameData.units.hangar.count === undefined) {
        GameData.units.hangar.count = 0;
    }
}

// On sauvegarde immédiatement l’état corrigé (utile si ancienne sauvegarde bancale)
localStorage.setItem("CosmicEmpiresSave", JSON.stringify(GameData));

// ===============================
// SAUVEGARDE
// ===============================

function saveGame() {
    localStorage.setItem("CosmicEmpiresSave", JSON.stringify(GameData));
}

// ===============================
// MISE À JOUR DU HUD
// ===============================

function updateHUD() {
    const ids = ["scrap", "energy", "nano", "data"];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = GameData.resources[id];
    });

    const xpEl = document.getElementById("xp-points");
    if (xpEl) xpEl.textContent = GameData.xp + " XP";
}

function updateInventory() {
    const invScrap  = document.getElementById("invScrap");
    const invEnergy = document.getElementById("invEnergy");
    const invNano   = document.getElementById("invNano");
    const invData   = document.getElementById("invData");

    if (invScrap)  invScrap.textContent  = GameData.resources.scrap;
    if (invEnergy) invEnergy.textContent = GameData.resources.energy;
    if (invNano)   invNano.textContent   = GameData.resources.nano;
    if (invData)   invData.textContent   = GameData.resources.data;
}

// ===============================
// AJOUT DE RESSOURCES
// ===============================

function addResource(type, amount) {
    if (GameData.resources[type] !== undefined) {
        GameData.resources[type] += amount;
        updateHUD();
        updateInventory();
        saveGame();
    }
}

// ===============================
// CONSOMMATION DE RESSOURCES
// ===============================

function spendResource(type, amount) {
    if (GameData.resources[type] >= amount) {
        GameData.resources[type] -= amount;
        updateHUD();
        updateInventory();
        saveGame();
        return true;
    }
    return false;
}

// ===============================
// CHARGEMENT INITIAL DU HUD
// ===============================

window.addEventListener("load", () => {
    updateHUD();
    updateInventory();
});

// ===============================
// PRODUCTION AUTOMATIQUE GLOBALE
// ===============================

setInterval(() => {
    buildings.forEach(b => {
        const levelData = GameData.buildings[b.id];
        if (!levelData) return;

        const level = levelData.level;

        if (level > 0 && b.production) {
            const amount = b.production.base * level;
            addResource(b.production.resource, amount);
        }
    });
}, 1000);

// ===============================
// MODE TEST : FORCER UN RANG
// ===============================

window.addEventListener("load", () => {
    // GameData.xp = 52000;
    if (typeof updateRankDisplay === "function") {
        updateRankDisplay();
    }
});
