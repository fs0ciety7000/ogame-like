/* =====================================================
   Définition des missions disponibles
===================================================== */
const MISSIONS = {

    // ============================
    // RESSOURCES COMMUNES
    // ============================

    patrouille_courte: {
        key: "patrouille_courte",
        name: "Patrouille courte",
        duration: 60,
        reward: { scrap: 150, xp: 10 },
        prereq: { drone_recuperateur: 2 }
    },
    forage_profond: {
        key: "forage_profond",
        name: "Forage profond",
        duration: 1800,
        reward: { scrap: 3500, xp: 150 },
        prereq: { drone_recuperateur: 12, cargo: 3 }
    },
    collecte_energie: {
        key: "collecte_energie",
        name: "Collecte d'énergie",
        duration: 900,
        reward: { energy: 400, xp: 80 },
        prereq: { chasseur: 6, fregate: 2 }
    },
    analyse_signal: {
        key: "analyse_signal",
        name: "Analyse de signal",
        duration: 900,
        reward: { data: 250, xp: 80 },
        prereq: { drone_recuperateur: 6, sentinelle: 2 }
    },
    synthese_nano: {
        key: "synthese_nano",
        name: "Synthèse de nanocomposants",
        duration: 1800,
        reward: { nano: 60, xp: 150 },
        prereq: { drone_recuperateur: 10, sentinelle: 4 }
    },
    expedition_longue: {
        key: "expedition_longue",
        name: "Expédition longue durée",
        duration: 3600,
        reward: { scrap: 6000, energy: 1200, xp: 300 },
        prereq: { fregate: 5, cargo: 4, chasseur: 6 }
    },

    // ============================
    // RESSOURCES RARES
    // ============================

    recuperation_acier: {
        key: "recuperation_acier",
        name: "Récupération d'acier renforcé",
        duration: 1200,
        reward: { reinforcedSteel: 3, xp: 100 },
        prereq: { drone_recuperateur: 8, chasseur: 4 }
    },
    extraction_module: {
        key: "extraction_module",
        name: "Extraction de module cybernétique",
        duration: 1800,
        reward: { cyberModule: 4, xp: 150 },
        prereq: { sentinelle: 5, fregate: 3 }
    },
    recolte_nanites: {
        key: "recolte_nanites",
        name: "Récolte de nanites synthétiques",
        duration: 2400,
        reward: { syntheticNanites: 5, xp: 200 },
        prereq: { drone_recuperateur: 15, sentinelle: 6 }
    },
    fouille_archives_IA: {
        key: "fouille_archives_IA",
        name: "Fouille d'archives d'IA",
        duration: 3600,
        reward: { aiFragment: 6, xp: 300 },
        prereq: { fregate: 6, sentinelle: 8 }
    },
    mission_elite: {
        key: "mission_elite",
        name: "Mission d'élite",
        duration: 7200,
        reward: {
            reinforcedSteel: 8,
            cyberModule: 6,
            syntheticNanites: 5,
            aiFragment: 4,
            xp: 600
        },
        prereq: { fregate: 10, sentinelle: 10, chasseur: 10, cargo: 5 }
    }
};

const ACTIVE_MISSIONS_KEY = "activeMissions";
const MISSION_LOG_TEXT_KEY = "missionLogText";
const MISSION_LAST_LOG_KEY = "missionLastLog";

let globalMissionTimer = null;

/* =====================================================
   Utilitaires localStorage
===================================================== */
function loadActiveMissions() {
    return JSON.parse(localStorage.getItem(ACTIVE_MISSIONS_KEY)) || [];
}

function saveActiveMissions(list) {
    localStorage.setItem(ACTIVE_MISSIONS_KEY, JSON.stringify(list));
}

/* =====================================================
   Utilitaire : formater un temps en mm:ss
===================================================== */
function formatTime(seconds) {
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r.toString().padStart(2, "0")}`;
}

/* =====================================================
   Vérification des prérequis
   (générique : lit directement les clés de mission.prereq,
   peu importe l'unité, tant que son id correspond à save.units)
===================================================== */
function hasPrerequisites(missionKey) {
    const mission = MISSIONS[missionKey];
    if (!mission) return false;

    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    const units = save.units || {};

    const req = mission.prereq || {};

    for (const [unitId, requiredCount] of Object.entries(req)) {
        const owned = units[unitId]?.count ?? 0;
        if (owned < requiredCount) return false;
    }

    return true;
}

/* =====================================================
   Vérifier si une mission est déjà active
===================================================== */
function isMissionActive(missionKey, activeList) {
    return activeList.some(m => m.key === missionKey);
}

/* =====================================================
   Utilitaire : construit le texte des récompenses
===================================================== */
function getRewardText(reward) {
    let rewardText = [];

    if (!reward) return ["Aucune récompense directe"];

    // Ressources communes
    if (reward.scrap) rewardText.push(`🔩 ${reward.scrap} Ferraille`);
    if (reward.energy) rewardText.push(`⚡ ${reward.energy} Énergie`);
    if (reward.nano) rewardText.push(`🧬 ${reward.nano} Nano‑composants`);
    if (reward.data) rewardText.push(`📡 ${reward.data} Données anciennes`);

    // Ressources rares
    if (reward.reinforcedSteel) rewardText.push(`🛠️ ${reward.reinforcedSteel} Acier renforcé`);
    if (reward.cyberModule) rewardText.push(`🧩 ${reward.cyberModule} Module cybernétique`);
    if (reward.syntheticNanites) rewardText.push(`🤖 ${reward.syntheticNanites} Nanites synthétiques`);
    if (reward.aiFragment) rewardText.push(`🧠 ${reward.aiFragment} Fragment d'IA`);

    // Expérience
    if (reward.xp) rewardText.push(`⭐ ${reward.xp} XP`);

    if (reward.exploration) rewardText.push(`Révélation d'un secteur galactique`);

    if (rewardText.length === 0) rewardText.push("Aucune récompense directe");

    return rewardText;
}

/* =====================================================
   Utilitaire : construit le texte des prérequis
   (drone_recuperateur = même id que dans MISSIONS et save.units)
===================================================== */
function getPrereqText(prereq) {
    let prereqText = [];

    if (!prereq) return ["Aucun"];

    if (prereq.drone_recuperateur) prereqText.push(`${prereq.drone_recuperateur} Drones récupérateurs`);
    if (prereq.chasseur) prereqText.push(`${prereq.chasseur} Chasseurs`);
    if (prereq.fregate) prereqText.push(`${prereq.fregate} Frégates`);
    if (prereq.sentinelle) prereqText.push(`${prereq.sentinelle} Sentinelles`);
    if (prereq.cargo) prereqText.push(`${prereq.cargo} Cargos`);

    if (prereqText.length === 0) prereqText.push("Aucun");

    return prereqText;
}

/* =====================================================
   Affichage de la liste des missions
===================================================== */
function renderMissionsList() {
    const container = document.getElementById("missionsList");
    const missionStatus = document.getElementById("missionStatus");
    const activeMissions = loadActiveMissions();

    container.innerHTML = "";

    for (const mission of Object.values(MISSIONS)) {
        const div = document.createElement("div");
        div.className = "building";

        const hasReq = hasPrerequisites(mission.key);
        const active = isMissionActive(mission.key, activeMissions);

        const rewardText = getRewardText(mission.reward);
        const prereqText = getPrereqText(mission.prereq);

        div.innerHTML = `
            <p><strong>${mission.name}</strong></p>
            <p>Durée : ${Math.floor(mission.duration / 60)} minutes</p>
            <p>Pré‑requis : ${prereqText.join(" + ")}</p>
            <p>Récompense : ${rewardText.join(" + ")}</p>
            <button data-mission="${mission.key}"></button>
        `;

        const btn = div.querySelector("button");

        if (active) {
            btn.disabled = true;
            btn.textContent = "Mission en cours…";
        } else if (!hasReq) {
            btn.disabled = true;
            btn.textContent = "Pré‑requis non remplis";
        } else {
            btn.textContent = "Lancer la mission";
            btn.addEventListener("click", () => startMission(mission.key));
        }

        container.appendChild(div);
    }

    missionStatus.textContent = activeMissions.length > 0 ? "Missions en cours." : "";
}

/* =====================================================
   Mise à jour du journal
===================================================== */
function updateMissionLogDisplay() {
    const missionLog = document.getElementById("missionLog");
    const activeMissions = loadActiveMissions();

    if (activeMissions.length === 0) {
        const last = localStorage.getItem(MISSION_LAST_LOG_KEY);
        missionLog.innerHTML = last || "Aucune mission en cours.";
        localStorage.setItem(MISSION_LOG_TEXT_KEY, missionLog.innerHTML);
        return;
    }

    const now = Date.now();
    const blocks = activeMissions.map(m => {
        const mission = MISSIONS[m.key];
        const remaining = Math.floor((m.endTime - now) / 1000);

        const progress = 1 - (remaining / mission.duration);
        const percent = Math.floor(progress * 100);

        const rewardText = getRewardText(mission.reward);

        return `
            <div class="missionActiveBlock">
                <p><strong>${mission.name}</strong></p>
                <p>Temps restant : ${formatTime(remaining)}</p>
                <div class="progressBar">
                    <div class="progressFill" style="width:${percent}%"></div>
                </div>
                <p class="rewardPreview">Récompense : ${rewardText.join(" + ")}</p>
            </div>
        `;
    });

    missionLog.innerHTML = blocks.join("");
    localStorage.setItem(MISSION_LOG_TEXT_KEY, missionLog.innerHTML);
}

/* =====================================================
   Lancement d'une mission
===================================================== */
function startMission(missionKey) {
    const mission = MISSIONS[missionKey];
    if (!mission) return;

    let activeMissions = loadActiveMissions();
    if (isMissionActive(missionKey, activeMissions)) return;

    const endTime = Date.now() + mission.duration * 1000;

    activeMissions.push({ key: missionKey, endTime });
    saveActiveMissions(activeMissions);

    renderMissionsList();
    updateMissionLogDisplay();
    startGlobalTimer();
}

/* =====================================================
   Timer global
===================================================== */
function startGlobalTimer() {
    if (globalMissionTimer) return;

    globalMissionTimer = setInterval(() => tickMissions(), 1000);
}

function stopGlobalTimerIfNeeded() {
    const activeMissions = loadActiveMissions();
    if (activeMissions.length === 0 && globalMissionTimer) {
        clearInterval(globalMissionTimer);
        globalMissionTimer = null;
    }
}

/* =====================================================
   Tick : fin de mission
===================================================== */
function tickMissions() {
    let activeMissions = loadActiveMissions();
    const now = Date.now();
    let changed = false;

    if (activeMissions.length === 0) {
        stopGlobalTimerIfNeeded();
        updateMissionLogDisplay();
        return;
    }

    const stillActive = [];

    for (const m of activeMissions) {
        const remaining = Math.floor((m.endTime - now) / 1000);

        if (remaining <= 0) {
            finishMission(m.key);
            changed = true;
        } else {
            stillActive.push(m);
        }
    }

    if (changed) {
        saveActiveMissions(stillActive);
        renderMissionsList();
    }

    updateMissionLogDisplay();
    stopGlobalTimerIfNeeded();
}

/* =====================================================
   Fin d'une mission
===================================================== */
function finishMission(missionKey) {
    const missionStatus = document.getElementById("missionStatus");
    const mission = MISSIONS[missionKey];

    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};

    if (mission && mission.reward) {
        // Ressources communes
        if (mission.reward.scrap) save.scrap = (save.scrap || 0) + mission.reward.scrap;
        if (mission.reward.energy) save.energy = (save.energy || 0) + mission.reward.energy;
        if (mission.reward.nano) save.nano = (save.nano || 0) + mission.reward.nano;
        if (mission.reward.data) save.data = (save.data || 0) + mission.reward.data;

        // Ressources rares
        if (mission.reward.reinforcedSteel) save.reinforcedSteel = (save.reinforcedSteel || 0) + mission.reward.reinforcedSteel;
        if (mission.reward.cyberModule) save.cyberModule = (save.cyberModule || 0) + mission.reward.cyberModule;
        if (mission.reward.syntheticNanites) save.syntheticNanites = (save.syntheticNanites || 0) + mission.reward.syntheticNanites;
        if (mission.reward.aiFragment) save.aiFragment = (save.aiFragment || 0) + mission.reward.aiFragment;

        if (mission.reward.exploration) {
            if (typeof onExplorationMissionComplete === "function") {
                onExplorationMissionComplete();
            }
        }
    }

    localStorage.setItem("cosmicSave", JSON.stringify(save));

    // Expérience : même système que combat.js, stockée dans GameData.xp
    // (pas dans cosmicSave) et persistée via saveGame().
    if (mission && mission.reward && mission.reward.xp && typeof GameData !== "undefined") {
        GameData.xp = (GameData.xp || 0) + mission.reward.xp;
    }
    if (typeof saveGame === "function") saveGame();

    updateHUD?.();
    updateRessourcesPage?.();

    const xpGained = mission?.reward?.xp;
    const logText = mission
        ? `Mission "${mission.name}" terminée : récompense obtenue${xpGained ? ` (+${xpGained} XP)` : ""}`
        : "Mission terminée : récompense obtenue";

    localStorage.setItem(MISSION_LAST_LOG_KEY, logText);
    missionStatus.textContent = "Une mission vient de se terminer.";
}

/* =====================================================
   Initialisation
===================================================== */
window.addEventListener("load", () => {
    const savedLog = localStorage.getItem(MISSION_LOG_TEXT_KEY);
    document.getElementById("missionLog").innerHTML =
        savedLog || "Aucune mission en cours.";

    renderMissionsList();

    const activeMissions = loadActiveMissions();
    if (activeMissions.length > 0) {
        updateMissionLogDisplay();
        startGlobalTimer();
    }
});