/* ===============================
   UNITS.JS - VERSION AVEC VERROUILLAGE LABO + FILE DE PRODUCTION
   =============================== */

const unitsData = [

    // === Drone récupérateur ===
    {
        id: "drone_recuperateur",
        name: "Drone récupérateur",
        image: "assets/units/drone_recuperateur.png",
        maxLevel: 10,
        description: "Petit drone autonome conçu pour récupérer des ressources dispersées.",
        cost: { scrap: 500, energy: 200 },
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
        cost: { scrap: 1000, energy: 500 },
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
        cost: { scrap: 1200, energy: 300 },
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
        cost: { scrap: 800, energy: 400 },
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
        cost: { scrap: 1500, energy: 800 },
        stats: { attaque: 105, defense: 10, vitesse: 8, cargo: 5 },
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
        cost: { scrap: 50000, energy: 30000 },
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
        cost: { scrap: 200, energy: 100 },
        stats: { attaque: 70, defense: 0, vitesse: 0, cargo: 0 },
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
        cost: { scrap: 2000, energy: 1200 },
        stats: { attaque: 90, defense: 10, vitesse: 0, cargo: 0 },
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
        cost: { scrap: 2500, energy: 1500 },
        stats: { attaque: 125, defense: 20, vitesse: 0, cargo: 0 },
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
        cost: { scrap: 1800, energy: 900 },
        stats: { attaque: 155, defense: 60, vitesse: 0, cargo: 0 },
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
        cost: { scrap: 2000, energy: 1200 },
        stats: { attaque: 255, defense: 15, vitesse: 12, cargo: 5 },
        isBuilding: false,
        category: "defense"
    }
];

/* ===============================
   CORRESPONDANCE UNITÉ → TECHNOLOGIE LABO
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
    GameData.xp = save.xp ?? 0;
    GameData.victories = save.victories ?? 0;
    GameData.defeats = save.defeats ?? 0;
}

/* ===============================
   TEMPS DE FORMATION (proportionnel au coût)
   temps = (ferraille + énergie) / 100, minimum 3s
   =============================== */

function getUnitBuildTime(unit) {
    const total = (unit.cost.scrap || 0) + (unit.cost.energy || 0);
    return Math.max(3, Math.ceil(total / 100));
}

function formatUnitTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
}

/* ===============================
   FILE DE PRODUCTION (une par catégorie, en parallèle)
   =============================== */

function loadUnitQueues() {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    return save.unitQueues || { attack: [], defense: [] };
}

function saveUnitQueues(queues) {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    save.unitQueues = queues;
    localStorage.setItem("cosmicSave", JSON.stringify(save));
}

function canAffordUnitCost(unit, qty) {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    return Object.entries(unit.cost).every(([res, val]) => (save[res] || 0) >= val * qty);
}

function spendUnitCost(unit, qty) {
    return Object.entries(unit.cost).every(([res, val]) => spendResource(res, val * qty));
}

function getBuiltUnitCounts() {
    let attackUnits = 0;
    let defenseUnits = 0;

    unitsData.forEach(u => {
        const data = GameData.units[u.id];
        if (!data) return;

        if (u.category === "attack") attackUnits += data.count || 0;
        if (u.category === "defense") defenseUnits += data.count || 0;
    });

    return { attackUnits, defenseUnits };
}

function enqueueUnitBuild(unit, qty) {
    const currentLevel = GameData.units[unit.id]?.level ?? 0;
    if (currentLevel <= 0) {
        alert("Cette unité doit d'abord être débloquée via le Labo.");
        return false;
    }

    const queues = loadUnitQueues();
    const category = unit.category;

    const hangarAttaqueLevel = GameData.buildings.hangar_attaque?.level || 0;
    const hangarDefenseLevel = GameData.buildings.hangar_defense?.level || 0;

    const attackCapacity = hangarAttaqueLevel * 2000;
    const defenseCapacity = hangarDefenseLevel * 2000;

    const { attackUnits, defenseUnits } = getBuiltUnitCounts();

    const capacity = category === "attack" ? attackCapacity : defenseCapacity;
    const built = category === "attack" ? attackUnits : defenseUnits;
    const reserved = queues[category].length;

    if (built + reserved + qty > capacity) {
        alert(`Capacité du hangar ${category === "attack" ? "d'attaque" : "de défense"} insuffisante pour cette quantité.`);
        return false;
    }

    if (!canAffordUnitCost(unit, qty)) {
        alert("Ressources insuffisantes.");
        return false;
    }

    spendUnitCost(unit, qty);

    const wasEmpty = queues[category].length === 0;

    for (let i = 0; i < qty; i++) {
        queues[category].push({ unitId: unit.id, endTime: null });
    }

    if (wasEmpty) {
        queues[category][0].endTime = Date.now() + getUnitBuildTime(unit) * 1000;
    }

    saveUnitQueues(queues);
    saveGame();
    updateGlobalUnitHUD();
    return true;
}

function updateUnitQueuesProgress() {
    const queues = loadUnitQueues();
    let changed = false;
    let completedAny = false;

    ["attack", "defense"].forEach(category => {
        const queue = queues[category];
        if (!queue || queue.length === 0) return;

        const front = queue[0];

        if (!front.endTime) {
            const u = unitsData.find(x => x.id === front.unitId);
            front.endTime = Date.now() + getUnitBuildTime(u) * 1000;
            changed = true;
        }

        if (Date.now() >= front.endTime) {
            const u = unitsData.find(x => x.id === front.unitId);
            if (u) {
                if (!GameData.units[u.id]) GameData.units[u.id] = { level: 1, count: 0 };
                GameData.units[u.id].count++;
            }

            queue.shift();
            changed = true;
            completedAny = true;

            if (queue.length > 0) {
                const nu = unitsData.find(x => x.id === queue[0].unitId);
                queue[0].endTime = Date.now() + getUnitBuildTime(nu) * 1000;
            }
        } else {
            // Mise à jour du temps restant directement sur la ligne "temps / unité" de la carte
            const remaining = Math.max(0, Math.floor((front.endTime - Date.now()) / 1000));
            const el = document.getElementById(`build-time-${front.unitId}`);
            if (el) el.textContent = `⏱️ Temps restant : ${formatUnitTime(remaining)}`;
        }
    });

    if (completedAny) saveGame();
    if (changed) saveUnitQueues(queues);
    if (completedAny) initUnites();
}

setInterval(updateUnitQueuesProgress, 1000);

/* ===============================
   INITIALISATION DES UNITÉS
   =============================== */

function initUnites() {

    const capContainer = document.getElementById("units-capacity");
    const container = document.getElementById("units-container");

    if (!capContainer || !container) return;

    capContainer.innerHTML = "";
    container.innerHTML = "";

    const hangarAttaqueLevel = GameData.buildings.hangar_attaque?.level || 0;
    const hangarDefenseLevel = GameData.buildings.hangar_defense?.level || 0;

    const attackCapacity = hangarAttaqueLevel * 2000;
    const defenseCapacity = hangarDefenseLevel * 2000;

    const { attackUnits, defenseUnits } = getBuiltUnitCounts();

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
            return;
        }

        const buildTime = getUnitBuildTime(unit);

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

                <div class="unit-build-time" id="build-time-${unit.id}" style="font-size:0.85em; color:#aaa; margin-top:4px;">
                    ⏱️ ${formatUnitTime(buildTime)} / unité
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
   CONSTRUIRE UNE UNITÉ (MISE EN FILE)
   =============================== */

function buildUnit(unit) {
    const qty = parseInt(document.getElementById(`qty-${unit.id}`).value) || 1;
    enqueueUnitBuild(unit, qty);
    initUnites();
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