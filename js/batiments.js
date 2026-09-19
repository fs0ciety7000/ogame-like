// =======================================
// COÛTS DE DÉBLOCAGE
// =======================================

const BUILDING_UNLOCK_COST = {
    reacteur_instable: { resource: "scrap", amount: 500, label: "Ferraille" },
    extracteur_nanocomposants: { resource: "energy", amount: 500, label: "Énergie" },
    archives_fracturees: { resource: "nano", amount: 500, label: "Nanocomposants" },
    atelier_reparation: {
        multi: true,
        resources: [
            { resource: "reinforcedSteel", amount: 20, label: "Acier renforcé" },
            { resource: "cyberModule", amount: 20, label: "Module cybernétique" },
            { resource: "syntheticNanites", amount: 20, label: "Nanites synthétiques" },
            { resource: "aiFragment", amount: 20, label: "Fragment d'IA" }
        ]
    }
};

// =======================================
// BÂTIMENTS À COÛT/TEMPS ÉCHELONNÉS (ferraille/énergie, 10 min/palier)
// =======================================

const SCALED_COST_BUILDINGS = [
    "extracteur_ferraille",
    "reacteur_instable",
    "extracteur_nanocomposants",
    "archives_fracturees"
];

const REF_BASE_SCRAP = 50;
const REF_BASE_ENERGY = 20;
const REF_TARGET_SCRAP = 2500000;
const REF_TARGET_ENERGY = 1800000;
const REF_STEPS = 9;

const SCRAP_GROWTH_RATE = Math.pow(REF_TARGET_SCRAP / REF_BASE_SCRAP, 1 / REF_STEPS);
const ENERGY_GROWTH_RATE = Math.pow(REF_TARGET_ENERGY / REF_BASE_ENERGY, 1 / REF_STEPS);

function getScaledBuildingCost(building, level) {
    const scrapBase = building.cost.scrap || 0;
    const energyBase = building.cost.energy || 0;

    return {
        scrap: Math.floor(scrapBase * Math.pow(SCRAP_GROWTH_RATE, level - 1)),
        energy: Math.floor(energyBase * Math.pow(ENERGY_GROWTH_RATE, level - 1))
    };
}

function getScaledBuildingTime(level) {
    return (level - 1) * 600; // 10 min par palier, en secondes
}

// =======================================
// ATELIER DE RÉPARATION : coût/temps à part
// (nano/données, 20 min/palier, calibré niveau1→2 = 1000/1000,
//  niveau 10 ≈ 10 000 000 nano / 9 500 000 données)
// =======================================

const ATELIER_L2_NANO = 1000;
const ATELIER_TARGET_NANO = 10000000;
const ATELIER_L2_DATA = 1000;
const ATELIER_TARGET_DATA = 9500000;
const ATELIER_STEPS = 8; // du niveau 2 au niveau 10

const ATELIER_NANO_RATE = Math.pow(ATELIER_TARGET_NANO / ATELIER_L2_NANO, 1 / ATELIER_STEPS);
const ATELIER_DATA_RATE = Math.pow(ATELIER_TARGET_DATA / ATELIER_L2_DATA, 1 / ATELIER_STEPS);

function getAtelierCost(level) {
    // level >= 2
    return {
        nano: Math.floor(ATELIER_L2_NANO * Math.pow(ATELIER_NANO_RATE, level - 2)),
        data: Math.floor(ATELIER_L2_DATA * Math.pow(ATELIER_DATA_RATE, level - 2))
    };
}

function getAtelierTime(level) {
    return (level - 1) * 1200; // 20 min par palier, en secondes
}

// =======================================
// HANGARS : coût/temps à part
// (ferraille/énergie, 15 min/palier, calibré niveau1→2 = 300/150,
//  niveau 10 ≈ 5 000 000 ferraille / 7 500 000 énergie)
// =======================================

const HANGAR_BASE_SCRAP = 300;
const HANGAR_BASE_ENERGY = 150;
const HANGAR_TARGET_SCRAP = 5000000;
const HANGAR_TARGET_ENERGY = 7500000;
const HANGAR_STEPS = 9;

const HANGAR_SCRAP_RATE = Math.pow(HANGAR_TARGET_SCRAP / HANGAR_BASE_SCRAP, 1 / HANGAR_STEPS);
const HANGAR_ENERGY_RATE = Math.pow(HANGAR_TARGET_ENERGY / HANGAR_BASE_ENERGY, 1 / HANGAR_STEPS);

function getHangarCost(level) {
    return {
        scrap: Math.floor(HANGAR_BASE_SCRAP * Math.pow(HANGAR_SCRAP_RATE, level - 1)),
        energy: Math.floor(HANGAR_BASE_ENERGY * Math.pow(HANGAR_ENERGY_RATE, level - 1))
    };
}

function getHangarTime(level) {
    return (level - 1) * 900; // 15 min par palier, en secondes
}

// =======================================
// HELPERS GÉNÉRIQUES (dispatch selon le bâtiment)
// =======================================

const RESOURCE_LABELS = {
    scrap: "ferraille",
    energy: "énergie",
    nano: "nanocomposants",
    data: "données anciennes"
};

function getBuildingUpgradeCost(building, level) {
    if (building.id === "atelier_reparation") return getAtelierCost(level);
    if (building.id === "hangar_attaque" || building.id === "hangar_defense") return getHangarCost(level);
    return getScaledBuildingCost(building, level);
}

function getBuildingUpgradeTime(building, level) {
    if (building.id === "atelier_reparation") return getAtelierTime(level);
    if (building.id === "hangar_attaque" || building.id === "hangar_defense") return getHangarTime(level);
    return getScaledBuildingTime(level);
}

function formatCost(cost) {
    return Object.entries(cost)
        .map(([res, val]) => `${val} ${RESOURCE_LABELS[res] || res}`)
        .join(", ");
}

function formatDuration(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
}

// Vérifie la disponibilité de plusieurs ressources SANS rien dépenser
// (évite de dépenser une partie du coût si une ressource manque)
function canAffordAll(resourceList) {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    return resourceList.every(r => (save[r.resource] || 0) >= r.amount);
}

function canAffordCost(cost) {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    return Object.entries(cost).every(([res, val]) => (save[res] || 0) >= val);
}

function spendCost(cost) {
    return Object.entries(cost).every(([res, val]) => spendResource(res, val));
}

// =======================================
// GESTION DES AMÉLIORATIONS EN COURS
// (indépendantes par bâtiment, plusieurs en parallèle possibles)
// =======================================

function loadBuildingUpgrades() {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    return save.buildingUpgrades || {};
}

function saveBuildingUpgrades(upgrades) {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    save.buildingUpgrades = upgrades;
    localStorage.setItem("cosmicSave", JSON.stringify(save));
}

function startBuildingUpgrade(building, time) {
    const upgrades = loadBuildingUpgrades();
    upgrades[building.id] = { endTime: Date.now() + time * 1000 };
    saveBuildingUpgrades(upgrades);
}

function finalizeBuildingUpgrade(buildingId) {
    const upgrades = loadBuildingUpgrades();
    if (!upgrades[buildingId]) return;

    delete upgrades[buildingId];
    saveBuildingUpgrades(upgrades);

    if (GameData.buildings[buildingId]) {
        GameData.buildings[buildingId].level++;
    }
    saveGame();
}

// =======================================
// IMAGE PAR NIVEAU
// =======================================

function getBuildingImage(buildingId, level) {
    const b = buildings.find(x => x.id === buildingId);

    if (!b || !b.imageBase) {
        return "assets/buildings/default.png";
    }

    return `${b.imageBase}_lvl${level}.png`;
}

// =======================================
// TEXTE DE PRODUCTION / BONUS
// =======================================

function getBuildingProductionText(building, level) {
    if (building.id === "atelier_reparation") {
        const pct = typeof getRepairPercent === "function"
            ? Math.floor(getRepairPercent(GameData.buildings) * 100)
            : level * 5;
        return `Répare ${pct}% des unités perdues au combat`;
    }

    if (!building.production) return "Pas de production";

    if (building.id === "extracteur_ferraille") {
        return `Production : ${scrapProduction[level - 1] || 0}/s`;
    }
    if (building.id === "reacteur_instable") {
        return `Production : ${energyProduction[level - 1] || 0}/s`;
    }
    if (building.id === "extracteur_nanocomposants") {
        return `Production : ${nanoProduction[level - 1] || 0}/s`;
    }
    if (building.id === "archives_fracturees") {
        return `Production : ${dataProduction[level - 1] || 0}/s`;
    }

    return `Production : ${building.production.base * level}/s`;
}

// =======================================
// INITIALISATION DE LA PAGE BÂTIMENTS
// =======================================

function initBatiments() {

    const slots = document.querySelectorAll("#building-slots .slot");
    const upgrades = loadBuildingUpgrades();

    slots.forEach((slot, index) => {
        const b = buildings[index];

        if (!b) {
            slot.classList.add("empty");
            slot.textContent = "Emplacement vide";
            return;
        }

        const level = GameData.buildings[b.id]?.level || 1;
        const isLocked = GameData.buildings[b.id]?.unlocked === false;
        const unlockInfo = BUILDING_UNLOCK_COST[b.id];
        const isScaled = SCALED_COST_BUILDINGS.includes(b.id) || b.id === "atelier_reparation" || b.id === "hangar_attaque" || b.id === "hangar_defense";
        const activeUpgrade = !isLocked ? upgrades[b.id] : null;

        slot.classList.toggle("locked-building", isLocked);

        let costTimeHTML;
        let buttonOrProgressHTML;

        if (isLocked) {
            if (unlockInfo?.multi) {
                const costLine = unlockInfo.resources.map(r => `${r.amount} ${r.label}`).join(", ");
                costTimeHTML = `<div class="building-cost">Déblocage : ${costLine}</div>`;
                buttonOrProgressHTML = `<button class="building-button" data-role="unlock-multi">Débloquer</button>`;
            } else {
                costTimeHTML = `
                    <div class="building-cost">Coût : ${b.cost.scrap} ferraille, ${b.cost.energy} énergie</div>
                    <div class="building-time">Temps : 1s</div>
                `;
                buttonOrProgressHTML = unlockInfo
                    ? `<button class="building-button" data-role="unlock">Débloquer (${unlockInfo.amount} ${unlockInfo.label})</button>`
                    : `<button class="building-button" disabled>Débloqué via le Labo</button>`;
            }

        } else if (isScaled && activeUpgrade) {
            const remaining = Math.max(0, Math.floor((activeUpgrade.endTime - Date.now()) / 1000));

            costTimeHTML = `<div class="building-cost">Amélioration en cours…</div>`;
            buttonOrProgressHTML = `
                <div class="progressBar">
                    <div id="buildProgress-${b.id}" class="progressFill" style="width:0%"></div>
                </div>
                <p id="buildTimer-${b.id}">Temps restant : ${formatDuration(remaining)}</p>
                <button class="building-button" disabled>Amélioration en cours…</button>
            `;

        } else if (isScaled) {
            if (level >= b.maxLevel) {
                costTimeHTML = `<div class="building-cost">Niveau max atteint</div>`;
                buttonOrProgressHTML = `<button class="building-button" disabled>Niveau max</button>`;
            } else {
                const nextLevel = level + 1;
                const cost = getBuildingUpgradeCost(b, nextLevel);
                const time = getBuildingUpgradeTime(b, nextLevel);

                costTimeHTML = `
                    <div class="building-cost">Coût : ${formatCost(cost)}</div>
                    <div class="building-time">Temps : ${formatDuration(time)}</div>
                `;
                buttonOrProgressHTML = `<button class="building-button" data-role="upgrade-scaled">Améliorer</button>`;
            }

        } else {
            // Hangars : comportement inchangé (instantané, coût fixe)
            costTimeHTML = `
                <div class="building-cost">Coût : ${b.cost.scrap} ferraille, ${b.cost.energy} énergie</div>
                <div class="building-time">Temps : 1s</div>
            `;
            buttonOrProgressHTML = level >= b.maxLevel
                ? `<button class="building-button" disabled>Niveau max</button>`
                : `<button class="building-button" data-role="upgrade-instant">Améliorer</button>`;
        }

        slot.innerHTML = `
            <div class="building-card">
                <img 
                    src="${getBuildingImage(b.id, level)}" 
                    class="building-image" 
                    alt="${b.name}"
                    onerror="this.onerror=null; this.src='https://placehold.co/200x200?text=Image+Manquante';"
                >

                <div class="building-name">${b.name}</div>
                <div class="building-description">${b.description}</div>

                <div class="building-level">
                    Niveau : <span class="lvl-val">${level}</span> / ${b.maxLevel}
                </div>

                <div class="building-bonus">
                    ${isLocked ? (unlockInfo ? "Verrouillé — aucune production" : "Verrouillé — débloqué via le Labo") : getBuildingProductionText(b, level)}
                </div>

                ${costTimeHTML}

                ${buttonOrProgressHTML}
            </div>
        `;

        const button = slot.querySelector(".building-button");
        if (!button || button.disabled) return;

        const role = button.dataset.role;

        if (role === "unlock") {
            button.addEventListener("click", () => {
                if (spendResource(unlockInfo.resource, unlockInfo.amount)) {
                    GameData.buildings[b.id].unlocked = true;
                    saveGame();
                    initBatiments();
                } else {
                    alert("Pas assez de ressources !");
                }
            });

        } else if (role === "unlock-multi") {
            button.addEventListener("click", () => {
                if (!canAffordAll(unlockInfo.resources)) {
                    alert("Pas assez de ressources !");
                    return;
                }
                unlockInfo.resources.forEach(r => spendResource(r.resource, r.amount));
                GameData.buildings[b.id].unlocked = true;
                saveGame();
                initBatiments();
            });

        } else if (role === "upgrade-scaled") {
            button.addEventListener("click", () => {
                const currentLevel = GameData.buildings[b.id].level;
                if (currentLevel >= b.maxLevel) return;

                const nextLevel = currentLevel + 1;
                const cost = getBuildingUpgradeCost(b, nextLevel);
                const time = getBuildingUpgradeTime(b, nextLevel);

                if (!canAffordCost(cost)) {
                    alert("Pas assez de ressources !");
                    return;
                }

                spendCost(cost);
                startBuildingUpgrade(b, time);
                initBatiments();
            });

        } else if (role === "upgrade-instant") {
            button.addEventListener("click", () => {
                const currentLevel = GameData.buildings[b.id].level;
                if (currentLevel >= b.maxLevel) return;

                if (spendResource("scrap", b.cost.scrap) && spendResource("energy", b.cost.energy)) {
                    GameData.buildings[b.id].level++;
                    saveGame();
                    initBatiments();
                } else {
                    alert("Pas assez de ressources !");
                }
            });
        }
    });
}

// =======================================
// TICK : PROGRESSION DES AMÉLIORATIONS EN COURS
// =======================================

function updateBuildingUpgradesProgress() {
    const upgrades = loadBuildingUpgrades();
    const ids = Object.keys(upgrades);
    if (ids.length === 0) return;

    let anyFinished = false;

    ids.forEach(buildingId => {
        const entry = upgrades[buildingId];
        const b = buildings.find(x => x.id === buildingId);
        if (!b) return;

        const nextLevel = (GameData.buildings[buildingId]?.level || 1) + 1;
        const totalTime = getBuildingUpgradeTime(b, nextLevel);
        const remaining = Math.floor((entry.endTime - Date.now()) / 1000);
        const elapsed = totalTime - Math.max(remaining, 0);
        const percent = totalTime > 0 ? Math.min(100, Math.floor((elapsed / totalTime) * 100)) : 100;

        const bar = document.getElementById(`buildProgress-${buildingId}`);
        if (bar) bar.style.width = percent + "%";

        const timer = document.getElementById(`buildTimer-${buildingId}`);
        if (timer) timer.textContent = "Temps restant : " + formatDuration(Math.max(remaining, 0));

        if (remaining <= 0) {
            finalizeBuildingUpgrade(buildingId);
            anyFinished = true;
        }
    });

    if (anyFinished) {
        initBatiments();
    }
}

setInterval(updateBuildingUpgradesProgress, 1000);