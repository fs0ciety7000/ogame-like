// =======================================
// TRAITEMENT DES RAPPORTS DE COMBAT REÇUS
// =======================================

const auth = window.firebaseAuth;
const db = window.firebaseDb;
const { onAuthStateChanged, collection, query, where, getDocs, doc, setDoc } = window.firebaseFns;

function waitForUserBC() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

function applyDefenderLossesAndLoot(losses, loot, outcome) {
    // Pertes d'unités
    for (const unitId in losses) {
        if (GameData.units[unitId]) {
            GameData.units[unitId].count = Math.max(0, (GameData.units[unitId].count || 0) - losses[unitId]);
        }
    }

    // --- XP et statistiques (côté défenseur) ---
    if (outcome === "defender_win") {
        GameData.victories = (GameData.victories || 0) + 1;
        GameData.xp = (GameData.xp || 0) + 40;
    } else if (outcome === "attacker_win") {
        GameData.defeats = (GameData.defeats || 0) + 1;
        GameData.xp = Math.max(0, (GameData.xp || 0) - 20);
    }
    // draw : aucun changement

    if (typeof saveGame === "function") saveGame();

    // Ressources volées
    if (loot) {
        let save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
        for (const res in loot) {
            save[res] = Math.max(0, (save[res] || 0) - loot[res]);
        }
        localStorage.setItem("cosmicSave", JSON.stringify(save));
    }

    if (typeof updateHUD === "function") updateHUD();
    if (typeof updateRessourcesPage === "function") updateRessourcesPage();
}

function queueBattleNotification(report) {
    window.pendingBattleNotifications = window.pendingBattleNotifications || [];
    window.pendingBattleNotifications.push(report);
}

async function checkPendingBattleReports() {
    const currentUser = await waitForUserBC();
    if (!currentUser) {
        console.log("[battle-check] Aucun utilisateur connecté.");
        window.dispatchEvent(new CustomEvent("battleReportsReady"));
        return;
    }

    console.log("[battle-check] Recherche des rapports pour uid :", currentUser.uid);

    try {
        const q = query(
            collection(db, "battle_reports"),
            where("defenderUid", "==", currentUser.uid),
            where("defenderProcessed", "==", false)
        );

        const snapshot = await getDocs(q);

        console.log("[battle-check] Rapports trouvés :", snapshot.docs.length);

        for (const reportDoc of snapshot.docs) {
            const report = reportDoc.data();
            console.log("[battle-check] Traitement du rapport :", reportDoc.id, report);

            applyDefenderLossesAndLoot(report.defenderLosses || {}, report.loot, report.outcome);
            queueBattleNotification(report);

            // Marquer comme traité pour ne pas le réappliquer au prochain chargement
            await setDoc(doc(db, "battle_reports", reportDoc.id), { defenderProcessed: true }, { merge: true });
        }

        console.log("[battle-check] File d'attente après traitement :", window.pendingBattleNotifications);

        if (snapshot.docs.length > 0 && typeof window.forceCloudSync === "function") {
            window.forceCloudSync();
        }

    } catch (error) {
        console.error("[battle-check] Erreur lors de la vérification des rapports de combat :", error);
    } finally {
        window.dispatchEvent(new CustomEvent("battleReportsReady"));
    }
}

await checkPendingBattleReports();