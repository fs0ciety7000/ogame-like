// ===============================
// IMAGE PAR NIVEAU
// ===============================

function getBuildingImage(buildingId, level) {
    const b = buildings.find(x => x.id === buildingId);
    
    // Sécurité : si pas d'image définie, on met une image par défaut ou vide
    if (!b || !b.imageBase) {
        return "assets/buildings/default.png"; // Image de secours
    }

    // Version simple : Une seule image pour tous les niveaux (plus facile au début)
    // return `${b.imageBase}.png`; 
    
    // Version avancée (la tienne) : Une image par niveau (ex: mine_lvl1.png)
    return `${b.imageBase}_lvl${level}.png`;
}


// ===============================
// REMPLISSAGE DES SLOTS
// ===============================

const slots = document.querySelectorAll(".slot");

slots.forEach((slot, index) => {
    const b = buildings[index];

    if (!b) {
        slot.classList.add("empty");
        slot.textContent = "Emplacement vide";
        return;
    }

    // On récupère le niveau depuis GameData
    const level = GameData.buildings[b.id]?.level || 1;

    slot.innerHTML = `
        <div class="building-card">
           <img 
    src="${getBuildingImage(b.id, level)}" 
    class="building-image" 
    alt="${b.name}" 
    onerror="this.onerror=null; this.src='https://placehold.co/100x100?text=Image+Manquante';"
>
            <div class="building-name">${b.name}</div>
            <div class="building-description">${b.description}</div>
            <div class="building-level">Niveau : <span class="lvl-val">${level}</span> / ${b.maxLevel}</div>
            
            <div class="building-bonus">
                 ${b.production ? `Production : ${b.production.base * level}/s` : "Pas de production"}
            </div>

            <div class="building-cost">Coût : ${b.cost.scrap} ferraille, ${b.cost.energy} énergie</div>
            <div class="building-time">Temps : 1s</div> <button class="building-button">Améliorer</button>
        </div>
    `;

    const button = slot.querySelector(".building-button");

    // Désactiver le bouton si déjà au niveau max
    if (level >= b.maxLevel) {
        button.disabled = true;
        button.textContent = "Niveau max";
    }

    button.addEventListener("click", () => {
        // Vérifier le niveau max
        if (GameData.buildings[b.id].level >= b.maxLevel) return;

        // On utilise la fonction globale spendResource (définie dans gameData.js)
        if (spendResource("scrap", b.cost.scrap) && spendResource("energy", b.cost.energy)) {

            GameData.buildings[b.id].level++;
            saveGame(); // Fonction globale de gameData.js

            const newLevel = GameData.buildings[b.id].level;

            // Mise à jour visuelle locale
            slot.querySelector(".lvl-val").textContent = newLevel;
            slot.querySelector(".building-image").src = getBuildingImage(b.id, newLevel);
            
            // Mise à jour de la production affichée si nécessaire
            if(b.production) {
                slot.querySelector(".building-bonus").textContent = `Production : ${b.production.base * newLevel}/s`;
            }

            // Gestion niveau max
            if (newLevel >= b.maxLevel) {
                button.disabled = true;
                button.textContent = "Niveau max";
            }
        } else {
            alert("Pas assez de ressources !");
        }
    });
});