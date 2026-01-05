// ===============================
// CONFIGURATION DES RANGS
// ===============================

const rankNames = [
    "Non-classé", "Fer III", "Fer II", "Fer I",
    "Bronze III", "Bronze II", "Bronze I",
    "Argent III", "Argent II", "Argent I",
    "Or III", "Or II", "Or I",
    "Platine III", "Platine II", "Platine I",
    "Émeraude", "Diamant", "Master",
    "Challenger", "Elite"
];

const rankThresholds = [
    0, 100, 300, 600, 1000, 1500, 2000,
    2600, 3300, 4000, 5000, 6500, 8000,
    10000, 13000, 16000, 20000, 26000,
    33000, 42000, 52000
];

const rankIcons = [
    "non_classe.png", "fer3.png", "fer2.png", "fer1.png",
    "bronze3.png", "bronze2.png", "bronze1.png",
    "argent3.png", "argent2.png", "argent1.png",
    "or3.png", "or2.png", "or1.png",
    "platine3.png", "platine2.png", "platine1.png",
    "emeraude.png", "diamant.png", "master.png",
    "challenger.png", "elite.png"
];

// ===============================
// DÉTERMINER LE RANG À PARTIR DE L'XP
// ===============================

function getRankFromXP(xpValue) {
    let index = 0;
    for (let i = 0; i < rankThresholds.length; i++) {
        if (xpValue >= rankThresholds[i]) index = i;
    }
    return index;
}

// ===============================
// AFFICHAGE DU RANG (PIXEL PERFECT)
// ===============================

function updateRankDisplay() {
    const xp = GameData.xp || 0;
    const rankIndex = getRankFromXP(xp);

    const prev = document.getElementById("rank-prev");
    const current = document.getElementById("rank-current");
    const next = document.getElementById("rank-next");

    // Rang actuel
    current.textContent = rankNames[rankIndex];

    // Rang précédent
    if (rankIndex > 0) {
        prev.textContent = "Rang précédent : " + rankNames[rankIndex - 1];
    } else {
        prev.textContent = "Aucun rang précédent";
    }

    // Rang suivant
    if (rankIndex < rankNames.length - 1) {
        next.textContent = "Rang suivant : " + rankNames[rankIndex + 1];
    } else {
        next.textContent = "Rang maximum atteint";
    }

    // Mise à jour de l'icône
    const icon = document.getElementById("rank-icon");
    icon.src = "assets/ranks/" + rankIcons[rankIndex];

    // Mise à jour de la progression
    updateRankProgress(rankIndex, xp);
}


// ===============================
// PROGRESSION DU RANG
// ===============================

function updateRankProgress(rankIndex, xp) {
    const minXP = rankThresholds[rankIndex];
    const maxXP = rankThresholds[rankIndex + 1] ?? minXP;

    let percent = 100;

    if (maxXP > minXP) {
        percent = Math.floor(((xp - minXP) / (maxXP - minXP)) * 100);
    }

    document.getElementById("rank-progress-text").textContent = percent + "%";
    document.getElementById("rank-progress").style.width = percent + "%";
}

// ===============================
// MISE À JOUR DES UNITÉS (TOUTES LES UNITÉS DU JEU)
// ===============================

function updateProfileUnits() {

    const U = GameData.units;

    // --- DRONE ---
    const droneLevel = U.drone_recuperateur?.level ?? 1;
    document.getElementById("drone-level").textContent = `${droneLevel} / 10`;
    document.getElementById("drone-fill").style.width = `${(droneLevel / 10) * 100}%`;

    // --- FRÉGATE ---
    const frigateLevel = U.fregate?.level ?? 1;
    document.getElementById("frigate-level").textContent = `${frigateLevel} / 10`;
    document.getElementById("frigate-fill").style.width = `${(frigateLevel / 10) * 100}%`;

    // --- SENTINELLE ---
    const sentinelLevel = U.sentinelle?.level ?? 1;
    document.getElementById("sentinel-level").textContent = `${sentinelLevel} / 10`;
    document.getElementById("sentinel-fill").style.width = `${(sentinelLevel / 10) * 100}%`;

    // --- CARGO ---
    const cargoLevel = U.cargo?.level ?? 1;
    document.getElementById("cargo-level").textContent = `${cargoLevel} / 10`;
    document.getElementById("cargo-fill").style.width = `${(cargoLevel / 10) * 100}%`;

    // --- CHASSEUR ---
    const chasseurLevel = U.chasseur?.level ?? 1;
    document.getElementById("chasseur-level").textContent = `${chasseurLevel} / 10`;
    document.getElementById("chasseur-fill").style.width = `${(chasseurLevel / 10) * 100}%`;

    // --- HANGAR ---
    const hangarLevel = U.hangar?.level ?? 1;
    document.getElementById("hangar-level").textContent = `${hangarLevel} / 10`;
    document.getElementById("hangar-fill").style.width = `${(hangarLevel / 10) * 100}%`;

    // ===============================
    // TOTAL DES TROUPES = PROGRESSION GLOBALE DES NIVEAUX
    // ===============================

    const levels = [
        droneLevel,
        frigateLevel,
        sentinelLevel,
        cargoLevel,
        chasseurLevel,
        hangarLevel
    ];

    const sumLevels = levels.reduce((s, v) => s + v, 0);
    const maxTotal = levels.length * 10; // 6 unités * 10 niveaux

    const percent = Math.floor((sumLevels / maxTotal) * 100);

    document.getElementById("troops-total-text").textContent = `${percent}%`;
    document.getElementById("troops-total-fill").style.width = `${percent}%`;
}



// ===============================
// CHARGEMENT
// ===============================

window.addEventListener("load", () => {
    updateRankDisplay();
    updateBuildingBars();
    updateBuildingsTotal();
    updateBuildingNames();
    updateProfileUnits(); // 🔥 AJOUT ICI
});




function updateBuildingBars() {
    const buildingList = [
        { id: "extracteur_ferraille", text: "bat1-level", bar: "bat1-fill" },
        { id: "reacteur_instable", text: "bat2-level", bar: "bat2-fill" },
        { id: "extracteur_nanocomposants", text: "bat3-level", bar: "bat3-fill" },
        { id: "archives_fracturees", text: "bat4-level", bar: "bat4-fill" },
        { id: "atelier_reparation", text: "bat5-level", bar: "bat5-fill" }
    ];

    buildingList.forEach(b => {
        const level = GameData.buildings[b.id].level;
        const max = 10;

        // Mise à jour du texte
        document.getElementById(b.text).textContent = level + " / " + max;

        // Mise à jour de la barre
        const percent = (level / max) * 100;
        document.getElementById(b.bar).style.width = percent + "%";
    });
}

function updateBuildingsTotal() {
    const buildingIds = [
        "extracteur_ferraille",
        "reacteur_instable",
        "extracteur_nanocomposants",
        "archives_fracturees",
        "atelier_reparation"
    ];

    let totalLevel = 0;
    const maxTotal = buildingIds.length * 10; // 5 bâtiments * 10 niveaux

    buildingIds.forEach(id => {
        totalLevel += GameData.buildings[id].level;
    });

    const percent = Math.floor((totalLevel / maxTotal) * 100);

    // Mise à jour du texte
    document.getElementById("buildings-total-text").textContent = percent + "%";

    // Mise à jour de la barre
    document.getElementById("buildings-total-fill").style.width = percent + "%";
}

function updateBuildingNames() {
    const buildingList = [
        { id: "extracteur_ferraille", nameId: "bat1-name" },
        { id: "reacteur_instable", nameId: "bat2-name" },
        { id: "extracteur_nanocomposants", nameId: "bat3-name" },
        { id: "archives_fracturees", nameId: "bat4-name" },
        { id: "atelier_reparation", nameId: "bat5-name" }
    ];

    buildingList.forEach((b, index) => {
        const buildingData = buildings.find(x => x.id === b.id);
        if (buildingData) {
            document.getElementById(b.nameId).textContent = buildingData.name;
        }
    });
}

