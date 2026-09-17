/* =====================================================
   SYSTÈME DE COMBAT
===================================================== */

const COMBAT_OFFENSIVE_UNITS = ["drone_recuperateur", "fregate", "sentinelle", "cargo", "chasseur", "etoile_noire"];
const COMBAT_DEFENSIVE_UNITS = ["roquette", "canon_impulsion", "canon_plasma", "batterie_aa", "intercepteur"];

// Copie de secours si UNIT_BASE_STATS (labo.js) n'est pas chargé pour une raison ou une autre
const COMBAT_FALLBACK_BASE_STATS = {
    drone_recuperateur: { attack: 0, defense: 5 },
    fregate: { attack: 15, defense: 20 },
    cargo: { attack: 0, defense: 10 },
    sentinelle: { attack: 5, defense: 30 },
    chasseur: { attack: 40, defense: 10 },
    etoile_noire: { attack: 500, defense: 500 },
    roquette: { attack: 15, defense: 0 },
    canon_impulsion: { attack: 80, defense: 10 },
    canon_plasma: { attack: 100, defense: 20 },
    batterie_aa: { attack: 10, defense: 60 },
    intercepteur: { attack: 60, defense: 15 }
};

function combatUnitStat(unitsObj, unitId, statName) {
    const baseTable = (typeof UNIT_BASE_STATS !== "undefined") ? UNIT_BASE_STATS : COMBAT_FALLBACK_BASE_STATS;
    const base = baseTable[unitId]?.[statName] ?? 0;
    const level = unitsObj?.[unitId]?.level ?? 0;

    if (level <= 0) return 0;
    return base + (level - 1) * 5;
}

function computeCombatPower(unitsObj, idList, statNames) {
    let total = 0;

    idList.forEach(id => {
        const count = unitsObj?.[id]?.count ?? 0;
        let value = 0;
        statNames.forEach(stat => { value += combatUnitStat(unitsObj, id, stat); });
        total += value * count;
    });

    return total;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

/* =====================================================
   Lancer une attaque contre un autre joueur
===================================================== */
async function initiateAttack(targetUid, targetPseudoFallback) {
    const auth = window.firebaseAuth;
    const db = window.firebaseDb;
    const { doc, getDoc, setDoc, collection, serverTimestamp } = window.firebaseFns;

    const currentUser = auth.currentUser;
    if (!currentUser) return;

    if (targetUid === currentUser.uid) {
        alert("Tu ne peux pas t'attaquer toi-même !");
        return;
    }

    let defenderSnap, mySnap;
    try {
        defenderSnap = await getDoc(doc(db, "players", targetUid));
        mySnap = await getDoc(doc(db, "players", currentUser.uid));
    } catch (e) {
        console.error(e);
        alert("Impossible de récupérer les données nécessaires au combat.");
        return;
    }

    if (!defenderSnap.exists()) {
        alert("Ce joueur est introuvable.");
        return;
    }

    const myPseudo = mySnap.exists() ? (mySnap.data().pseudo || "Toi") : "Toi";

    const defenderData = defenderSnap.data();
    const defenderGame = defenderData.gameData || {};
    const defenderUnits = defenderGame.units || {};
    const defenderPseudo = defenderData.pseudo || targetPseudoFallback || "Joueur inconnu";

    const attackerUnits = GameData.units;

    // --- Calcul des puissances ---
    const attackerPower = computeCombatPower(attackerUnits, COMBAT_OFFENSIVE_UNITS, ["attack"]);
    const defenderPower = computeCombatPower(defenderUnits, COMBAT_DEFENSIVE_UNITS, ["attack", "defense"]);

    const totalPower = attackerPower + defenderPower;
    const diffRatio = totalPower > 0 ? Math.abs(attackerPower - defenderPower) / totalPower : 0;

    let outcome;
    if (attackerPower > defenderPower) outcome = "attacker_win";
    else if (attackerPower < defenderPower) outcome = "defender_win";
    else outcome = "draw";

    const winnerLossPct = clamp(0.30 * (1 - diffRatio), 0.05, 0.30);
    const loserLossPct = clamp(0.30 + 0.40 * diffRatio, 0.30, 0.70);

    let attackerLossPct, defenderLossPct;
    if (outcome === "attacker_win") {
        attackerLossPct = winnerLossPct;
        defenderLossPct = loserLossPct;
    } else if (outcome === "defender_win") {
        attackerLossPct = loserLossPct;
        defenderLossPct = winnerLossPct;
    } else {
        attackerLossPct = 0.30;
        defenderLossPct = 0.30;
    }

    // --- Pertes attaquant (appliquées immédiatement, c'est son propre compte) ---
    const attackerLosses = {};
    COMBAT_OFFENSIVE_UNITS.forEach(id => {
        const count = attackerUnits[id]?.count ?? 0;
        const lost = Math.floor(count * attackerLossPct);
        if (lost > 0) {
            attackerLosses[id] = lost;
            attackerUnits[id].count = Math.max(0, count - lost);
        }
    });

    // --- Pertes défenseur (calculées ici, appliquées plus tard par son propre client) ---
    const defenderLosses = {};
    COMBAT_DEFENSIVE_UNITS.forEach(id => {
        const count = defenderUnits[id]?.count ?? 0;
        const lost = Math.floor(count * defenderLossPct);
        if (lost > 0) {
            defenderLosses[id] = lost;
        }
    });

    // --- Butin (seulement en cas de victoire nette de l'attaquant) ---
    let loot = null;
    if (outcome === "attacker_win") {
        const LOOT_PERCENT = 0.12;
        loot = {};
        ["scrap", "energy", "nano", "data"].forEach(res => {
            const available = defenderGame[res] ?? 0;
            loot[res] = Math.floor(available * LOOT_PERCENT);
        });
    }

    // --- Application immédiate côté attaquant ---
    if (typeof saveGame === "function") saveGame();

    if (loot) {
        let mySave = JSON.parse(localStorage.getItem("cosmicSave")) || {};
        for (const res in loot) {
            mySave[res] = (mySave[res] || 0) + loot[res];
        }
        localStorage.setItem("cosmicSave", JSON.stringify(mySave));
    }

    if (typeof updateHUD === "function") updateHUD();
    if (typeof updateRessourcesPage === "function") updateRessourcesPage();
    if (typeof window.forceCloudSync === "function") window.forceCloudSync();

    // --- Écriture du rapport de combat pour le défenseur ---
    try {
        const reportRef = doc(collection(db, "battle_reports"));
        await setDoc(reportRef, {
            attackerUid: currentUser.uid,
            attackerPseudo: myPseudo,
            defenderUid: targetUid,
            defenderPseudo: defenderPseudo,
            timestamp: serverTimestamp(),
            outcome: outcome,
            attackerPower,
            defenderPower,
            attackerLossPercent: attackerLossPct,
            defenderLossPercent: defenderLossPct,
            attackerLosses,
            defenderLosses,
            loot: loot || null,
            defenderProcessed: false
        });
    } catch (e) {
        console.error("Erreur lors de l'écriture du rapport de combat :", e);
    }

    showCombatResultPopup({
        defenderPseudo,
        outcome,
        attackerPower,
        defenderPower,
        attackerLosses,
        defenderLosses,
        loot
    });
}

/* =====================================================
   Popup de résultat de combat
===================================================== */
function getUnitDisplayName(unitId) {
    if (typeof unitsData !== "undefined") {
        const u = unitsData.find(u => u.id === unitId);
        if (u) return u.name;
    }
    return unitId;
}

function buildLossListHTML(losses) {
    const entries = Object.entries(losses);
    if (entries.length === 0) return "<li>Aucune perte</li>";

    return entries.map(([id, count]) => `<li><span>${getUnitDisplayName(id)}</span><span>-${count}</span></li>`).join("");
}

function showCombatResultPopup(result) {
    const existing = document.getElementById("combat-modal-overlay");
    if (existing) existing.remove();

    const outcomeLabel = {
        attacker_win: "Victoire !",
        defender_win: "Défaite...",
        draw: "Match nul"
    }[result.outcome];

    const outcomeColor = {
        attacker_win: "#4aff9c",
        defender_win: "#ff6b6b",
        draw: "#ffd86b"
    }[result.outcome];

    let lootHTML = "<li>Aucun butin</li>";
    if (result.loot) {
        const emojiMap = { scrap: "🔩", energy: "⚡", nano: "🧬", data: "📡" };
        const entries = Object.entries(result.loot).filter(([, v]) => v > 0);
        if (entries.length > 0) {
            lootHTML = entries.map(([res, val]) => `<li><span>${emojiMap[res] || ""} ${res}</span><span>+${val}</span></li>`).join("");
        }
    }

    const overlay = document.createElement("div");
    overlay.id = "combat-modal-overlay";
    overlay.className = "spy-overlay-style";

    overlay.innerHTML = `
        <div id="combat-modal" class="spy-modal-style">
            <button id="combat-modal-close" title="Fermer">✖</button>

            <h2 style="color:${outcomeColor}; text-shadow:0 0 10px ${outcomeColor};">${outcomeLabel}</h2>
            <p>Contre : <strong>${result.defenderPseudo}</strong></p>
            <p>Ta puissance : ${Math.floor(result.attackerPower)} — Défense adverse : ${Math.floor(result.defenderPower)}</p>

            <div class="spy-section">
                <h3>Tes pertes</h3>
                <ul class="spy-list">${buildLossListHTML(result.attackerLosses)}</ul>
            </div>

            <div class="spy-section">
                <h3>Pertes adverses (à venir chez lui)</h3>
                <ul class="spy-list">${buildLossListHTML(result.defenderLosses)}</ul>
            </div>

            <div class="spy-section">
                <h3>Butin</h3>
                <ul class="spy-list">${lootHTML}</ul>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("combat-modal-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });
}