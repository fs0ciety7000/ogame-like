// =======================================
// INITIALISATION DE LA SAUVEGARDE SI ABSENTE
// =======================================

function initSaveIfMissing() {
    let save = JSON.parse(localStorage.getItem("cosmicSave"));

    // Si aucune sauvegarde → créer un objet vide
    if (!save) save = {};

    // ============================
    // RESSOURCES
    // ============================
    save.scrap ??= 100;
    save.energy ??= 50;
    save.nano ??= 0;
    save.data ??= 0;
    save.tools ??= 0;
    save.drones ??= 0;
    save.parts ??= 0;
    save.intel ??= 0;

    // ============================
    // BÂTIMENTS (CRITIQUE POUR LA PRODUCTION)
    // ============================
    if (!save.buildings) {
        save.buildings = {
            extracteur_ferraille: 1,
            reacteur_instable: 1,
            extracteur_nanocomposants: 1,
            archives_fracturees: 1,
            atelier_reparation: 1
        };
    }

    // ============================
    // UNITÉS
    // ============================
    if (!save.units) {
        save.units = GameData.units;
    }

    // ============================
    // TECHNOLOGIES
    // ============================
    save.techLevels ??= {};

    // ============================
    // BONUS LABO
    // ============================
    save.energyEfficiency ??= 0;
    save.unitDefenseBonus ??= 0;
    save.unitAttackBonus ??= 0;
    save.buildingUpgradeDiscount ??= 0;

    // Sauvegarde finale
    localStorage.setItem("cosmicSave", JSON.stringify(save));
}

// Appel immédiat AVANT TOUT
initSaveIfMissing();

// Charger les unités depuis cosmicSave → GameData.units
if (typeof loadGame === "function") {
    loadGame();
}



// =======================================
// CALCULS POUR LA PAGE ACCEUIL
// =======================================

// Total attaque (toutes unités offensives)
function calcTotalAttack(save) {
    let total = 0;
    for (const unitId in save.units) {
        const u = save.units[unitId];
        if (u.attack > 0) total += u.count * u.attack;
    }
    return total;
}

// Total défense (toutes unités défensives)
function calcTotalDefense(save) {
    let total = 0;
    for (const unitId in save.units) {
        const u = save.units[unitId];
        if (u.defense > 0) total += u.count * u.defense;
    }
    return total;
}

// Production horaire (bâtiments + bonus labo)
function calcProduction(save) {
    const getLevel = (id) => save.buildings[id]?.level || 0;
    const isUnlocked = (id) => save.buildings[id]?.unlocked === true;

    const scrapLevel = getLevel("extracteur_ferraille");
    const energyLevel = getLevel("reacteur_instable");
    const nanoLevel = getLevel("extracteur_nanocomposants");
    const dataLevel = getLevel("archives_fracturees");

    const energyBonus = save.energyEfficiency || 0;

    return {
        scrap: scrapProduction[scrapLevel - 1] || 0,
        energy: isUnlocked("reacteur_instable")
            ? Math.floor((energyProduction[energyLevel - 1] || 0) * (1 + energyBonus))
            : 0,
        nano: isUnlocked("extracteur_nanocomposants")
            ? (nanoProduction[nanoLevel - 1] || 0)
            : 0,
        data: isUnlocked("archives_fracturees")
            ? (dataProduction[dataLevel - 1] || 0)
            : 0
    };
}



// =======================================
// REMPLISSAGE DE LA PAGE ACCEUIL
// =======================================

function initAccueil() {
    const save = JSON.parse(localStorage.getItem("cosmicSave"));

    // Attaque / Défense
    document.getElementById("acc-attack-total").textContent = calcTotalAttack(save);
    document.getElementById("acc-defense-total").textContent = calcTotalDefense(save);

    // Production
    const prod = calcProduction(save);
    document.getElementById("acc-prod-scrap").textContent = prod.scrap;
    document.getElementById("acc-prod-energy").textContent = prod.energy;
    document.getElementById("acc-prod-nano").textContent = prod.nano;
    document.getElementById("acc-prod-data").textContent = prod.data;

    // Missions en cours
    const missionsList = document.getElementById("acc-missions-list");
    missionsList.innerHTML = "";
    if (save.missions) {
        save.missions.forEach(m => {
            const li = document.createElement("li");
            li.textContent = `${m.name} – ${m.remainingTime} min restantes`;
            missionsList.appendChild(li);
        });
    }

    // Améliorations en cours
    const upgradesList = document.getElementById("acc-upgrades-list");
    upgradesList.innerHTML = "";
    if (save.upgrades) {
        save.upgrades.forEach(u => {
            const li = document.createElement("li");
            li.textContent = `${u.name} – ${u.remainingTime} min restantes`;
            upgradesList.appendChild(li);
        });
    }
}



// =======================================
// MUSIQUE DU JEU (ne s'arrête jamais)
// =======================================

const music = document.getElementById("gameMusic");

document.addEventListener("click", () => {
    if (music.paused) {
        music.volume = 0.6;
        music.play();
    }
});



// =======================================
// NAVIGATION ENTRE LES PAGES
// =======================================

const buttons = document.querySelectorAll(".hud-btn");
const pages = document.querySelectorAll(".page");

function navigate(pageId) {

    // Masquer toutes les pages
    pages.forEach(p => p.style.display = "none");

    // Afficher la page demandée
    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = "block";
    }

    // Mettre à jour l'état actif du bouton
    buttons.forEach(b => b.classList.remove("active"));
    const btn = document.querySelector(`[data-page="${pageId}"]`);
    if (btn) btn.classList.add("active");

    // Initialisations spécifiques
    if (pageId === "profil") initProfil();
    if (pageId === "batiments") initBatiments();
    if (pageId === "ressources") initRessources();
    if (pageId === "unites") initUnites();
    if (pageId === "acceuil") initAccueil();

    // ⭐⭐ AJOUT IMPORTANT ⭐⭐
    if (pageId === "players") initPlayers();
}

// =======================================
// ÉCOUTEURS SUR LES BOUTONS DU HUD
// =======================================

buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        navigate(btn.dataset.page);
    });
});



// =======================================
// PAGE PAR DÉFAUT AU CHARGEMENT
// =======================================

navigate("acceuil");



// =======================================
// HUD : MENU DÉROULANT DES RESSOURCES
// =======================================

const resMain = document.getElementById("res-main");
const resDropdown = document.getElementById("res-dropdown");

if (resMain && resDropdown) {

    // Ouvrir / fermer le menu
    resMain.addEventListener("click", () => {
        const isOpen = resDropdown.style.display === "flex";
        resDropdown.style.display = isOpen ? "none" : "flex";
    });

    // Fermer si on clique ailleurs
    document.addEventListener("click", (e) => {
        if (!resMain.contains(e.target) && !resDropdown.contains(e.target)) {
            resDropdown.style.display = "none";
        }
    });
}
