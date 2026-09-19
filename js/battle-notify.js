/* =====================================================
   AFFICHAGE DES RAPPORTS DE COMBAT REÇUS
   (chargé après combat.js pour réutiliser son style de popup)
===================================================== */

function showDefenseReportPopup(report, onClose) {
    const outcomeLabel = {
        attacker_win: "Tu as perdu ce combat...",
        defender_win: "Attaque repoussée !",
        draw: "Match nul"
    }[report.outcome];

    const outcomeColor = {
        attacker_win: "#ff6b6b",
        defender_win: "#4aff9c",
        draw: "#ffd86b"
    }[report.outcome];

    let lootHTML = "<li>Aucune perte de ressources</li>";
    if (report.loot) {
        const emojiMap = {
            reinforcedSteel: "🛠️",
            cyberModule: "🧩",
            syntheticNanites: "🤖",
            aiFragment: "🧠"
        };
        const entries = Object.entries(report.loot).filter(([, v]) => v > 0);
        if (entries.length > 0) {
            lootHTML = entries.map(([res, val]) => `<li><span>${emojiMap[res] || ""} ${res}</span><span>-${val}</span></li>`).join("");
        }
    }

    const overlay = document.createElement("div");
    overlay.id = "combat-modal-overlay";
    overlay.className = "spy-overlay-style";

    overlay.innerHTML = `
        <div id="combat-modal" class="spy-modal-style">
            <button id="combat-modal-close" title="Fermer">✖</button>

            <h2 style="color:${outcomeColor}; text-shadow:0 0 10px ${outcomeColor};">${outcomeLabel}</h2>
            <p>Attaquant : <strong>${report.attackerPseudo}</strong></p>
            <p>Ta défense : ${Math.floor(report.defenderPower)} — Puissance reçue : ${Math.floor(report.attackerPower)}</p>

            <div class="spy-section">
                <h3>Tes pertes</h3>
                <ul class="spy-list">${buildLossListHTML(report.defenderLosses || {}, report.defenderRecovered)}</ul>
            </div>

            <div class="spy-section">
                <h3>Pertes infligées à l'attaquant</h3>
                <ul class="spy-list">${buildLossListHTML(report.attackerLosses || {}, report.attackerRecovered)}</ul>
            </div>

            <div class="spy-section">
                <h3>Ressources perdues</h3>
                <ul class="spy-list">${lootHTML}</ul>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
        overlay.remove();
        if (typeof onClose === "function") onClose();
    };

    document.getElementById("combat-modal-close").addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
    });
}

function showNextBattleNotification(queue) {
    if (queue.length === 0) return;

    const report = queue.shift();
    showDefenseReportPopup(report, () => showNextBattleNotification(queue));
}

// Traite la file d'attente remplie par battle-check.js (au chargement)
window.addEventListener("battleReportsReady", () => {
    const queue = window.pendingBattleNotifications || [];
    window.pendingBattleNotifications = [];
    showNextBattleNotification(queue);
});