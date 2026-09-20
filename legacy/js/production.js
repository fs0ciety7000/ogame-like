/* =====================================================
   PRODUCTION DES RESSOURCES PAR LES BÂTIMENTS
===================================================== */

// Production PAR SECONDE de l'extracteur de ferraille (niv 1 → 10)
const scrapProduction = [
    2, 4, 7, 13, 23, 42, 75, 135, 259, 500
];

// Production PAR SECONDE du réacteur instable (niv 1 → 10)
const energyProduction = [
    2, 4, 7, 13, 23, 42, 75, 135, 259, 500
];

// Production PAR SECONDE des nanocomposants (niv 1 → 10)
const nanoProduction = [
    2, 4, 7, 13, 23, 42, 75, 135, 259, 500
];

// Production PAR SECONDE des données anciennes (niv 1 → 10)
const dataProduction = [
    2, 4, 7, 13, 23, 42, 75, 135, 259, 500
];

// Bâtiments qui doivent être débloqués avant de produire
const LOCKABLE_BUILDINGS = ["reacteur_instable", "extracteur_nanocomposants", "archives_fracturees"];

// Tick toutes les secondes
setInterval(productionTick, 1000);

/* =====================================================
   Fonction principale de production
===================================================== */

function productionTick() {
    let save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    if (!save.buildings) return;

    // Bonus labo (tech3) : recalculé à partir du niveau actuel de la tech,
    // pas d'une valeur figée sauvegardée (qui deviendrait périmée si le
    // taux par niveau change un jour).
    const tech3Level = save.techLevels?.tech3 || 0;
    const productionBonus = tech3Level * 0.10;

    // Initialisation des ressources si absentes
    save.scrap = save.scrap || 0;
    save.energy = save.energy || 0;
    save.nano = save.nano || 0;
    save.data = save.data || 0;

    // Buffer pour accumuler les décimales de production sans les perdre
    save.scrapBuffer = save.scrapBuffer || 0;

    /* =====================================================
       Parcours de tous les bâtiments définis dans buildings.js
    ====================================================== */

    buildings.forEach(building => {
        const bData = save.buildings[building.id] || {};
        const level = bData.level || 0;

        // Pour les bâtiments verrouillables, il faut unlocked === true explicitement
        let unlocked = true;
        if (LOCKABLE_BUILDINGS.includes(building.id)) {
            unlocked = bData.unlocked === true;
        }

        if (!building.production || level <= 0 || !unlocked) return;

        // Extracteur de ferraille
        if (building.id === "extracteur_ferraille") {
            const baseRate = scrapProduction[level - 1] || 0;
            save.scrap += Math.floor(baseRate * (1 + productionBonus));
            return;
        }

        // Réacteur instable
        if (building.id === "reacteur_instable") {
            const baseRate = energyProduction[level - 1] || 0;
            save.energy += Math.floor(baseRate * (1 + productionBonus));
            return;
        }

        // Extracteur de nanocomposants
        if (building.id === "extracteur_nanocomposants") {
            const baseRate = nanoProduction[level - 1] || 0;
            save.nano += Math.floor(baseRate * (1 + productionBonus));
            return;
        }

        // Archives fracturées
        if (building.id === "archives_fracturees") {
            const baseRate = dataProduction[level - 1] || 0;
            save.data += Math.floor(baseRate * (1 + productionBonus));
            return;
        }
    });

    localStorage.setItem("cosmicSave", JSON.stringify(save));

    updateHUD();
    updateRessourcesPage();
}

/* =====================================================
   Mise à jour du HUD
===================================================== */

function updateHUD() {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};

    const map = {
        "hud-scrap": "scrap",
        "hud-energy": "energy",
        "hud-nano": "nano",
        "hud-data": "data",
        "hud-tools": "reinforcedSteel",
        "hud-drones": "cyberModule",
        "hud-parts": "syntheticNanites",
        "hud-intel": "aiFragment"
    };

    for (const id in map) {
        const el = document.getElementById(id);
        if (el) el.textContent = save[map[id]] ?? 0;
    }
}

/* =====================================================
   Mise à jour de la page Ressources
===================================================== */

function updateRessourcesPage() {
    const page = document.getElementById("ressources");
    if (!page || page.style.display === "none") return;

    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    const values = document.querySelectorAll(".item-value");

    resourceList.forEach((res, i) => {
        if (values[i]) {
            values[i].textContent = save[res.id] ?? 0;
        }
    });
}