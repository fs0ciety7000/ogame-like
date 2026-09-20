/* =====================================================
   POPUP "ESPIONNER" — Affiche le profil d'un autre joueur
===================================================== */

const SPY_BUILDING_ORDER = [
    "extracteur_ferraille",
    "reacteur_instable",
    "extracteur_nanocomposants",
    "archives_fracturees",
    "atelier_reparation",
    "hangar_attaque",
    "hangar_defense"
];

function getSpyBuildingDisplayLevel(buildingsData, id) {
    const b = buildingsData?.[id];
    if (!b) return 0;

    // Cohérent avec profil.js : un bâtiment verrouillé affiche 0
    if (typeof b === "object" && b.unlocked === false) return 0;

    return (typeof b === "object" ? b.level : b) || 0;
}

async function openSpyModal(uid) {
    const db = window.firebaseDb;
    const { doc, getDoc } = window.firebaseFns;

    // Éviter d'ouvrir 2 popups en même temps
    closeSpyModal();

    try {
        const snap = await getDoc(doc(db, "players", uid));

        if (!snap.exists()) {
            alert("Impossible de récupérer les données de ce joueur.");
            return;
        }

        const data = snap.data();
        const pseudo = data.pseudo || "Joueur inconnu";
        const gameData = data.gameData || {};
        const xp = gameData.xp ?? 0;
        const rankLabel = getRankLabelFromXP(xp);

        // --- Bâtiments ---
        let buildingsHTML = "";
        SPY_BUILDING_ORDER.forEach(id => {
            const buildingInfo = (typeof buildings !== "undefined") ? buildings.find(b => b.id === id) : null;
            const name = buildingInfo ? buildingInfo.name : id;
            const level = getSpyBuildingDisplayLevel(gameData.buildings, id);

            buildingsHTML += `<li><span>${name}</span><span>${level} / 10</span></li>`;
        });

        // --- Unités ---
        let unitsHTML = "";
        if (typeof unitsData !== "undefined") {
            unitsData.forEach(unit => {
                const u = gameData.units?.[unit.id];
                const level = u?.level ?? 0;
                const count = u?.count ?? 0;

                unitsHTML += `<li><span>${unit.name}</span><span>Niv. ${level} — x${count}</span></li>`;
            });
        }

        // --- Construction de la popup ---
        const overlay = document.createElement("div");
        overlay.id = "spy-modal-overlay";

        overlay.innerHTML = `
            <div id="spy-modal">
                <button id="spy-modal-close" title="Fermer">✖</button>

                <h2>${pseudo}</h2>
                <p class="spy-rank">Rang : ${rankLabel}</p>
                <p class="spy-xp">${xp} XP</p>

                <div class="spy-section">
                    <h3>Bâtiments</h3>
                    <ul class="spy-list">${buildingsHTML}</ul>
                </div>

                <div class="spy-section">
                    <h3>Unités</h3>
                    <ul class="spy-list">${unitsHTML || "<li>Aucune unité</li>"}</ul>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Fermeture : croix ou clic en dehors de la boîte
        document.getElementById("spy-modal-close").addEventListener("click", closeSpyModal);
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeSpyModal();
        });

    } catch (error) {
        console.error("Erreur lors de l'espionnage :", error);
        alert("Une erreur est survenue lors de la récupération des données.");
    }
}

function closeSpyModal() {
    const existing = document.getElementById("spy-modal-overlay");
    if (existing) existing.remove();
}