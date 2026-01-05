// ===============================
// CAPACITÉ DU HANGAR
// ===============================

// Capacité = niveau du hangar × 50
function getUnitCapacity() {
    const hangarLevel = GameData.units["hangar"]?.level ?? 1;
    return hangarLevel * 50;
}
// DEBUG TEMPORAIRE
console.log("GameData.units.hangar =", GameData.units.hangar);
console.log("Capacité calculée =", getUnitCapacity());
console.log("Total unités =", getTotalUnits());

// Compte le total d’unités créées
function getTotalUnits() {
    return Object.values(GameData.units)
        .filter(u => u.count)
        .reduce((sum, u) => sum + u.count, 0);
}

// ===============================
// SYNC AVEC LES MISSIONS
// ===============================

function syncUnitsToSave() {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};

    // Les missions utilisent droneCount
    save.droneCount = GameData.units["drone_recuperateur"]?.count || 0;

    localStorage.setItem("cosmicSave", JSON.stringify(save));
}



// ===============================
// HUD : mise à jour de la capacité
// ===============================

function updateUnitHUD() {
    const total = getTotalUnits();
    const capacity = getUnitCapacity();

    const hud = document.getElementById("unit-count-display");
    if (hud) {
        hud.textContent = `Unités : ${total} / ${capacity}`;
    }
}



// ===============================
// LISTE DES UNITÉS
// ===============================

const units = [
    {
        id: "hangar",
        name: "Hangar",
        maxLevel: 10,
        attack: 0,
        defense: 0,
        speed: 0,
        description: "Augmente la capacité maximale d'unités.",
        cost: { metal: 120, crystal: 40 },
        time: "20s",
        image: "assets/units/hangar.png"
    },
    {
        id: "drone_recuperateur",
        name: "Drone récupérateur",
        maxLevel: 10,
        attack: 3,
        defense: 1,
        speed: 12,
        description: "Un drone léger conçu pour l'exploration.",
        cost: { metal: 120, crystal: 40 },
        time: "20s",
        image: "assets/units/drone_recuperateur.png"
    },
    {
        id: "fregate",
        name: "Frégate",
        maxLevel: 10,
        attack: 8,
        defense: 5,
        speed: 6,
        description: "Un vaisseau ancien mais encore fonctionnel.",
        cost: { metal: 300, crystal: 150 },
        time: "45s",
        image: "assets/units/fregate.png"
    },
    {
        id: "sentinelle",
        name: "Sentinelle",
        maxLevel: 10,
        attack: 5,
        defense: 8,
        speed: 3,
        description: "Unité défensive bricolée à partir de pièces récupérées.",
        cost: { metal: 200, crystal: 100 },
        time: "35s",
        image: "assets/units/sentinelle.png"
    },
    {
        id: "cargo",
        name: "Cargo",
        maxLevel: 10,
        attack: 5,
        defense: 8,
        speed: 3,
        description: "Unité de récupération de ressources.",
        cost: { metal: 200, crystal: 100 },
        time: "35s",
        image: "assets/units/cargo.png"
    },
    {
        id: "chasseur",
        name: "Chasseur",
        maxLevel: 10,
        attack: 5,
        defense: 8,
        speed: 3,
        description: "Unité d'attaque.",
        cost: { metal: 200, crystal: 100 },
        time: "35s",
        image: "assets/units/chasseur.png"
    }
];



// ===============================
// GÉNÉRATION DES CARTES
// ===============================

const containerUnits = document.getElementById("units-container");

units.forEach(u => {

    // Niveau actuel depuis GameData
    const level = GameData.units[u.id]?.level ?? 1;

    const card = document.createElement("div");
    card.className = "unit-card";

    card.innerHTML = `
        <img src="${u.image}" class="unit-image" alt="${u.name}">
        <div class="unit-name">${u.name}</div>
        <div class="unit-description">${u.description}</div>
        <div class="unit-level">Niveau : ${level} / ${u.maxLevel}</div>
        <div class="unit-stats">ATK : ${u.attack} | DEF : ${u.defense} | VIT : ${u.speed}</div>
        <div class="unit-cost">Coût : ${u.cost.metal} métal, ${u.cost.crystal} cristal</div>
        <div class="unit-time">Temps : ${u.time}</div>

        <button class="unit-button">Améliorer</button>

        ${u.id !== "hangar" ? `<button class="unit-create">Créer</button>` : ""}
    `;

    containerUnits.appendChild(card);



    // ===============================
    // BOUTON AMÉLIORER
    // ===============================

    const upgradeBtn = card.querySelector(".unit-button");

    upgradeBtn.addEventListener("click", () => {

        const cost = u.cost.metal;

        if (spendResource("scrap", cost)) {

            GameData.units[u.id].level++;

            card.querySelector(".unit-level").textContent =
                `Niveau : ${GameData.units[u.id].level} / ${u.maxLevel}`;

            // Si c’est le hangar → mettre à jour le HUD + missions
            if (u.id === "hangar") {
                updateUnitHUD();
                syncUnitsToSave();

                if (typeof renderMissionsList === "function") {
                    renderMissionsList();
                }
            }
        }
    });



    // ===============================
    // BOUTON CRÉER (sauf hangar)
    // ===============================

    if (u.id !== "hangar") {

        const createBtn = card.querySelector(".unit-create");

        createBtn.addEventListener("click", () => {

            const total = getTotalUnits();
            const capacity = getUnitCapacity();

            if (total >= capacity) {
                return; // silencieux
            }

            if (spendResource("scrap", u.cost.metal)) {

                GameData.units[u.id].count = (GameData.units[u.id].count || 0) + 1;

                // 🔥 Synchronisation avec les missions
                syncUnitsToSave();

                // 🔥 Mise à jour du HUD
                updateUnitHUD();

                // 🔥 Mise à jour des missions si dispo
                if (typeof renderMissionsList === "function") {
                    renderMissionsList();
                }
            }
        });
    }
});

// Mise à jour initiale du HUD au chargement
updateUnitHUD();
syncUnitsToSave();
