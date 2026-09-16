// =======================================
// Liste des ressources affichées (LISTE OFFICIELLE)
// =======================================

const resourceList = [
    // COMMUNES (produites)
    { id: "scrap",  name: "Ferraille",          emoji: "🔩", rarity: "common", rareEquivalent: "reinforcedSteel" },
    { id: "energy", name: "Énergie instable",   emoji: "⚡", rarity: "common", rareEquivalent: "cyberModule" },
    { id: "nano",   name: "Nanocomposants",     emoji: "🧬", rarity: "common", rareEquivalent: "syntheticNanites" },
    { id: "data",   name: "Données anciennes",  emoji: "📡", rarity: "common", rareEquivalent: "aiFragment" },

    // RARES (uniquement via trade)
    { id: "reinforcedSteel", name: "Acier renforcé",        emoji: "🛠️", rarity: "rare", commonSource: "scrap" },
    { id: "cyberModule",     name: "Module cybernétique",   emoji: "🧩", rarity: "rare", commonSource: "energy" },
    { id: "syntheticNanites",name: "Nanites synthétiques",  emoji: "🤖", rarity: "rare", commonSource: "nano" },
    { id: "aiFragment",      name: "Fragment d’IA",         emoji: "🧠", rarity: "rare", commonSource: "data" }
];


// =======================================
// Dépenser une ressource
// =======================================

function spendResource(id, amount) {
    let save = JSON.parse(localStorage.getItem("cosmicSave")) || {};

    const current = save[id] ?? 0;

    if (current < amount) return false;

    save[id] = current - amount;

    localStorage.setItem("cosmicSave", JSON.stringify(save));

    updateHUD?.();
    updateRessourcesPage?.();

    return true;
}


// =======================================
// Sauvegarde complète du jeu (VERSION PROPRE)
// =======================================

function saveGame() {
    let save = JSON.parse(localStorage.getItem("cosmicSave")) || {};

    // Sauvegarder les unités
    save.units = GameData.units;
    save.xp = GameData.xp;

    // Sauvegarder les bâtiments
    save.buildings = {};
    for (const id in GameData.buildings) {
        save.buildings[id] = {
            level: GameData.buildings[id].level,
            unlocked: GameData.buildings[id].unlocked !== false
            };
    }

    // ❌ NE PAS sauvegarder GameData.resources
    // Les ressources sont gérées UNIQUEMENT par cosmicSave

    localStorage.setItem("cosmicSave", JSON.stringify(save));
}


// =======================================
// Génération de la page Ressources
// =======================================

function initRessources() {

    const container = document.getElementById("inventory-grid");
    container.innerHTML = "";

    const save = JSON.parse(localStorage.getItem("cosmicSave")) || {};

    resourceList.forEach(res => {

        const value = save[res.id] ?? 0;

        const item = document.createElement("div");
        item.classList.add("inventory-item");

        item.innerHTML = `
    <div class="item-name">${res.name}</div>
    <span class="emoji">${res.emoji}</span>
    <div class="item-value">${value}</div>
`;

        container.appendChild(item);
    });

    initTrade();
}


// =======================================
// Remplir les menus déroulants
// =======================================

function populateTradeMenus() {
    const sellSelect = document.getElementById("sell-select");
    const buySelect = document.getElementById("buy-select");

    sellSelect.innerHTML = '<option value="">Choisir...</option>';
    buySelect.innerHTML = '<option value="">Choisir...</option>';

    resourceList.forEach(res => {
        const opt1 = document.createElement("option");
        opt1.value = res.id;
        opt1.textContent = res.name;
        sellSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = res.id;
        opt2.textContent = res.name;
        buySelect.appendChild(opt2);
    });
}


// =======================================
// Icônes du trade
// =======================================

function updateTradeIcons() {
    const sellId = document.getElementById("sell-select").value;
    const buyId = document.getElementById("buy-select").value;

    const sellIcon = document.getElementById("sell-icon");
    const buyIcon = document.getElementById("buy-icon");

    const sellRes = resourceList.find(r => r.id === sellId);
    const buyRes = resourceList.find(r => r.id === buyId);

    sellIcon.textContent = sellRes ? sellRes.emoji : "❔";
    buyIcon.textContent = buyRes ? buyRes.emoji : "❔";
}


// =======================================
// Calcul du trade
// =======================================

function calculateTrade() {
    const sellId = document.getElementById("sell-select").value;
    const buyId = document.getElementById("buy-select").value;
    const amount = parseInt(document.getElementById("sell-amount").value) || 0;

    const sellRes = resourceList.find(r => r.id === sellId);
    const buyRes = resourceList.find(r => r.id === buyId);

    if (!sellRes || !buyRes || amount <= 0) {
        document.getElementById("buy-result").textContent = "0";
        return;
    }

    let rate = 1;

    if (sellRes.rarity === "common" && buyRes.rarity === "rare") rate = 0.01;
    if (sellRes.rarity === "rare" && buyRes.rarity === "common") rate = 50;

    const result = amount * rate;
    document.getElementById("buy-result").textContent = result.toFixed(2);
}


// =======================================
// Fonction ÉCHANGER
// =======================================

function doTrade() {
    let save = JSON.parse(localStorage.getItem("cosmicSave")) || {};

    const sellId = document.getElementById("sell-select").value;
    const buyId = document.getElementById("buy-select").value;
    const amount = parseInt(document.getElementById("sell-amount").value) || 0;

    if (!sellId || !buyId || amount <= 0) return;

    if ((save[sellId] ?? 0) < amount) {
        alert("Pas assez de ressources !");
        return;
    }

    const sellRes = resourceList.find(r => r.id === sellId);
    const buyRes = resourceList.find(r => r.id === buyId);

    let rate = 1;
    if (sellRes.rarity === "common" && buyRes.rarity === "rare") rate = 0.01;
    if (sellRes.rarity === "rare" && buyRes.rarity === "common") rate = 50;

    const result = amount * rate;

    save[sellId] -= amount;
    save[buyId] = (save[buyId] ?? 0) + result;

    localStorage.setItem("cosmicSave", JSON.stringify(save));

    updateHUD();
    updateRessourcesPage();
}


// =======================================
// Événements du trade
// =======================================

function setupTradeEvents() {
    document.getElementById("sell-select").addEventListener("change", () => {
        updateTradeIcons();
        calculateTrade();
    });

    document.getElementById("buy-select").addEventListener("change", () => {
        updateTradeIcons();
        calculateTrade();
    });

    document.getElementById("sell-amount").addEventListener("input", calculateTrade);

    document.getElementById("trade-button").addEventListener("click", doTrade);
}


// =======================================
// Initialisation du trade
// =======================================

function initTrade() {
    populateTradeMenus();
    setupTradeEvents();
    updateTradeIcons();
}
