/* =====================================================
   RANGS (réutilise la même logique que profil.js
   grâce au scope global partagé entre scripts classiques)
===================================================== */

// Si profil.js n'est pas chargé pour une raison ou une autre,
// on retombe sur une copie de secours pour éviter un crash.
const FALLBACK_RANK_LABELS = [
    "Non-classé",
    "Fer III", "Fer II", "Fer I",
    "Bronze III", "Bronze II", "Bronze I",
    "Argent III", "Argent II", "Argent I",
    "Or III", "Or II", "Or I",
    "Platine III", "Platine II", "Platine I",
    "Émeraude", "Diamant", "Master",
    "Challenger", "Elite"
];

const FALLBACK_RANK_THRESHOLDS = [
    0, 100, 300, 600, 1000, 1500, 2000,
    2600, 3300, 4000, 5000, 6500, 8000,
    10000, 13000, 16000, 20000, 26000,
    33000, 42000, 52000
];

function getRankLabelFromXP(xp) {
    const labels = typeof rankNames !== "undefined" ? rankNames : FALLBACK_RANK_LABELS;
    const thresholds = typeof rankThresholds !== "undefined" ? rankThresholds : FALLBACK_RANK_THRESHOLDS;

    let index = 0;
    for (let i = 0; i < thresholds.length; i++) {
        if (xp >= thresholds[i]) index = i;
    }

    return labels[index] ?? "Non-classé";
}

/* =====================================================
   Chargement des joueurs depuis Firestore
===================================================== */

async function initPlayers() {
    const container = document.getElementById("playersList");
    if (!container) return;

    container.innerHTML = "<p>Chargement des joueurs...</p>";

    const db = window.firebaseDb;
    const { collection, getDocs } = window.firebaseFns;
    const auth = window.firebaseAuth;

    let players = [];

    try {
        const snapshot = await getDocs(collection(db, "players"));

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const xp = data.gameData?.xp ?? 0;

            players.push({
                uid: docSnap.id,
                pseudo: data.pseudo || "Joueur inconnu",
                xp: xp
            });
        });

    } catch (error) {
        console.error("Erreur de chargement des joueurs :", error);
        container.innerHTML = "<p>Impossible de charger la liste des joueurs.</p>";
        return;
    }

    // Classement du plus haut XP au plus bas
    players.sort((a, b) => b.xp - a.xp);

    container.innerHTML = "";

    const currentUid = auth.currentUser?.uid;

    players.forEach(p => {
        const isSelf = p.uid === currentUid;

        const card = document.createElement("div");
        card.className = "player-card";

        card.innerHTML = `
            <div class="player-main">
                <span class="player-name">${p.pseudo}</span>
                <span class="player-rank">${getRankLabelFromXP(p.xp)}</span>
            </div>

            <div class="player-actions">
                <button class="btn-player attack" data-id="${p.uid}" data-action="attack" ${isSelf ? "disabled" : ""}>Attaquer</button>
                <button class="btn-player spy" data-id="${p.uid}" data-action="spy" ${isSelf ? "disabled" : ""}>Espionner</button>
            </div>
        `;

        container.appendChild(card);
    });

    if (players.length === 0) {
        container.innerHTML = "<p>Aucun joueur trouvé.</p>";
    }

    // Écouteur de clic sur les boutons (une seule fois, pas à chaque re-render)
    if (!container.dataset.listenerAttached) {
        container.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-player");
            if (!btn) return;

            const targetUid = btn.dataset.id;
            const action = btn.dataset.action;

            if (action === "spy") {
                openSpyModal(targetUid);
            } else if (action === "attack") {
                const playerCard = btn.closest(".player-card");
                const pseudo = playerCard?.querySelector(".player-name")?.textContent || "ce joueur";
                openAttackModal(targetUid, pseudo);
            }
        });

        container.dataset.listenerAttached = "true";
    }
}