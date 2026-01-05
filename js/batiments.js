// ===============================
// IMAGE PAR NIVEAU
// ===============================

function getBuildingImage(buildingId, level) {
    const b = buildings.find(x => x.id === buildingId);
    return `${b.imageBase}_lvl${level}.png`;
}


// ===============================
// REMPLISSAGE DES SLOTS
// ===============================

const slots = document.querySelectorAll(".slot");

slots.forEach((slot, index) => {
    const b = buildings[index];

    if (!b) {
        slot.classList.add("empty");
        slot.textContent = "Emplacement vide";
        return;
    }

    const level = GameData.buildings[b.id].level;

    slot.innerHTML = `
        <div class="building-card">
            <img src="${getBuildingImage(b.id, level)}" class="building-image" alt="${b.name}">
            <div class="building-name">${b.name}</div>
            <div class="building-description">${b.description}</div>
            <div class="building-level">Niveau : ${level} / ${b.maxLevel}</div>
            <div class="building-bonus">${b.bonus}</div>
            <div class="building-cost">Coût : ${b.cost.scrap} ferraille, ${b.cost.energy} énergie</div>
            <div class="building-time">Temps : ${b.time}</div>
            <button class="building-button">Améliorer</button>
        </div>
    `;

    const button = slot.querySelector(".building-button");

    // Désactiver le bouton si déjà au niveau max
    if (level >= b.maxLevel) {
        button.disabled = true;
        button.textContent = "Niveau max";
    }

    button.addEventListener("click", () => {

        // Vérifier le niveau max AVANT tout
        if (GameData.buildings[b.id].level >= b.maxLevel) {
            button.disabled = true;
            button.textContent = "Niveau max";
            return;
        }

        const cost = b.cost;

        // Vérifie si le joueur peut payer
        if (spendResource("scrap", cost.scrap) && spendResource("energy", cost.energy)) {

            GameData.buildings[b.id].level++;
            saveGame();

            const newLevel = GameData.buildings[b.id].level;

            // Mise à jour du texte
            slot.querySelector(".building-level").textContent =
                `Niveau : ${newLevel} / ${b.maxLevel}`;

            // Mise à jour de l’image
            slot.querySelector(".building-image").src =
                getBuildingImage(b.id, newLevel);

            // Si on atteint le niveau max → désactiver le bouton
            if (newLevel >= b.maxLevel) {
                button.disabled = true;
                button.textContent = "Niveau max";
            }

        } else {
            alert("Pas assez de ressources !");
        }
    });
});

// ===============================
// MISE À JOUR DU HUD
// ===============================

function updateResourceDisplay() {
    document.getElementById("scrap").textContent = GameData.resources.scrap;
    document.getElementById("energy").textContent = GameData.resources.energy;
    document.getElementById("nano").textContent = GameData.resources.nano;
    document.getElementById("data").textContent = GameData.resources.research;
}

function saveGame() {
    localStorage.setItem("CosmicEmpiresSave", JSON.stringify(GameData));
}
