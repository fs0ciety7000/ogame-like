// ===============================
// INITIALISATION DU PROFIL
// ===============================

function initProfil() {
    updateRankDisplay();
    updateBuildingBars();
    updateBuildingsTotal();
    updateBuildingNames();
    updateProfileUnits();
}

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
// DÉTERMINER LE RANG
// ===============================

function getRankFromXP(xpValue) {
    let index = 0;
    for (let i = 0; i < rankThresholds.length; i++) {
        if (xpValue >= rankThresholds[i]) index = i;
    }
    return index;
}

// ===============================
// AFFICHAGE DU RANG
// ===============================

function updateRankDisplay() {
    const xp = GameData.xp || 0;
    const rankIndex = getRankFromXP(xp);

    document.getElementById("rank-current").textContent = rankNames[rankIndex];
    document.getElementById("rank-prev").textContent =
        rankIndex > 0 ? "Rang précédent : " + rankNames[rankIndex - 1] : "Aucun rang précédent";
    document.getElementById("rank-next").textContent =
        rankIndex < rankNames.length - 1 ? "Rang suivant : " + rankNames[rankIndex + 1] : "Rang maximum atteint";

    document.getElementById("rank-icon").src = "assets/ranks/" + rankIcons[rankIndex];

    // Affichage des points d'expérience
    document.getElementById("xp-points").textContent = xp + " XP";

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
// UNITÉS
// ===============================

function updateProfileUnits() {
    const U = GameData.units;

    const units = [
        { id: "drone_recuperateur", text: "drone-level", bar: "drone-fill" },
        { id: "fregate", text: "frigate-level", bar: "frigate-fill" },
        { id: "sentinelle", text: "sentinel-level", bar: "sentinel-fill" },
        { id: "cargo", text: "cargo-level", bar: "cargo-fill" },
        { id: "chasseur", text: "chasseur-level", bar: "chasseur-fill" },
        { id: "etoile_noire", text: "blackstar-level", bar: "blackstar-fill" },
        { id: "roquette", text: "rocket-level", bar: "rocket-fill" },
        { id: "canon_impulsion", text: "pulse-cannon-level", bar: "pulse-cannon-fill" },
        { id: "canon_plasma", text: "plasma-cannon-level", bar: "plasma-cannon-fill" },
        { id: "batterie_aa", text: "aa-battery-level", bar: "aa-battery-fill" },
        { id: "intercepteur", text: "interceptor-level", bar: "interceptor-fill" }
    ];

    let total = 0;

    units.forEach(u => {
        const level = U[u.id]?.level ?? 0;
        total += level;

        document.getElementById(u.text).textContent = `${level} / 10`;
        document.getElementById(u.bar).style.width = `${(level / 10) * 100}%`;
    });

    const percent = Math.floor((total / (units.length * 10)) * 100);
    document.getElementById("troops-total-text").textContent = percent + "%";
    document.getElementById("troops-total-fill").style.width = percent + "%";
}

// ===============================
// BÂTIMENTS
// ===============================

// Bâtiments qui doivent être débloqués avant de compter (mêmes que sur la page bâtiments)
const LOCKABLE_BUILDINGS_PROFIL = [
    "reacteur_instable",
    "extracteur_nanocomposants",
    "archives_fracturees",
    "hangar_attaque",
    "hangar_defense"
];

function getDisplayBuildingLevel(id) {
    const bData = GameData.buildings[id];
    if (!bData) return 0;

    if (LOCKABLE_BUILDINGS_PROFIL.includes(id) && bData.unlocked !== true) {
        return 0;
    }

    return bData.level;
}

function updateBuildingBars() {
    const buildingList = [
        { id: "extracteur_ferraille", text: "bat1-level", bar: "bat1-fill" },
        { id: "reacteur_instable", text: "bat2-level", bar: "bat2-fill" },
        { id: "extracteur_nanocomposants", text: "bat3-level", bar: "bat3-fill" },
        { id: "archives_fracturees", text: "bat4-level", bar: "bat4-fill" },
        { id: "atelier_reparation", text: "bat5-level", bar: "bat5-fill" },
        { id: "hangar_attaque", text: "bat6-level", bar: "bat6-fill" },
        { id: "hangar_defense", text: "bat7-level", bar: "bat7-fill" }
    ];

    buildingList.forEach(b => {
        const level = getDisplayBuildingLevel(b.id);
        const percent = (level / 10) * 100;

        document.getElementById(b.text).textContent = `${level} / 10`;
        document.getElementById(b.bar).style.width = percent + "%";
    });
}

function updateBuildingsTotal() {
    const ids = [
        "extracteur_ferraille",
        "reacteur_instable",
        "extracteur_nanocomposants",
        "archives_fracturees",
        "atelier_reparation",
        "hangar_attaque",
        "hangar_defense"
    ];

    let total = 0;
    ids.forEach(id => total += getDisplayBuildingLevel(id));

    const percent = Math.floor((total / (ids.length * 10)) * 100);

    document.getElementById("buildings-total-text").textContent = percent + "%";
    document.getElementById("buildings-total-fill").style.width = percent + "%";
}

function updateBuildingNames() {
    const buildingList = [
        { id: "extracteur_ferraille", nameId: "bat1-name" },
        { id: "reacteur_instable", nameId: "bat2-name" },
        { id: "extracteur_nanocomposants", nameId: "bat3-name" },
        { id: "archives_fracturees", nameId: "bat4-name" },
        { id: "atelier_reparation", nameId: "bat5-name" },
        { id: "hangar_attaque", nameId: "bat6-name" },
        { id: "hangar_defense", nameId: "bat7-name" }
    ];

    buildingList.forEach(b => {
        const data = buildings.find(x => x.id === b.id);
        if (data) {
            document.getElementById(b.nameId).textContent = data.name;
        }
    });
}