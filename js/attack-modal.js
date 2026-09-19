/* =====================================================
   POPUP DE SÉLECTION DE FLOTTE (avant attaque)
===================================================== */

function openAttackModal(targetUid, targetPseudo) {
    const existing = document.getElementById("attack-modal-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "attack-modal-overlay";
    overlay.className = "spy-overlay-style";

    let rowsHTML = "";
    COMBAT_OFFENSIVE_UNITS.forEach(unitId => {
        const owned = GameData.units[unitId]?.count ?? 0;
        const name = getUnitDisplayName(unitId);

        rowsHTML += `
            <div class="fleet-row">
                <span class="fleet-unit-name">${name}</span>
                <span class="fleet-unit-owned">Possédés : ${owned}</span>
                <input
                    type="number"
                    class="fleet-qty-input"
                    id="fleet-qty-${unitId}"
                    min="0"
                    max="${owned}"
                    value="0"
                    ${owned === 0 ? "disabled" : ""}
                >
            </div>
        `;
    });

    overlay.innerHTML = `
        <div id="attack-modal" class="spy-modal-style">
            <button id="attack-modal-close" title="Fermer">✖</button>

            <h2>Envoyer une flotte</h2>
            <p>Cible : <strong>${targetPseudo}</strong></p>

            <div class="spy-section">
                <div class="fleet-list">
                    ${rowsHTML}
                </div>
            </div>

            <button id="attack-modal-confirm" class="fleet-confirm-btn">Lancer l'attaque</button>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("attack-modal-close").addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.getElementById("attack-modal-confirm").addEventListener("click", () => {
        const fleet = {};
        let total = 0;

        COMBAT_OFFENSIVE_UNITS.forEach(unitId => {
            const input = document.getElementById(`fleet-qty-${unitId}`);
            const qty = input ? parseInt(input.value) || 0 : 0;
            const owned = GameData.units[unitId]?.count ?? 0;

            const clamped = Math.max(0, Math.min(qty, owned));
            if (clamped > 0) {
                fleet[unitId] = clamped;
                total += clamped;
            }
        });

        if (total === 0) {
            alert("Sélectionne au moins une unité à envoyer.");
            return;
        }

        overlay.remove();
        initiateAttack(targetUid, targetPseudo, fleet);
    });
}