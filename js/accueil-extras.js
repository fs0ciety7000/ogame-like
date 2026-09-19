/* =====================================================
   PAGE ACCUEIL — PUISSANCE MILITAIRE / MISSIONS / AMÉLIORATIONS
===================================================== */

// Unités offensives (comptent pour ATK, capacité liée au Hangar d'attaque)
const OFFENSIVE_UNITS = [
    "drone_recuperateur",
    "fregate",
    "sentinelle",
    "cargo",
    "chasseur",
    "etoile_noire"
];

// Unités défensives (comptent pour DEF, capacité liée au Hangar de défense)
const DEFENSIVE_UNITS = [
    "roquette",
    "canon_impulsion",
    "canon_plasma",
    "batterie_aa",
    "intercepteur"
];

/* =====================================================
   Calcul de la stat effective d'une unité (base + progression labo)
===================================================== */
function getUnitStat(unitId, statName) {
    const level = GameData.units[unitId]?.level ?? 0;
    if (level <= 0) return 0; // unité non débloquée au labo

    const base = (typeof UNIT_BASE_STATS !== "undefined" && UNIT_BASE_STATS[unitId])
        ? UNIT_BASE_STATS[unitId][statName] ?? 0
        : 0;

    return base + (level - 1) * 5;
}

/* =====================================================
   Puissance militaire (ATK / DEF)
===================================================== */
function updateAccueilMilitaryPower() {
    const attackEl = document.getElementById("acc-attack-total");
    const defenseEl = document.getElementById("acc-defense-total");
    if (!attackEl || !defenseEl) return;

    const U = GameData.units || {};

    let totalAttack = 0;
    OFFENSIVE_UNITS.forEach(id => {
        const attack = getUnitStat(id, "attack");
        const count = U[id]?.count ?? 0;
        totalAttack += attack * count;
    });

    let totalDefense = 0;
    DEFENSIVE_UNITS.forEach(id => {
        const attack = getUnitStat(id, "attack");
        const count = U[id]?.count ?? 0;
        totalDefense += attack * count;
    });

    attackEl.textContent = Math.floor(totalAttack);
    defenseEl.textContent = Math.floor(totalDefense);
}

/* =====================================================
   Missions en cours
===================================================== */
function updateAccueilMissions() {
    const list = document.getElementById("acc-missions-list");
    if (!list) return;

    list.innerHTML = "";

    const active = typeof loadActiveMissions === "function" ? loadActiveMissions() : [];

    if (active.length === 0) {
        list.innerHTML = "<li>Aucune mission en cours</li>";
        return;
    }

    const now = Date.now();

    active.forEach(m => {
        const mission = MISSIONS[m.key];
        if (!mission) return;

        const remaining = Math.max(0, Math.floor((m.endTime - now) / 1000));

        const li = document.createElement("li");
        li.textContent = `${mission.name} — ${formatTime(remaining)}`;
        list.appendChild(li);
    });
}

/* =====================================================
   Amélioration en cours (labo)
===================================================== */
function updateAccueilUpgrades() {
    const list = document.getElementById("acc-upgrades-list");
    if (!list) return;

    list.innerHTML = "";

    const active = JSON.parse(localStorage.getItem("rechercheActive"));

    if (!active) {
        list.innerHTML = "<li>Aucune amélioration en cours</li>";
        return;
    }

    const tech = technologies.find(t => t.id === active.id);
    if (!tech) return;

    const remaining = Math.max(0, Math.floor((active.endTime - Date.now()) / 1000));

    const li = document.createElement("li");
    li.textContent = `${tech.nom} — ${formatTime(remaining)}`;
    list.appendChild(li);
}

/* =====================================================
   Production horaire (bâtiments + bonus labo)
===================================================== */
function updateAccueilProduction() {
    const scrapEl = document.getElementById("acc-prod-scrap");
    if (!scrapEl) return;

    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};

    const getLevel = (id) => save.buildings?.[id]?.level || 0;
    const isUnlocked = (id) => save.buildings?.[id]?.unlocked === true;

    const scrapLevel = getLevel("extracteur_ferraille");
    const energyLevel = getLevel("reacteur_instable");
    const nanoLevel = getLevel("extracteur_nanocomposants");
    const dataLevel = getLevel("archives_fracturees");

    const energyBonus = save.energyEfficiency || 0;

    const prod = {
        scrap: scrapProduction[scrapLevel - 1] || 0,
        energy: isUnlocked("reacteur_instable") ? Math.floor((energyProduction[energyLevel - 1] || 0) * (1 + energyBonus)) : 0,
        nano: isUnlocked("extracteur_nanocomposants") ? (nanoProduction[nanoLevel - 1] || 0) : 0,
        data: isUnlocked("archives_fracturees") ? (dataProduction[dataLevel - 1] || 0) : 0
    };

    scrapEl.textContent = prod.scrap;
    document.getElementById("acc-prod-energy").textContent = prod.energy;
    document.getElementById("acc-prod-nano").textContent = prod.nano;
    document.getElementById("acc-prod-data").textContent = prod.data;
}

/* =====================================================
   Rafraîchissement global (uniquement si la page accueil est visible)
===================================================== */
function refreshAccueilExtras() {
    const page = document.getElementById("acceuil");
    if (!page || page.style.display === "none") return;

    updateAccueilMilitaryPower();
    updateAccueilMissions();
    updateAccueilUpgrades();
    updateAccueilProduction();
}

// Tick toutes les secondes (timers missions/labo à jour en direct)
setInterval(refreshAccueilExtras, 1000);

// Premier appel au chargement
window.addEventListener("load", refreshAccueilExtras);