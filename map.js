// Sélecteurs
const mapContainer = document.getElementById("map-container");
const map = document.getElementById("map");
const fogLayer = document.getElementById("fog-layer");

// Zoom appliqué dans le CSS
const zoom = 1;

// Position de la carte
let mapX = 0;
let mapY = 0;

// Variables pour le drag
let isDragging = false;
let startX = 0;
let startY = 0;

/* =====================================================
   FOG OF WAR (DAMIER NOIR)
===================================================== */

const CELL_SIZE = 128;
const GRID_COLS = Math.ceil(6144 / CELL_SIZE);
const GRID_ROWS = Math.ceil(4096 / CELL_SIZE);
const FOG_STORAGE_KEY = "galacticFogState";
const ACTIVE_EXPLORATION_CELL_KEY = "activeExplorationCell";

let fogGrid = [];
let currentExplorationCell = null;

/* --- Sauvegarde du fog --- */
function saveFogState() {
    const data = fogGrid.map(c => ({
        x: c.x,
        y: c.y,
        revealed: c.revealed
    }));
    localStorage.setItem(FOG_STORAGE_KEY, JSON.stringify(data));
}

/* --- Génération du fog avec restauration --- */
function generateFog() {
    const saved = JSON.parse(localStorage.getItem(FOG_STORAGE_KEY) || "[]");

    const revealedMap = new Map();
    saved.forEach(c => {
        revealedMap.set(`${c.x},${c.y}`, c.revealed);
    });

    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {

            const key = `${x},${y}`;
            const wasRevealed = revealedMap.get(key) === true;

            const cell = document.createElement("div");
            cell.classList.add("fog-cell");

            cell.style.left = (x * CELL_SIZE) + "px";
            cell.style.top = (y * CELL_SIZE) + "px";

            if (wasRevealed) {
                cell.classList.add("fog-revealed");
                setTimeout(() => cell.remove(), 0);
            }

            fogLayer.appendChild(cell);

            fogGrid.push({
                x,
                y,
                element: cell,
                revealed: wasRevealed,
                exploring: false
            });
        }
    }
}

/* --- Choisir une case non explorée --- */
function pickRandomFogCell() {
    const hiddenCells = fogGrid.filter(c => !c.revealed && !c.exploring);

    if (hiddenCells.length === 0) return null;

    const random = hiddenCells[Math.floor(Math.random() * hiddenCells.length)];

    random.exploring = true;
    random.element.classList.add("fog-exploring");

    return random;
}

/* --- Case rouge dès le début de la mission --- */
function startExplorationPreview() {
    const cell = pickRandomFogCell();
    if (!cell) {
        console.log("Toute la carte est déjà explorée !");
        return;
    }

    currentExplorationCell = cell;

    // 🔥 Sauvegarde de la case rouge
    localStorage.setItem(ACTIVE_EXPLORATION_CELL_KEY, JSON.stringify({ x: cell.x, y: cell.y }));

    console.log("Exploration lancée sur la case :", cell.x, cell.y);
}

/* --- Révéler une case --- */
function revealFogCell(cell) {
    cell.revealed = true;
    cell.exploring = false;

    cell.element.classList.remove("fog-exploring");
    cell.element.classList.add("fog-revealed");

    saveFogState();

    setTimeout(() => {
        cell.element.remove();
    }, 600);
}

/* --- Fin de mission : révélation --- */
function startExplorationMission() {
    if (!currentExplorationCell) {
        console.warn("Aucune case en cours d'exploration !");
        return;
    }

    const cell = currentExplorationCell;
    currentExplorationCell = null;

    // 🔥 On efface la sauvegarde de la case rouge
    localStorage.removeItem(ACTIVE_EXPLORATION_CELL_KEY);

    console.log("Fin de mission, révélation de la case :", cell.x, cell.y);

    setTimeout(() => {
        revealFogCell(cell);
        triggerExplorationEvent(cell);
    }, 5000);
}

/* --- Événement aléatoire --- */
function triggerExplorationEvent(cell) {
    const events = ["combat", "ressource", "signal", "ruines"];
    const event = events[Math.floor(Math.random() * events.length)];

    console.log("Événement trouvé :", event, "dans la case", cell.x, cell.y);
}

/* =====================================================
   SYNCHRO AVEC MISSIONS (localStorage)
===================================================== */

function checkActiveExplorationMission() {
    let activeMissions = [];

    try {
        activeMissions = JSON.parse(localStorage.getItem("activeMissions")) || [];
    } catch (e) {
        console.warn("Impossible de lire les missions actives :", e);
        return;
    }

    const hasExplorationMission = activeMissions.some(m => m.key === "exploration_galactique");

    if (!hasExplorationMission) return;

    // 🔥 Vérifier si une case rouge était déjà sauvegardée
    const saved = JSON.parse(localStorage.getItem(ACTIVE_EXPLORATION_CELL_KEY));

    if (saved) {
        const cell = fogGrid.find(c => c.x === saved.x && c.y === saved.y);

        if (cell && !cell.revealed) {
            currentExplorationCell = cell;
            cell.exploring = true;
            cell.element.classList.add("fog-exploring");
            console.log("Case rouge restaurée :", saved.x, saved.y);
            return;
        }
    }

    // Sinon → on en choisit une nouvelle
    console.log("Mission active → nouvelle case rouge générée.");
    startExplorationPreview();
}

/* =====================================================
   RÉVÉLATION EN ATTENTE (après fin de mission)
===================================================== */

function checkPendingExplorationReveal() {
    const pending = localStorage.getItem("pendingExplorationReveal");

    if (!pending) return;

    // On ne veut le faire qu'une fois
    localStorage.removeItem("pendingExplorationReveal");

    // On essaie de retrouver la case rouge à partir de la sauvegarde
    const saved = JSON.parse(localStorage.getItem(ACTIVE_EXPLORATION_CELL_KEY) || "null");

    if (!saved) {
        console.warn("Aucune case d'exploration sauvegardée à révéler.");
        return;
    }

    const cell = fogGrid.find(c => c.x === saved.x && c.y === saved.y);

    if (!cell) {
        console.warn("Impossible de retrouver la case d'exploration à révéler.");
        return;
    }

    currentExplorationCell = cell;
    console.log("Révélation de la case après mission terminée :", cell.x, cell.y);

    // On utilise ta logique existante
    startExplorationMission();
}

/* =====================================================
   SYSTÈMES STELLAIRES
===================================================== */

const systems = [
    { id: "alpha7", name: "Alpha‑7", x: 800, y: 600, type: "exploration", icon: "🛰️" },
    { id: "nebula", name: "Nébuleuse Rouge", x: 1500, y: 900, type: "science", icon: "🔬" },
    { id: "station", name: "Station Fantôme", x: 2500, y: 1200, type: "combat", icon: "⚔️" },
    { id: "ruins", name: "Ruines Orbitales", x: 4000, y: 2000, type: "exploration", icon: "🛰️" }
];

function renderSystems() {
    systems.forEach(sys => {
        const el = document.createElement("div");
        el.classList.add("system");
        el.style.left = sys.x + "px";
        el.style.top = sys.y + "px";
        el.dataset.name = sys.name;
        el.dataset.icon = sys.icon;

        el.addEventListener("click", () => {
            console.log("Système sélectionné :", sys.name);
        });

        map.appendChild(el);
    });
}

/* =====================================================
   CAMERA
===================================================== */

function loadCameraPosition() {
    const savedX = localStorage.getItem("mapX");
    const savedY = localStorage.getItem("mapY");

    if (savedX !== null) mapX = parseInt(savedX);
    if (savedY !== null) mapY = parseInt(savedY);

    updateMapPosition();
}

function saveCameraPosition() {
    localStorage.setItem("mapX", mapX);
    localStorage.setItem("mapY", mapY);
}

function updateMapPosition() {
    const transformValue = `translate(${mapX}px, ${mapY}px) scale(${zoom})`;

    map.style.transform = transformValue;
    map.style.transformOrigin = "top left";

    fogLayer.style.transform = transformValue;
    fogLayer.style.transformOrigin = "top left";
}

/* =====================================================
   DRAG & MOVE
===================================================== */

mapContainer.addEventListener("mousedown", (e) => {
    isDragging = true;
    mapContainer.classList.add("dragging");

    startX = e.clientX - mapX;
    startY = e.clientY - mapY;
});

mapContainer.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    mapX = e.clientX - startX;
    mapY = e.clientY - startY;

    const maxX = 0;
    const maxY = 0;

    const minX = mapContainer.clientWidth - map.clientWidth * zoom;
    const minY = mapContainer.clientHeight - map.clientHeight * zoom;

    mapX = Math.min(maxX, Math.max(minX, mapX));
    mapY = Math.min(maxY, Math.max(minY, mapY));

    updateMapPosition();
});

mapContainer.addEventListener("mouseup", () => {
    isDragging = false;
    mapContainer.classList.remove("dragging");
    saveCameraPosition();
});

mapContainer.addEventListener("mouseleave", () => {
    if (isDragging) {
        isDragging = false;
        mapContainer.classList.remove("dragging");
        saveCameraPosition();
    }
});

/* =====================================================
   INITIALISATION
===================================================== */

loadCameraPosition();
renderSystems();
generateFog();
updateMapPosition();

// 🔥 Vérifie si une mission d'exploration galactique est en cours
checkActiveExplorationMission();

// 🔥 Vérifie si une mission vient de se terminer et doit révéler une case
checkPendingExplorationReveal();

