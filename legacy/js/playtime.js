/* =====================================================
   TEMPS DE JEU
===================================================== */

/* =====================================================
   Initialisation (au chargement de la page)
===================================================== */
function initPlaytime() {
    let save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    save.playtimeSeconds = save.playtimeSeconds || 0;
    localStorage.setItem("cosmicSave", JSON.stringify(save));

    updatePlaytimeDisplay(save.playtimeSeconds);
}

/* =====================================================
   Tick : +1 seconde de jeu, à chaque seconde réelle
===================================================== */
function tickPlaytime() {
    let save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    save.playtimeSeconds = (save.playtimeSeconds || 0) + 1;
    localStorage.setItem("cosmicSave", JSON.stringify(save));

    updatePlaytimeDisplay(save.playtimeSeconds);
}

/* =====================================================
   Affichage (format : Xh YYm)
===================================================== */
function updatePlaytimeDisplay(totalSeconds) {
    const el = document.getElementById("playtime");
    if (!el) return; // page profil pas affichée, pas grave

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    el.textContent = `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

// Tick toutes les secondes, peu importe la page affichée
setInterval(tickPlaytime, 1000);

// Initialisation au chargement du dashboard
window.addEventListener("load", initPlaytime);