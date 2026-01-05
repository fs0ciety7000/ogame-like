/* =====================================================
   Définition des missions disponibles
===================================================== */
const MISSIONS = {
    exploration: {
        key: "exploration",
        name: "Exploration",
        duration: 300, // 5 minutes
        reward: { scrap: 1000 },
        prereq: { drones: 5 }
    },

    reconnaissance: {
        key: "reconnaissance",
        name: "Reconnaissance",
        duration: 120, // 2 minutes
        reward: { data: 50 },
        prereq: { drones: 3 }
    },

    sauvetage: {
        key: "sauvetage",
        name: "Sauvetage",
        duration: 600, // 10 minutes
        reward: { nano: 20 },
        prereq: { drones: 8 }
    },

    exploration_galactique: {
        key: "exploration_galactique",
        name: "Exploration Galactique",
        duration: 10, // 5 minutes
        reward: { exploration: true }, // récompense spéciale
        prereq: { drones: 5 }
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
   Vérification des prérequis pour une mission
===================================================== */
function hasPrerequisites(missionKey) {
    const mission = MISSIONS[missionKey];
    if (!mission) return false;

    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    const drones = save.droneCount || 0;

    return drones >= (mission.prereq.drones || 0);
}

/* =====================================================
   Vérifier si une mission est déjà active
===================================================== */
function isMissionActive(missionKey, activeList) {
    return activeList.some(m => m.key === missionKey);
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

        let rewardText = [];

        if (mission.reward) {
            if (mission.reward.scrap) rewardText.push(`${mission.reward.scrap} Ferraille`);
            if (mission.reward.energy) rewardText.push(`${mission.reward.energy} Énergie`);
            if (mission.reward.nano) rewardText.push(`${mission.reward.nano} Nano‑composants`);
            if (mission.reward.data) rewardText.push(`${mission.reward.data} Données anciennes`);
            if (mission.reward.exploration) rewardText.push(`Révélation d’un secteur galactique`);
        }

        if (rewardText.length === 0) {
            rewardText.push("Aucune récompense directe");
        }

        div.innerHTML = `
            <p><strong>${mission.name}</strong></p>
            <p>Durée : ${Math.floor(mission.duration / 60)} minutes</p>
            <p>Pré‑requis : ${mission.prereq.drones || 0} Drones récupérateurs</p>
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
            btn.disabled = false;
            btn.textContent = "Lancer la mission";
            btn.addEventListener("click", () => {
                startMission(mission.key);
            });
        }

        container.appendChild(div);
    }

    if (activeMissions.length > 0) {
        missionStatus.textContent = "Missions en cours.";
    } else {
        missionStatus.textContent = "";
    }
}

/* =====================================================
   Mise à jour du journal de mission
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
    const lines = activeMissions.map(m => {
        const mission = MISSIONS[m.key];
        const remaining = Math.floor((m.endTime - now) / 1000);
        return `Mission "${mission.name}" en cours : ${formatTime(remaining)}`;
    });

    missionLog.innerHTML = lines.join("<br>");
    localStorage.setItem(MISSION_LOG_TEXT_KEY, missionLog.innerHTML);
}

/* =====================================================
   Lancement d'une mission
===================================================== */
function startMission(missionKey) {
    const mission = MISSIONS[missionKey];
    if (!mission) return;

    let activeMissions = loadActiveMissions();

    if (isMissionActive(missionKey, activeMissions)) {
        return;
    }

    const endTime = Date.now() + mission.duration * 1000;

    activeMissions.push({
        key: missionKey,
        endTime: endTime
    });

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

    globalMissionTimer = setInterval(() => {
        tickMissions();
    }, 1000);
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
        if (mission.reward.scrap) save.scrap = (save.scrap || 0) + mission.reward.scrap;
        if (mission.reward.energy) save.energy = (save.energy || 0) + mission.reward.energy;
        if (mission.reward.nano) save.nano = (save.nano || 0) + mission.reward.nano;
        if (mission.reward.data) save.data = (save.data || 0) + mission.reward.data;

        /* --- NOUVEAU : marquer la révélation à faire sur la carte --- */
        if (mission.reward.exploration) {
            try {
                localStorage.setItem("pendingExplorationReveal", "1");
            } catch (e) {
                console.warn("Impossible de marquer la révélation d'exploration :", e);
             }
           
        }
    }

    localStorage.setItem("cosmicSave", JSON.stringify(save));

    const logText = mission
        ? `Mission "${mission.name}" terminée : récompense obtenue`
        : "Mission terminée : récompense obtenue";

    localStorage.setItem(MISSION_LAST_LOG_KEY, logText);
    missionStatus.textContent = "Une mission vient de se terminer.";
}




/* =====================================================
   Initialisation
===================================================== */
window.addEventListener("load", () => {
    const savedLog = localStorage.getItem(MISSION_LOG_TEXT_KEY);
    if (savedLog) {
        document.getElementById("missionLog").innerHTML = savedLog;
    } else {
        document.getElementById("missionLog").innerHTML = "Aucune mission en cours.";
    }

    renderMissionsList();

    const activeMissions = loadActiveMissions();
    if (activeMissions.length > 0) {
        updateMissionLogDisplay();
        startGlobalTimer();
    }
});
