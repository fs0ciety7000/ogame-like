// ============================
// TECHNOLOGIES MULTI‑NIVEAUX
// ============================

// PREREQ = prérequis sous forme d'objet { techId: niveauRequis, ... } 


const technologies = [
    // --- PALIER 1 : Fondations (Aucun prérequis) ---
    {
        id: "tech1",
        nom: "Analyse de matériaux",
        desc: "Débloque de nouvelles recettes dans le laboratoire.",
        maxLevel: 18,
        baseCost: { scrap: 100, energy: 20 },
        baseTime: 30,
        effect: "unlock_recipe",
        // Cette techno monte jusqu'au niveau 18 (au lieu de 10 pour la plupart
        // des autres) : elle a besoin de son propre facteur de coût pour ne
        // pas devenir absurde trop tôt, tout en finissant autour de 6-7M.
        costGrowth: 1.92,
        prereq: {} 
    },
    {
        id: "tech3",
        nom: "Amélioration énergétique",
        desc: "Augmente l'efficacité des générateurs.",
        maxLevel: 10,
        baseCost: { scrap: 150, energy: 50 },
        baseTime: 45,
        effect: "energy_efficiency",
        prereq: {}
    },

    // --- PALIER 2 : Logistique et bases militaires ---
    {
        id: "tech9",
        nom: "Drone récupérateur",
        desc: "Augmente la puissance d'attaque de l'unité.",
        maxLevel: 10,
        baseCost: { scrap: 200, reinforcedSteel: 20 },
        baseTime: 70,
        effect: "unlock_next_level",
        prereq: { tech1: 1 }
    },
    {
        id: "tech2",
        nom: "Blindage avancé",
        desc: "Renforce la résistance des unités terrestres.",
        maxLevel: 10,
        baseCost: { scrap: 300, nano: 50 },
        baseTime: 60,
        effect: "unit_defense",
        prereq: { tech1: 3 }
    },
    {
        id: "tech5",
        nom: "Puissance d'attaque",
        desc: "Augmente la puissance d'attaque de toutes les unités.",
        maxLevel: 10,
        baseCost: { energy: 200, nano: 100 },
        baseTime: 50,
        effect: "unit_attack",
        prereq: { tech1: 2, tech3: 2 }
    },
    {
        id: "tech4",
        nom: "Optimisation industrielle",
        desc: "Réduit le coût des améliorations de bâtiments.",
        maxLevel: 10,
        baseCost: { scrap: 400, data: 50 },
        baseTime: 90,
        effect: "building_discount",
        prereq: { tech1: 5, tech3: 4 }
    },

    // --- PALIER 3 : Conquête spatiale ---
    {
        id: "tech6",
        nom: "Infrastructure spatiale",
        desc: "Débloque les hangars orbitaux.",
        maxLevel: 1,
        baseCost: { scrap: 800, energy: 400, nano: 200 },
        baseTime: 120,
        effect: "unlock_hangars",
        prereq: { tech4: 3, tech3: 5 }
    },
    {
        id: "tech11",
        nom: "Cargo",
        desc: "Augmente la puissance d'attaque de l'unité.",
        maxLevel: 10,
        baseCost: { scrap: 300, syntheticNanites: 50 },
        baseTime: 70,
        effect: "unlock_next_level",
        prereq: { tech9: 3, tech6: 1 }
    },
    {
        id: "tech10",
        nom: "Frégate",
        desc: "Augmente la puissance d'attaque de l'unité.",
        maxLevel: 10,
        baseCost: { scrap: 400, energy: 100, cyberModule: 100 },
        baseTime: 70,
        effect: "unlock_next_level",
        prereq: { tech1: 3, tech3: 2 }
    },
    {
        id: "tech14",
        nom: "Roquette",
        desc: "Augmente la puissance d'attaque de l'unité.",
        maxLevel: 10,
        baseCost: { scrap: 250, nano: 80 },
        baseTime: 70,
        effect: "unlock_next_level",
        prereq: { tech8: 1, tech2: 4 }
    },

    // --- PALIER 4 : Spécialisation et Défense Lourde ---
    {
        id: "tech8",
        nom: "Systèmes défensifs",
        desc: "Débloque les unités de défense renforcées.",
        maxLevel: 4,
        baseCost: { scrap: 500, nano: 200, data: 100 },
        baseTime: 70,
        effect: "unlock_defense_units",
        prereq: { tech1: 2, tech3: 2 }
    },
    {
        id: "tech7",
        nom: "Armes expérimentales",
        desc: "Débloque les unités d'attaque avancées.",
        maxLevel: 5,
        baseCost: { energy: 600, nano: 300, data: 150 },
        baseTime: 75,
        effect: "unlock_attack_units",
        prereq: { tech5: 6, tech1: 8 }
    },
    {
        id: "tech12",
        nom: "Sentinelle",
        desc: "Augmente la puissance d'attaque de l'unité.",
        maxLevel: 10,
        baseCost: { scrap: 400, syntheticNanites: 150, cyberModule: 50 },
        baseTime: 70,
        effect: "unlock_next_level",
        prereq: { tech8: 1, tech2: 6 }
    },
    {
        id: "tech17",
        nom: "Batterie Anti-aérienne",
        desc: "Augmente la puissance d'attaque de l'unité.",
        maxLevel: 10,
        baseCost: { scrap: 500, syntheticNanites: 200, nano: 150 },
        baseTime: 70,
        effect: "unlock_next_level",
        prereq: { tech8: 2, tech14: 5 }
    },
    {
        id: "tech13",
        nom: "Chasseur",
        desc: "Augmente la puissance d'attaque de l'unité.",
        maxLevel: 10,
        baseCost: { scrap: 600, energy: 300, syntheticNanites: 250 },
        baseTime: 70,
        effect: "unlock_next_level",
        prereq: { tech10: 5, tech7: 1 }
    },
    {
        id: "tech15",
        nom: "Canon à impulsion",
        desc: "Augmente la puissance d'attaque de l'unité.",
        maxLevel: 10,
        baseCost: { energy: 800, nano: 400, syntheticNanites: 200 },
        baseTime: 70,
        effect: "unlock_next_level",
        prereq: { tech7: 2, tech3: 7 }
    },

    // --- PALIER 5 : Élite ---
    {
        id: "tech16",
        nom: "Canon plasma",
        desc: "Augmente la puissance d'attaque de l'unité.",
        maxLevel: 10,
        baseCost: { energy: 1200, nano: 600, data: 300, aiFragment: 50 },
        baseTime: 70,
        effect: "unlock_next_level",
        prereq: { tech15: 5, tech7: 4 }
    },
    {
        id: "tech18",
        nom: "Intercepteur",
        desc: "Augmente la puissance d'attaque de l'unité.",
        maxLevel: 10,
        baseCost: { scrap: 1000, syntheticNanites: 500, data: 400, aiFragment: 100 },
        baseTime: 70,
        effect: "unlock_next_level",
        prereq: { tech13: 5, tech16: 2 }
    },
    {
    id: "tech19",
    nom: "Étoile noire",
    desc: "Arme ultime. Capacité de destruction massive.",
    maxLevel: 10,
    baseCost: { reinforcedSteel: 1000, syntheticNanites: 1000, cyberModule: 1000, aiFragment: 1000 },
    baseTime: 70,
    effect: "unlock_next_level",
    prereq: { tech18: 5, tech16: 5 }
}
];

// ============================
// SÉLECTEURS
// ============================

const techGrid = document.getElementById("techGrid");
const infoBox = document.getElementById("infoBox");

// Tech actuellement affichée dans le panneau de détails (pour rafraîchir
// son affichage quand sa recherche se termine, même si l'utilisateur a
// lancé d'autres recherches en parallèle).
let currentInfoTechId = null;

// ============================
// FILE DE RECHERCHES (jusqu'à 4 en parallèle)
// ============================

const MAX_CONCURRENT_RESEARCH = 4;
const ACTIVE_RESEARCH_KEY = "activeResearches";

function loadActiveResearches() {
    return JSON.parse(localStorage.getItem(ACTIVE_RESEARCH_KEY)) || [];
}

function saveActiveResearches(list) {
    localStorage.setItem(ACTIVE_RESEARCH_KEY, JSON.stringify(list));
}

function isResearchActive(techId, list) {
    return list.some(r => r.id === techId);
}

// ============================
// CHARGER / SAUVER NIVEAUX
// ============================

function loadTechLevels() {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    if (!save.techLevels) save.techLevels = {};
    technologies.forEach(t => {
        if (save.techLevels[t.id] === undefined) save.techLevels[t.id] = 0;
    });
    localStorage.setItem("cosmicSave", JSON.stringify(save));
    return save.techLevels;
}

function saveTechLevels(levels) {
    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    save.techLevels = levels;
    localStorage.setItem("cosmicSave", JSON.stringify(save));
}

// ============================
// CALCUL COÛT / TEMPS NIVEAU
// ============================


// Ajout du calcul pour chaque ressource individuellement

// Facteurs de croissance par niveau (calibrés pour qu'un niveau 10 sur une
// techno "unité" classique - baseTime ~70s, baseCost ~400 - atteigne environ
// 2h de temps et plusieurs millions de ressources).
const COST_GROWTH = 2.7;
const TIME_GROWTH = 1.67;

function getCost(tech, level) {
    const growth = tech.costGrowth || COST_GROWTH;
    const factor = Math.pow(growth, level - 1);
    let scaledCost = {};
    
    for (const [res, amount] of Object.entries(tech.baseCost)) {
        scaledCost[res] = Math.floor(amount * factor);
    }
    
    return scaledCost;
}

function getTime(tech, level) {
    return Math.floor(tech.baseTime * Math.pow(TIME_GROWTH, level - 1));
}

// ============================
// GÉNÉRATION DES CARTES
// ============================

function genererTechnologies() {
    const levels = loadTechLevels();
    const activeResearches = loadActiveResearches();
    const techGrid = document.getElementById("techGrid");
    techGrid.innerHTML = "";

    technologies.forEach(tech => {
        const level = levels[tech.id];
        
        // 1. Vérification des prérequis pour cette carte
        const checkReq = verifierPrerequis(tech, levels);
        
        const card = document.createElement("div");
        
        // 2. Ajout conditionnel de la classe "locked"
        card.className = checkReq.valid ? "tech-card" : "tech-card locked";

        // 3. Ajout d'un indicateur visuel (cadenas) si bloqué
        const lockIcon = checkReq.valid ? "" : "🔒 ";

        // 4. Indicateur si la techno est actuellement en recherche
        const activeIcon = isResearchActive(tech.id, activeResearches) ? " ⏳" : "";

        card.innerHTML = `
            <h3>${lockIcon}${tech.nom}</h3>
            <p>${tech.desc}</p>
            <p>Niveau : ${level} / ${tech.maxLevel}${activeIcon}</p>
        `;

        // Le joueur peut toujours cliquer pour voir les prérequis manquants
        card.addEventListener("click", () => afficherInfo(tech));
        techGrid.appendChild(card);
    });
}

// ============================
// AFFICHAGE DES DÉTAILS
// ============================

function afficherInfo(tech) {
    const levels = loadTechLevels();
    const level = levels[tech.id];

    currentInfoTechId = tech.id;

    if (level >= tech.maxLevel) {
        infoBox.innerHTML = `
            <strong>${tech.nom}</strong><br>
            ${tech.desc}<br><br>
            <strong>Niveau max atteint.</strong>
        `;
        return;
    }

    const activeResearches = loadActiveResearches();
    const activeEntry = activeResearches.find(r => r.id === tech.id);

    // Si cette techno est déjà en cours de recherche, on affiche sa
    // progression au lieu du formulaire de lancement.
    if (activeEntry) {
        const nextLevel = level + 1;
        const totalTime = getTime(tech, nextLevel);
        const remaining = Math.max(0, Math.floor((activeEntry.endTime - Date.now()) / 1000));
        const elapsed = totalTime - remaining;
        const percent = Math.min(100, Math.floor((elapsed / totalTime) * 100));

        infoBox.innerHTML = `
            <strong>${tech.nom}</strong><br>
            Recherche en cours…<br><br>

            <div class="progressBar">
                <div id="researchProgress-${tech.id}" class="progressFill" style="width:${percent}%"></div>
            </div>

            <p id="researchTimer-${tech.id}">Temps restant : ${remaining}s</p>

            <button class="btn-recherche" disabled>Recherche en cours…</button>
        `;
        return;
    }

    const nextLevel = level + 1;
    
    // 1. CORRECTION : Il faut calculer 'cost' avant de s'en servir !
    const cost = getCost(tech, nextLevel); 
    const time = getTime(tech, nextLevel);

    // 2. CORRECTION : Ajouter TOUTES les ressources possibles dans la map
    const resMap = {
        scrap: { nom: "Ferraille", icon: "🔩" },
        energy: { nom: "Énergie", icon: "⚡" },
        nano: { nom: "Nanocomposants", icon: "🧬" },
        data: { nom: "Données", icon: "📡" },
        reinforcedSteel: { nom: "Acier renforcé", icon: "🛠️" },
        syntheticNanites: { nom: "Nanites synthétiques", icon: "🤖" },
        cyberModule: { nom: "Module cybernétique", icon: "🧩" },
        aiFragment: { nom: "Fragment d'IA", icon: "🧠" }
    };

    let costHTML = "";
    for (const [res, amount] of Object.entries(cost)) {
        // Sécurité supplémentaire au cas où une ressource inconnue se glisse
        const icon = resMap[res] ? resMap[res].icon : "❓";
        costHTML += `<span style="margin-right: 10px;">${icon} ${amount}</span>`;
    }

    // Vérification des prérequis avec notre nouvelle fonction
    const checkReq = verifierPrerequis(tech, levels);

    // Construction du bloc HTML pour les prérequis
    let prereqHTML = "";
    if (checkReq.list.length > 0) {
        prereqHTML = `<div class="prereq-box" style="margin: 15px 0; padding: 10px; background: rgba(0, 0, 0, 0.4); border-left: 3px solid #00f3ff; border-radius: 4px;">
            <strong style="color: #00f3ff; font-size: 0.9em; text-transform: uppercase;">Prérequis :</strong><br>`;
        
        checkReq.list.forEach(req => {
            const icon = req.valide ? "✅" : "❌";
            const color = req.valide ? "#4caf50" : "#f44336";
            prereqHTML += `<span style="color: ${color}; font-size: 0.9em; display: block; margin-top: 5px;">
                ${icon} ${req.nom} (Niv. ${req.actuel} / ${req.requis})
            </span>`;
        });
        prereqHTML += `</div>`;
    } else {
        prereqHTML = `<div style="margin: 15px 0; color: #4caf50; font-size: 0.9em;">✅ Aucun prérequis</div>`;
    }

    // Gestion de l'état du bouton
    let bouton = "";
    if (!checkReq.valid) {
        bouton = `<button class="btn-recherche" disabled style="opacity: 0.5; cursor: not-allowed; border-color: #f44336; color: #f44336;">Prérequis manquants</button>`;
    } else if (activeResearches.length >= MAX_CONCURRENT_RESEARCH) {
        bouton = `<button class="btn-recherche" disabled style="opacity: 0.5; cursor: not-allowed;">File de recherche pleine (${activeResearches.length}/${MAX_CONCURRENT_RESEARCH})</button>`;
    } else {
        bouton = `<button class="btn-recherche" onclick="lancerRecherche('${tech.id}')">Améliorer</button>`;
    }

    // Injection dans le DOM
    infoBox.innerHTML = `
        <strong style="font-size: 1.2em; color: #fff;">${tech.nom}</strong><br>
        <span style="font-size: 0.9em; color: #aaa;">${tech.desc}</span><br><br>
        
        <strong>Niveau actuel :</strong> ${level}<br>
        <strong>Niveau suivant :</strong> ${nextLevel}<br><br>
        
        <div style="display: flex; gap: 15px; margin-bottom: 10px;">
            <span><strong>Coût :</strong> ${costHTML}<br></span>
            <span><strong>Temps :</strong> ${time}s</span>
        </div>
        
        ${prereqHTML}
        ${bouton}
    `;
}

function verifierPrerequis(tech, currentLevels) {
    // S'il n'y a pas de prérequis
    if (!tech.prereq || Object.keys(tech.prereq).length === 0) {
        return { valid: true, list: [] };
    }

    let list = [];
    let allValid = true;

    for (const [reqId, reqLevel] of Object.entries(tech.prereq)) {
        const playerLevel = currentLevels[reqId] || 0;
        const isValid = playerLevel >= reqLevel;
        
        if (!isValid) {
            allValid = false;
        }

        // On récupère le nom de la technologie requise
        const reqTech = technologies.find(t => t.id === reqId);
        
        list.push({
            nom: reqTech.nom,
            requis: reqLevel,
            actuel: playerLevel,
            valide: isValid
        });
    }

    return {
        valid: allValid,
        list: list
    };
}

// ============================
// LANCER UNE RECHERCHE
// ============================

function lancerRecherche(idTech) {
    const tech = technologies.find(t => t.id === idTech);
    if (!tech) return;

    const levels = loadTechLevels();
    const nextLevel = levels[tech.id] + 1;

    if (nextLevel > tech.maxLevel) return;

    let activeResearches = loadActiveResearches();

    if (isResearchActive(idTech, activeResearches)) {
        alert("Cette technologie est déjà en cours de recherche.");
        return;
    }

    if (activeResearches.length >= MAX_CONCURRENT_RESEARCH) {
        alert(`File de recherche pleine (${MAX_CONCURRENT_RESEARCH}/${MAX_CONCURRENT_RESEARCH}).`);
        return;
    }

    // 1. Charger la sauvegarde pour vérifier les ressources
    let save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
    const cost = getCost(tech, nextLevel);

    // 2. Vérification de la disponibilité
    for (const [res, amount] of Object.entries(cost)) {
        if ((save[res] || 0) < amount) {
            alert(`Fonds insuffisants ! Il vous manque du ${res}.`);
            return; // Annule le lancement de la recherche
        }
    }

    // 3. Déduction des ressources
    for (const [res, amount] of Object.entries(cost)) {
        save[res] -= amount;
    }
    
    // 4. Sauvegarde de la transaction
    localStorage.setItem("cosmicSave", JSON.stringify(save));

    // Si la page Ressources est ouverte, on la met à jour
    if (typeof updateRessourcesPage === "function") {
        updateRessourcesPage();
    }
    if (typeof updateHUD === "function") {
        updateHUD();
    }

    // 5. Ajout à la file de recherches (jusqu'à 4 en parallèle)
    const time = getTime(tech, nextLevel);
    const endTime = Date.now() + time * 1000;

    activeResearches.push({ id: tech.id, endTime: endTime });
    saveActiveResearches(activeResearches);

    genererTechnologies();
    afficherInfo(tech);
}

// ============================
// MISE À JOUR PROGRESSION
// ============================

function updateResearchProgress() {
    let activeResearches = loadActiveResearches();
    if (activeResearches.length === 0) return;

    const now = Date.now();
    const stillActive = [];
    let completedSomething = false;

    activeResearches.forEach(r => {
        const tech = technologies.find(t => t.id === r.id);
        if (!tech) return; // techno invalide, on l'ignore/supprime

        const levels = loadTechLevels();
        const nextLevel = levels[tech.id] + 1;
        const totalTime = getTime(tech, nextLevel);
        const remaining = Math.floor((r.endTime - now) / 1000);

        if (remaining <= 0) {
            terminerRecherche(r.id);
            completedSomething = true;

            // Si le panneau de détails affiche justement cette techno,
            // on montre le message de complétion.
            if (currentInfoTechId === tech.id) {
                infoBox.innerHTML = `
                    <strong>${tech.nom}</strong><br>
                    Recherche terminée !<br><br>
                    <button class="btn-recherche" disabled>Complété</button>
                `;
            }
        } else {
            stillActive.push(r);

            const elapsed = totalTime - remaining;
            const percent = Math.min(100, Math.floor((elapsed / totalTime) * 100));

            const bar = document.getElementById(`researchProgress-${tech.id}`);
            if (bar) bar.style.width = percent + "%";

            const timer = document.getElementById(`researchTimer-${tech.id}`);
            if (timer) timer.textContent = `Temps restant : ${Math.max(remaining, 0)}s`;
        }
    });

    saveActiveResearches(stillActive);

    if (completedSomething) {
        genererTechnologies();
    }
}

// ============================
// FINALISATION DE LA RECHERCHE
// ============================

function terminerRecherche(techId) {
    const tech = technologies.find(t => t.id === techId);
    if (!tech) return;

    const levels = loadTechLevels();
    const current = levels[tech.id];

    if (current < tech.maxLevel) {
        levels[tech.id] = current + 1;
        saveTechLevels(levels);
        appliquerEffet(tech, levels[tech.id]);
    }

    // Le retrait de la file active est géré par updateResearchProgress()
    // (qui appelle cette fonction), donc rien à faire ici de ce côté.
    genererTechnologies();
}

// ============================
// APPLICATION DES EFFETS
// ============================

// =======================================
// STATS DE BASE PAR UNITÉ (niveau 1)
// Progression : +5 ATK et +5 DEF par niveau supplémentaire
// =======================================

const UNIT_BASE_STATS = {
    drone_recuperateur: { attack: 0,   defense: 5 },
    fregate:             { attack: 15,  defense: 20 },
    cargo:               { attack: 0,   defense: 10 },
    sentinelle:          { attack: 5,   defense: 30 },
    chasseur:            { attack: 105, defense: 10 },
    etoile_noire:        { attack: 500, defense: 500 },
    roquette:            { attack: 70,  defense: 0 },
    canon_impulsion:     { attack: 90,  defense: 10 },
    canon_plasma:        { attack: 125, defense: 20 },
    batterie_aa:         { attack: 155, defense: 60 },
    intercepteur:        { attack: 255, defense: 15 }
};

// =======================================
// APPLICATION DES EFFETS — MISE À JOUR UNITÉ
// =======================================

function upgradeUnit(techId, level) {
    const techToUnit = {
        tech9: "drone_recuperateur",
        tech10: "fregate",
        tech11: "cargo",
        tech12: "sentinelle",
        tech13: "chasseur",
        tech14: "roquette",
        tech15: "canon_impulsion",
        tech16: "canon_plasma",
        tech17: "batterie_aa",
        tech18: "intercepteur",
        tech19: "etoile_noire"
    };

    const unitId = techToUnit[techId];
    if (!unitId) return;

    if (!GameData.units[unitId]) {
        GameData.units[unitId] = {
            level: 0,
            count: 0,
            attack: 0,
            defense: 0
        };
    }

    const base = UNIT_BASE_STATS[unitId] || { attack: 0, defense: 0 };

    GameData.units[unitId].level = level;
    GameData.units[unitId].attack = base.attack + (level - 1) * 5;
    GameData.units[unitId].defense = base.defense + (level - 1) * 5;

    saveGame();
}

function appliquerEffet(tech, level) {
    switch (tech.effect) {
        case "energy_efficiency": {
            const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
            save.energyEfficiency = level * 0.10;
            localStorage.setItem("cosmicSave", JSON.stringify(save));
            break;
        }

        case "unit_defense": {
            const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
            save.unitDefenseBonus = level * 0.10;
            localStorage.setItem("cosmicSave", JSON.stringify(save));
            break;
        }

        case "unit_attack": {
            const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
            save.unitAttackBonus = level * 0.10;
            localStorage.setItem("cosmicSave", JSON.stringify(save));
            break;
        }

        case "building_discount": {
            const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
            save.buildingUpgradeDiscount = level * 0.05;
            localStorage.setItem("cosmicSave", JSON.stringify(save));
            break;
        }

        case "unlock_recipe": {
            const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};
            if (!save.unlockedRecipes) save.unlockedRecipes = 0;
            save.unlockedRecipes = level;
            localStorage.setItem("cosmicSave", JSON.stringify(save));
            break;
        }

        case "unlock_next_level":
            // upgradeUnit() met à jour GameData.units ET appelle saveGame(),
            // qui persiste déjà tout dans localStorage. Rien à faire de plus ici.
            upgradeUnit(tech.id, level);
            break;

        case "unlock_hangars":
            GameData.buildings.hangar_attaque.unlocked = true;
            GameData.buildings.hangar_defense.unlocked = true;
            saveGame(); // persiste déjà tout, pareil que ci-dessus

            if (typeof initBatiments === "function") {
                const page = document.getElementById("batiments");
                if (page && page.style.display !== "none") {
                    initBatiments();
                }
            }
            break;
    }
}

// ============================
// TICK RECHERCHE
// ============================

setInterval(updateResearchProgress, 1000);

// ============================
// INITIALISATION
// ============================

window.addEventListener("load", () => {
    genererTechnologies();
    // Le panneau de détails (infoBox) reste vide au chargement : avec
    // jusqu'à 4 recherches en parallèle, il n'y a plus une seule recherche
    // "active" à restaurer automatiquement. Cliquer sur une carte en cours
    // de recherche affichera sa progression (géré par afficherInfo()).
    // Le récapitulatif de toutes les recherches en cours reste visible sur
    // la page d'accueil (accueil-extra.js).
});