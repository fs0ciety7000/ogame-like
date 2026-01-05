// ===============================
// UNITES.JS - GESTION DES CARTES
// ===============================

// Note: getUnitCapacity() et getTotalUnits() viennent maintenant de layout.js

// ===============================
// SYNC AVEC LES MISSIONS
// ===============================
function syncUnitsToSave() {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    // Sauvegarde spécifique pour le système de missions
    save.droneCount = GameData.units["drone_recuperateur"]?.count || 0;
    localStorage.setItem("cosmicSave", JSON.stringify(save));
}

// ===============================
// DONNÉES DES UNITÉS (CONFIG)
// ===============================
const unitsConfig = [
    {
        id: "hangar", name: "Hangar", maxLevel: 10,
        attack: 0, defense: 0, speed: 0,
        description: "Augmente la capacité maximale d'unités.",
        cost: { metal: 120, crystal: 40 }, time: "20s", image: "assets/units/hangar.png"
    },
    {
        id: "drone_recuperateur", name: "Drone récupérateur", maxLevel: 10,
        attack: 3, defense: 1, speed: 12,
        description: "Un drone léger conçu pour l'exploration.",
        cost: { metal: 120, crystal: 40 }, time: "20s", image: "assets/units/drone_recuperateur.png"
    },
    {
        id: "fregate", name: "Frégate", maxLevel: 10,
        attack: 8, defense: 5, speed: 6,
        description: "Un vaisseau ancien mais encore fonctionnel.",
        cost: { metal: 300, crystal: 150 }, time: "45s", image: "assets/units/fregate.png"
    },
    {
        id: "sentinelle", name: "Sentinelle", maxLevel: 10,
        attack: 5, defense: 8, speed: 3,
        description: "Unité défensive bricolée.",
        cost: { metal: 200, crystal: 100 }, time: "35s", image: "assets/units/sentinelle.png"
    },
    {
        id: "cargo", name: "Cargo", maxLevel: 10,
        attack: 5, defense: 8, speed: 3,
        description: "Unité de récupération de ressources.",
        cost: { metal: 200, crystal: 100 }, time: "35s", image: "assets/units/cargo.png"
    },
    {
        id: "chasseur", name: "Chasseur", maxLevel: 10,
        attack: 5, defense: 8, speed: 3,
        description: "Unité d'attaque.",
        cost: { metal: 200, crystal: 100 }, time: "35s", image: "assets/units/chasseur.png"
    }
];

// ===============================
// GÉNÉRATION DES CARTES
// ===============================
const containerUnits = document.getElementById("units-container");

if (containerUnits) {
    unitsConfig.forEach(u => {
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

        // --- ACTION : AMÉLIORER ---
        const upgradeBtn = card.querySelector(".unit-button");
        upgradeBtn.addEventListener("click", () => {
            const cost = u.cost.metal;

            if (spendResource("scrap", cost)) {
                GameData.units[u.id].level++;

                // MAJ Carte
                card.querySelector(".unit-level").textContent = `Niveau : ${GameData.units[u.id].level} / ${u.maxLevel}`;

                // Si Hangar, on met à jour le HUD global
                if (u.id === "hangar") {
                    updateGlobalUnitHUD(); // Fonction de layout.js
                    syncUnitsToSave();
                }
            }
        });

        // --- ACTION : CRÉER (Sauf Hangar) ---
        if (u.id !== "hangar") {
            const createBtn = card.querySelector(".unit-create");
            createBtn.addEventListener("click", () => {
                
                // On utilise les fonctions globales de layout.js
                const total = getTotalUnits();
                const capacity = getUnitCapacity();

                if (total >= capacity) {
                    // Feedback visuel optionnel : Hangar plein
                    alert("Hangar plein !");
                    return; 
                }

                if (spendResource("scrap", u.cost.metal)) {
                    GameData.units[u.id].count = (GameData.units[u.id].count || 0) + 1;

                    syncUnitsToSave();
                    updateGlobalUnitHUD(); // Mise à jour immédiate du compteur
                }
            });
        }
    });
}