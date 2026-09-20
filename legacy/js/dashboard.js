// =======================================
// INITIALISATION DE LA SAUVEGARDE SI ABSENTE
// (utilisé uniquement pour un compte tout neuf, sans aucune donnée)
// =======================================

function initSaveIfMissing() {
    let save = JSON.parse(localStorage.getItem("cosmicSave"));

    if (!save) save = {};

    // ============================
    // RESSOURCES
    // ============================
    save.scrap ??= 100;
    save.energy ??= 50;
    save.nano ??= 0;
    save.data ??= 0;
    save.reinforcedSteel ??= 0;
    save.cyberModule ??= 0;
    save.syntheticNanites ??= 0;
    save.aiFragment ??= 0;

    // ============================
    // BÂTIMENTS (format objet : level + unlocked, cohérent avec le reste du jeu)
    // ============================
    if (!save.buildings) {
        save.buildings = {
            extracteur_ferraille: { level: 1, unlocked: true },
            reacteur_instable: { level: 1, unlocked: false },
            extracteur_nanocomposants: { level: 1, unlocked: false },
            archives_fracturees: { level: 1, unlocked: false },
            atelier_reparation: { level: 1, unlocked: false },
            hangar_attaque: { level: 1, unlocked: false },
            hangar_defense: { level: 1, unlocked: false }
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
    // XP / STATISTIQUES DE COMBAT
    // ============================
    save.xp ??= 0;
    save.victories ??= 0;
    save.defeats ??= 0;

    // ============================
    // BONUS LABO
    // ============================
    save.energyEfficiency ??= 0;
    save.unitDefenseBonus ??= 0;
    save.unitAttackBonus ??= 0;
    save.buildingUpgradeDiscount ??= 0;

    localStorage.setItem("cosmicSave", JSON.stringify(save));
}

// Appel immédiat AVANT TOUT
initSaveIfMissing();

// Charger les unités depuis cosmicSave → GameData.units
if (typeof loadGame === "function") {
    loadGame();
}

// Charger les bâtiments depuis cosmicSave → GameData.buildings
// (sinon GameData.buildings resterait bloqué sur ses valeurs par défaut après un rechargement de page)
function loadBuildingsFromSave() {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    if (!save.buildings) return;

    for (const id in save.buildings) {
        if (!GameData.buildings[id]) continue;

        const saved = save.buildings[id];
        if (typeof saved === "object") {
            GameData.buildings[id].level = saved.level ?? GameData.buildings[id].level;
            if (typeof saved.unlocked === "boolean") {
                GameData.buildings[id].unlocked = saved.unlocked;
            }
        }
    }
}

loadBuildingsFromSave();

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
    if (pageId === "players") initPlayers();

    // La page accueil (attaque/défense/production/missions/améliorations)
    // est gérée par accueil-extras.js, qui tourne déjà en boucle toutes les
    // secondes. On force juste un rafraîchissement immédiat au clic,
    // pour ne pas attendre jusqu'à 1s avant que ça s'affiche correctement.
    if (pageId === "acceuil" && typeof refreshAccueilExtras === "function") {
        refreshAccueilExtras();
    }
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

    resMain.addEventListener("click", () => {
        const isOpen = resDropdown.style.display === "flex";
        resDropdown.style.display = isOpen ? "none" : "flex";
    });

    document.addEventListener("click", (e) => {
        if (!resMain.contains(e.target) && !resDropdown.contains(e.target)) {
            resDropdown.style.display = "none";
        }
    });
}