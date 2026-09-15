// =======================================
// COÛTS DE DÉBLOCAGE
// =======================================

const BUILDING_UNLOCK_COST = {
    reacteur_instable: { resource: "scrap", amount: 500, label: "Ferraille" },
    extracteur_nanocomposants: { resource: "energy", amount: 500, label: "Énergie" },
    archives_fracturees: { resource: "nano", amount: 500, label: "Nanocomposants" }
};

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
// TEXTE DE PRODUCTION
// =======================================

function getBuildingProductionText(building, level) {
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

        slot.classList.toggle("locked-building", isLocked);

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

                <div class="building-cost">
                    Coût : ${b.cost.scrap} ferraille, ${b.cost.energy} énergie
                </div>

                <div class="building-time">Temps : 1s</div>

                <button class="building-button">
                    ${isLocked ? (unlockInfo ? `Débloquer (${unlockInfo.amount} ${unlockInfo.label})` : "Débloqué via le Labo") : "Améliorer"}
                </button>
            </div>
        `;

        const button = slot.querySelector(".building-button");

        // ===============================
        // BÂTIMENT VERROUILLÉ → bouton "Débloquer"
        // ===============================
        if (isLocked) {
            if (unlockInfo) {
                // Déblocage classique par ressource (réacteur, extracteur nano, archives)
                button.addEventListener("click", () => {
                    if (spendResource(unlockInfo.resource, unlockInfo.amount)) {
                        GameData.buildings[b.id].unlocked = true;
                        saveGame();
                        initBatiments();
                    } else {
                        alert("Pas assez de ressources !");
                    }
                });
            } else {
                // Déblocage via recherche labo (hangars) : bouton non actionnable ici
                button.disabled = true;
            }
            return;
        }

        // ===============================
        // BÂTIMENT DÉVERROUILLÉ → logique normale
        // ===============================

        if (level >= b.maxLevel) {
            button.disabled = true;
            button.textContent = "Niveau max";
        }

        button.addEventListener("click", () => {

            const currentLevel = GameData.buildings[b.id].level;

            if (currentLevel >= b.maxLevel) return;

            if (spendResource("scrap", b.cost.scrap) && spendResource("energy", b.cost.energy)) {

                GameData.buildings[b.id].level++;
                saveGame();

                const newLevel = GameData.buildings[b.id].level;

                slot.querySelector(".lvl-val").textContent = newLevel;
                slot.querySelector(".building-image").src = getBuildingImage(b.id, newLevel);

                slot.querySelector(".building-bonus").textContent =
                    getBuildingProductionText(b, newLevel);

                if (newLevel >= b.maxLevel) {
                    button.disabled = true;
                    button.textContent = "Niveau max";
                }

            } else {
                alert("Pas assez de ressources !");
            }
        });
    });
}