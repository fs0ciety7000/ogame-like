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

function applyDefenderLossesAndLoot(losses, loot) {
    // Pertes d'unités
    for (const unitId in losses) {
        if (GameData.units[unitId]) {
            GameData.units[unitId].count = Math.max(0, (GameData.units[unitId].count || 0) - losses[unitId]);
        }
    }
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

function notifyPlayerOfAttack(report) {
    const lines = [`Tu as été attaqué par ${report.attackerPseudo} !`];

    const outcomeText = {
        attacker_win: "Tu as perdu ce combat.",
        defender_win: "Tu as repoussé l'attaque !",
        draw: "Match nul."
    }[report.outcome];

    lines.push(outcomeText);

    if (report.loot) {
        const stolen = Object.entries(report.loot).filter(([, v]) => v > 0);
        if (stolen.length > 0) {
            lines.push("Ressources volées : " + stolen.map(([res, val]) => `${val} ${res}`).join(", "));
        }
    }

    alert(lines.join("\n"));
}

async function checkPendingBattleReports() {
    const currentUser = await waitForUserBC();
    if (!currentUser) return;

    try {
        const q = query(
            collection(db, "battle_reports"),
            where("defenderUid", "==", currentUser.uid),
            where("defenderProcessed", "==", false)
        );

        const snapshot = await getDocs(q);

        for (const reportDoc of snapshot.docs) {
            const report = reportDoc.data();

            applyDefenderLossesAndLoot(report.defenderLosses || {}, report.loot);
            notifyPlayerOfAttack(report);

            // Marquer comme traité pour ne pas le réappliquer au prochain chargement
            await setDoc(doc(db, "battle_reports", reportDoc.id), { defenderProcessed: true }, { merge: true });
        }

        if (snapshot.docs.length > 0 && typeof window.forceCloudSync === "function") {
            window.forceCloudSync();
        }

    } catch (error) {
        console.error("Erreur lors de la vérification des rapports de combat :", error);
    }
}

await checkPendingBattleReports();