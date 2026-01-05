// ===============================
// DONNÉES GLOBALES DU JEU (gameData.js)
// ===============================

let GameData = {
    // --- DEV MODE ---
    devMultiplier: 1, 
    // ----------------

    resources: { scrap: 0, energy: 0, nano: 0, data: 0 },
    xp: 0,
    buildings: {
        extracteur_ferraille: { level: 1 },
        reacteur_instable: { level: 1 },
        extracteur_nanocomposants: { level: 1 },
        archives_fracturees: { level: 1 },
        atelier_reparation: { level: 1 }
    },
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
// J'ai ajouté "imageBase" ici 👇
const buildings = [
    { 
        id: "extracteur_ferraille", 
        name: "Extracteur de ferraille", 
        maxLevel: 10, 
        description: "Récupère des matériaux bruts dans les débris environnants.",
        cost: { scrap: 200, energy: 50 }, 
        production: { resource: "scrap", base: 5 },
        imageBase: "assets/batiments/extracteur_ferraille" 
    },
    { 
        id: "reacteur_instable", 
        name: "Réacteur instable", 
        maxLevel: 10,
         description: "Fournit une énergie instable mais puissante.", 
        cost: { scrap: 300, energy: 120 }, 
        production: { resource: "energy", base: 3 },
        imageBase: "assets/batiments/reacteur_instable"
    },
    { 
        id: "extracteur_nanocomposants", 
        name: "Extracteur de nano", 
        maxLevel: 10, 
         description: "Permet de récupérer des nano‑composants rares.",
        cost: { scrap: 250, energy: 200 }, 
        production: { resource: "nano", base: 1 },
        imageBase: "assets/batiments/extracteur_nanocomposants"
    },
    { 
        id: "archives_fracturees", 
        name: "Archives fracturées", 
        maxLevel: 10, 
        description: "Contient des données anciennes et instables.",
        cost: { scrap: 150, energy: 300 }, 
        production: { resource: "data", base: 2 },
        imageBase: "assets/batiments/archives_fracturees"
    },
    { 
        id: "atelier_reparation", 
        name: "Atelier de réparation", 
        maxLevel: 10, 
         description: "Répare les unités endommagées.",
        cost: { scrap: 180, energy: 80 },
        imageBase: "assets/batiments/atelier"
        // Pas de production
    }
];

// ===============================
// CHARGEMENT & INIT
// ===============================
const saved = localStorage.getItem("CosmicEmpiresSave");
if (saved) {
    try {
        const parsed = JSON.parse(saved);
        GameData = { 
            ...GameData, 
            ...parsed, 
            devMultiplier: parsed.devMultiplier || 1,
            resources: { ...GameData.resources, ...(parsed.resources || {}) }, 
            buildings: { ...GameData.buildings, ...(parsed.buildings || {}) }, 
            units: { ...GameData.units, ...(parsed.units || {}) } 
        };
    } catch (e) { console.warn("Sauvegarde corrompue", e); }
}

// Init Hangar
if (!GameData.units.hangar) GameData.units.hangar = { level: 1, count: 0 };
if ((GameData.units.hangar.level || 0) < 1) GameData.units.hangar.level = 1;

function saveGame() {
    localStorage.setItem("CosmicEmpiresSave", JSON.stringify(GameData));
}

// ===============================
// MISE À JOUR DU HUD (Ressources)
// ===============================
function updateHUD() {
    // Si layout.js est présent, il s'en occupe via updateGlobalHUD s'il contient les IDs
    // Sinon on met à jour manuellement si les IDs existent sur la page
    const ids = ["scrap", "energy", "nano", "data"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = Math.floor(GameData.resources[id]);
    });
    
    if (typeof updateGlobalUnitHUD === "function") {
        updateGlobalUnitHUD();
    }
}

function addResource(type, amount) {
    if (GameData.resources[type] !== undefined) {
        GameData.resources[type] += amount;
        updateHUD();
        saveGame();
    }
}

function spendResource(type, amount) {
    if (GameData.resources[type] >= amount) {
        GameData.resources[type] -= amount;
        updateHUD();
        saveGame();
        return true;
    }
    return false;
}

// ===============================
// BOUCLE DE JEU
// ===============================
setInterval(() => {
    const multiplier = GameData.devMultiplier || 1;
    buildings.forEach(b => {
        const levelData = GameData.buildings[b.id];
        if (levelData && levelData.level > 0 && b.production) {
            const productionAmount = (b.production.base * levelData.level) * multiplier;
            addResource(b.production.resource, productionAmount);
        }
    });
}, 1000);

window.addEventListener("load", updateHUD);