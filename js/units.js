/* ===============================
   UNITS.JS - VERSION AVEC VERROUILLAGE LABO
   =============================== */

const unitsData = [

    // === Drone récupérateur ===
    {
        id: "drone_recuperateur",
        name: "Drone récupérateur",
        image: "assets/units/drone_recuperateur.png",
        maxLevel: 10,
        description: "Petit drone autonome conçu pour récupérer des ressources dispersées.",
        cost: { scrap: 50, energy: 20 },
        stats: { attaque: 0, defense: 5, vitesse: 5, cargo: 10 },
        isBuilding: false,
        category: "attack"
    },

    // === Frégate ===
    {
        id: "fregate",
        name: "Frégate",
        image: "assets/units/fregate.png",
        maxLevel: 10,
        description: "Vaisseau polyvalent, équilibré entre attaque et défense.",
        cost: { scrap: 100, energy: 50 },
        stats: { attaque: 15, defense: 20, vitesse: 3, cargo: 5 },
        isBuilding: false,
        category: "attack"
    },

    // === Cargo ===
    {
        id: "cargo",
        name: "Cargo",
        image: "assets/units/cargo.png",
        maxLevel: 10,
        description: "Transporteur massif conçu pour déplacer de grandes quantités de ressources.",
        cost: { scrap: 120, energy: 30 },
        stats: { attaque: 0, defense: 10, vitesse: 3, cargo: 50 },
        isBuilding: false,
        category: "attack"
    },

    // === Sentinelle ===
    {
        id: "sentinelle",
        name: "Sentinelle",
        image: "assets/units/sentinelle.png",
        maxLevel: 10,
        description: "Unité défensive spécialisée dans la détection et la protection.",
        cost: { scrap: 80, energy: 40 },
        stats: { attaque: 5, defense: 30, vitesse: 1, detection: 10, cargo: 0 },
        isBuilding: false,
        category: "attack"
    },

    // === Chasseur ===
    {
        id: "chasseur",
        name: "Chasseur",
        image: "assets/units/chasseur.png",
        maxLevel: 10,
        description: "Vaisseau rapide conçu pour les attaques éclairs.",
        cost: { scrap: 150, energy: 80 },
        stats: { attaque: 40, defense: 10, vitesse: 8, cargo: 5 },
        isBuilding: false,
        category: "attack"
    },

    // === Étoile Noire ===
    {
        id: "etoile_noire",
        name: "Étoile Noire",
        image: "assets/units/etoile_noire.png",
        maxLevel: 10,
        description: "Arme ultime. Capacité de destruction massive.",
        cost: { scrap: 5000, energy: 3000 },
        stats: { attaque: 500, defense: 500, vitesse: 1, cargo: 1000 },
        isBuilding: false,
        category: "attack"
    },

    // === Roquette ===
    {
        id: "roquette",
        name: "Roquette",
        image: "assets/units/roquette.png",
        maxLevel: 10,
        description: "Arme simple mais efficace pour saturer une zone.",
        cost: { scrap: 20, energy: 10 },
        stats: { attaque: 15, defense: 0, vitesse: 0, cargo: 0 },
        isBuilding: false,
        category: "defense"
    },

    // === Canon à impulsion ===
    {
        id: "canon_impulsion",
        name: "Canon à impulsion",
        image: "assets/units/canon_impulsion.png",
        maxLevel: 10,
        description: "Canon énergétique puissant, idéal contre les cibles blindées.",
        cost: { scrap: 200, energy: 120 },
        stats: { attaque: 80, defense: 10, vitesse: 0, cargo: 0 },
        isBuilding: false,
        category: "defense"
    },

    // === Canon Plasma ===
    {
        id: "canon_plasma",
        name: "Canon Plasma",
        image: "assets/units/canon_plasma.png",
        maxLevel: 10,
        description: "Arme lourde tirant des projectiles de plasma surchauffé.",
        cost: { scrap: 250, energy: 150 },
        stats: { attaque: 100, defense: 20, vitesse: 0, cargo: 0 },
        isBuilding: false,
        category: "defense"
    },

    // === Batterie AA ===
    {
        id: "batterie_aa",
        name: "Batterie Anti‑Aérienne",
        image: "assets/units/batterie_aa.png",
        maxLevel: 10,
        description: "Défense spécialisée contre les unités rapides et aériennes.",
        cost: { scrap: 180, energy: 90 },
        stats: { attaque: 10, defense: 60, vitesse: 0, cargo: 0 },
        isBuilding: false,
        category: "defense"
    },

    // === Intercepteur ===
    {
        id: "intercepteur",
        name: "Intercepteur",
        image: "assets/units/intercepteur.png",
        maxLevel: 10,
        description: "Vaisseau ultra‑rapide conçu pour intercepter les cibles prioritaires.",
        cost: { scrap: 200, energy: 120 },
        stats: { attaque: 60, defense: 15, vitesse: 12, cargo: 5 },
        isBuilding: false,
        category: "defense"
    }
];

/* ===============================
   CORRESPONDANCE UNITÉ → TECHNOLOGIE LABO
   (pour afficher quelle recherche débloque quelle unité)
   =============================== */

const UNIT_TO_TECH = {
    drone_recuperateur: "tech9",
    fregate: "tech10",
    cargo: "tech11",
    sentinelle: "tech12",
    chasseur: "tech13",
    roquette: "tech14",
    canon_impulsion: "tech15",
    canon_plasma: "tech16",
    batterie_aa: "tech17",
    intercepteur: "tech18",
    etoile_noire: "tech19"
};

function getUnlockTechName(unitId) {
    const techId = UNIT_TO_TECH[unitId];
    if (!techId || typeof technologies === "undefined") return "une recherche du Labo";

    const tech = technologies.find(t => t.id === techId);
    return tech ? tech.nom : "une recherche du Labo";
}

/* ===============================
    FONCTIONS UTILITAIRES
    =============================== */

function getResourceEmoji(res) {
    const map = {
        scrap: "🔩",
        energy: "⚡",
        nano: "🧬",
        data: "📡",
        tools: "🛠️",
        drones: "🤖",
        parts: "🧩",
        intel: "🧠"
    };
    return map[res] || "❔";
}

function loadGame() {
    let save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    GameData.units = save.units || {};
}

/* ===============================
   INITIALISATION DES UNITÉS
   =============================== */

function initUnites() {

    const capContainer = document.getElementById("units-capacity");
    const container = document.getElementById("units-container");

    if (!capContainer || !container) return;

    capContainer.innerHTML = "";
    container.innerHTML = "";

    /* ===============================
       CAPACITÉS HANGARS
       =============================== */

    const hangarAttaqueLevel = GameData.buildings.hangar_attaque?.level || 0;
    const hangarDefenseLevel = GameData.buildings.hangar_defense?.level || 0;

    const attackCapacity = hangarAttaqueLevel * 500;
    const defenseCapacity = hangarDefenseLevel * 500;

    let attackUnits = 0;
    let defenseUnits = 0;

    unitsData.forEach(unit => {
        const data = GameData.units[unit.id];
        if (!data) return;

        if (unit.category === "attack") attackUnits += data.count || 0;
        if (unit.category === "defense") defenseUnits += data.count || 0;
    });

    const capacityInfo = document.createElement("div");
    capacityInfo.className = "capacity-info";

    capacityInfo.innerHTML = `
    <div class="capacity-slot" style="display:flex; align-items:center; gap:20px; width:100%;">
        <span class="capacity-line1">Capacité hangar d'attaque :</span>
        <span class="capacity-line4">${attackUnits} / ${attackCapacity}</span>

        <div class="capacity-bar" style="flex:1; margin-left:20px;">
            <div class="capacity-fill" style="width:${attackCapacity > 0 ? (attackUnits / attackCapacity) * 100 : 0}%"></div>
        </div>
    </div>

    <div class="capacity-slot" style="display:flex; align-items:center; gap:20px; width:100%; margin-top:15px;">
        <span class="capacity-line1">Capacité hangar de défense :</span>
        <span class="capacity-line4">${defenseUnits} / ${defenseCapacity}</span>

        <div class="capacity-bar" style="flex:1; margin-left:20px;">
            <div class="capacity-fill" style="width:${defenseCapacity > 0 ? (defenseUnits / defenseCapacity) * 100 : 0}%"></div>
        </div>
    </div>
`;

    capContainer.appendChild(capacityInfo);

    /* ===============================
       CARTES UNITÉS
       =============================== */

    unitsData.forEach(unit => {

        const data = GameData.units[unit.id] || { level: 0, count: 0 };
        const level = data.level ?? 0;
        const count = data.count || 0;
        const isLocked = level <= 0;

        const card = document.createElement("div");
        card.className = "unit-card";
        card.classList.toggle("locked-unit", isLocked);

        // ===============================
        // CARTE VERROUILLÉE (recherche labo non faite)
        // ===============================
        if (isLocked) {
            const techName = getUnlockTechName(unit.id);

            card.innerHTML = `
                <div class="unit-image-container">
                    <img src="${unit.image}" alt="${unit.name}" class="unit-image" />
                </div>

                <div class="unit-content">
                    <div class="unit-header">
                        <h3>${unit.name}</h3>
                    </div>

                    <p class="unit-description">${unit.description || ""}</p>

                    <div class="unit-locked-message">
                        🔒 Débloquez cette unité via le Labo : <strong>${techName}</strong>
                    </div>

                    <button class="btn-build" disabled>Verrouillé</button>
                </div>
            `;

            container.appendChild(card);
            return; // pas de logique construire/vendre pour une unité verrouillée
        }

        // ===============================
        // CARTE DÉBLOQUÉE (logique normale, inchangée)
        // ===============================

        const statsHTML = `
        <div class="unit-stats-row">
            <div class="stat-badge">ATK <span>${unit.stats.attaque + (level - 1) * 5}</span></div>
            <div class="stat-badge">DEF <span>${unit.stats.defense + (level - 1) * 5}</span></div>
            <div class="stat-badge">VIT <span>${unit.stats.vitesse * level}</span></div>
            <div class="stat-badge">CAP <span>${unit.stats.cargo * level}</span></div>
        </div>
    `;

        const actionsHTML = `
            <div class="unit-count">Possédés : <strong>${count}</strong></div>

            <div class="unit-actions-horizontal" style="margin-top:10px;">

                <label class="qty-label">Quantité :</label>
                <input type="number" id="qty-${unit.id}" min="1" value="1" class="qty-input">

                <div class="action-buttons">
                    <button class="btn-build" data-id="${unit.id}">Construire</button>
                    <button class="btn-sell" data-id="${unit.id}" title="La vente permet de récupérer 50% du coût de construction.">Vendre</button>
                </div>

            </div>
        `;

        card.innerHTML = `
            <div class="unit-image-container">
                <img src="${unit.image}" alt="${unit.name}" class="unit-image" />
            </div>

            <div class="unit-content">
                <div class="unit-header">
                    <h3>${unit.name}</h3>
                </div>

                <div class="unit-level">
                    <span>Niveau ${level} / ${unit.maxLevel}</span>
                    <div class="level-progress">
                        <div class="level-fill" style="width: ${(level / unit.maxLevel) * 100}%"></div>
                    </div>
                </div>

                ${unit.description ? `<p class="unit-description">${unit.description}</p>` : ""}

                <div class="unit-stats">${statsHTML}</div>

                <div id="cost-${unit.id}" class="unit-cost-row">
                    ${Object.entries(unit.cost).map(([res, val]) => `
                        <div class="cost-badge">
                            ${getResourceEmoji(res)} <span>${val}</span>
                        </div>
                    `).join("")}
                </div>

                ${actionsHTML}
            </div>
        `;

        container.appendChild(card);

        if (!unit.isBuilding) {
            const btnBuild = card.querySelector(".btn-build");
            if (btnBuild) btnBuild.addEventListener("click", () => buildUnit(unit));

            const btnSell = card.querySelector(".btn-sell");
            if (btnSell) btnSell.addEventListener("click", () => sellUnit(unit));

            const qtyInput = card.querySelector(`#qty-${unit.id}`);
            if (qtyInput) qtyInput.addEventListener("input", () => updateCost(unit));
        }
    });
}

/* ===============================
   CONSTRUIRE UNE UNITÉ (MASSE)
   =============================== */

function buildUnit(unit) {
    const qty = parseInt(document.getElementById(`qty-${unit.id}`).value) || 1;

    for (let i = 0; i < qty; i++) {
        if (!attemptBuildUnit(unit)) break;
    }

    initUnites();
}

/* ===============================
   CONSTRUCTION UNITAIRE
   =============================== */

function attemptBuildUnit(unit) {

    // Sécurité : impossible de construire une unité non débloquée au labo
    const currentLevel = GameData.units[unit.id]?.level ?? 0;
    if (currentLevel <= 0) {
        alert("Cette unité doit d'abord être débloquée via le Labo.");
        return false;
    }

    const hangarAttaqueLevel = GameData.buildings.hangar_attaque?.level || 0;
    const hangarDefenseLevel = GameData.buildings.hangar_defense?.level || 0;

    const attackCapacity = hangarAttaqueLevel * 500;
    const defenseCapacity = hangarDefenseLevel * 500;

    let attackUnits = 0;
    let defenseUnits = 0;

    unitsData.forEach(u => {
        const data = GameData.units[u.id];
        if (!data) return;

        if (u.category === "attack") attackUnits += data.count || 0;
        if (u.category === "defense") defenseUnits += data.count || 0;
    });

    if (unit.category === "attack" && attackUnits >= attackCapacity) {
        alert("Capacité du hangar d'attaque atteinte.");
        return false;
    }

    if (unit.category === "defense" && defenseUnits >= defenseCapacity) {
        alert("Capacité du hangar de défense atteinte.");
        return false;
    }

    for (const res in unit.cost) {
        if (!spendResource(res, unit.cost[res])) {
            alert("Ressources insuffisantes.");
            return false;
        }
    }

    if (!GameData.units[unit.id]) {
        GameData.units[unit.id] = { level: currentLevel, count: 0 };
    }

    GameData.units[unit.id].count++;
    saveGame();
    updateGlobalUnitHUD();

    return true;
}

/* ===============================
   VENDRE UNE UNITÉ (MASSE)
   =============================== */

function sellUnit(unit) {
    const qty = parseInt(document.getElementById(`qty-${unit.id}`).value) || 1;

    const data = GameData.units[unit.id];
    if (!data || data.count < qty) {
        alert("Tu n'as pas assez d'unités à vendre.");
        return;
    }

    data.count -= qty;

    for (const res in unit.cost) {
        addResource(res, Math.floor(unit.cost[res] * 0.5) * qty);
    }

    saveGame();
    updateGlobalUnitHUD();
    initUnites();
}

/* ===============================
   MISE À JOUR DES COÛTS (DYNAMIQUE)
   =============================== */

function updateCost(unit) {
    const qty = parseInt(document.getElementById(`qty-${unit.id}`).value) || 1;

    const costContainer = document.getElementById(`cost-${unit.id}`);
    if (!costContainer) return;

    costContainer.innerHTML = Object.entries(unit.cost).map(([res, val]) => `
        <div class="cost-badge">
            ${getResourceEmoji(res)} <span>${val * qty}</span>
        </div>
    `).join("");
}