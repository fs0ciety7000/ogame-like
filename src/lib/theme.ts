import { create } from "zustand";

/* Thèmes d'interface (v2.4) : jetons définis dans src/index.css sous
   html[data-theme]. Le choix est propre à chaque appareil. */

export type ThemeId = "tactique" | "holo" | "cockpit" | "netrunner" | "aurora" | "signal" | "voyageur" | "omni" | "spartan" | "constellation" | "ishimura" | "atlas" | "matrice";

export const THEMES: { id: ThemeId; name: string; inspiration: string; description: string; swatches: string[] }[] = [
  {
    id: "tactique",
    name: "Tactique",
    inspiration: "Thème principal",
    description: "Cyan et violet, coins biseautés, polyvalent et lisible.",
    swatches: ["#4be8ff", "#a78bfa", "#4aff9c", "#10162b"],
  },
  {
    id: "holo",
    name: "Holo",
    inspiration: "Esprit Star Citizen",
    description: "Hologramme bleu translucide, traits fins, très épuré.",
    swatches: ["#6ec8ff", "#78ffd2", "#ffd68c", "#0b2240"],
  },
  {
    id: "cockpit",
    name: "Cockpit",
    inspiration: "Esprit Elite Dangerous",
    description: "Tableau de bord orange monochrome, sobre et immersif.",
    swatches: ["#ff8c1e", "#78c8ff", "#ffbe50", "#1b1008"],
  },
  {
    id: "netrunner",
    name: "Netrunner",
    inspiration: "Esprit Cyberpunk 2077",
    description: "Jaune haute tension et rouge néon sur noir profond, découpes en encoche et glitch.",
    swatches: ["#f3e600", "#ff003c", "#55ead4", "#171419"],
  },
  {
    id: "aurora",
    name: "Aurora",
    inspiration: "Coucher de soleil orbital",
    description: "Violet profond, rose et ambre, titres et boutons en dégradé. Chaleureux, idéal le soir.",
    swatches: ["#ff5e8a", "#ffa64d", "#5cf2c0", "#241642"],
  },
  {
    id: "signal",
    name: "Signal",
    inspiration: "Esprit Marathon (Bungie)",
    description: "Graphisme brut et net : vert acide et magenta sur graphite, aplats francs, trame de grille, gros titres serrés. Aucun halo.",
    swatches: ["#c6ff2e", "#ff2e88", "#2ee6ff", "#16181c"],
  },
  {
    id: "voyageur",
    name: "Voyageur",
    inspiration: "Esprit Destiny",
    description: "Ivoire et gris perle sur ardoise, violet légendaire et or exotique. Titres fins très espacés, traits fins, calme et lumineux.",
    swatches: ["#e6dfcc", "#a77fdc", "#ceae33", "#181d26"],
  },
  {
    id: "omni",
    name: "Omni",
    inspiration: "Esprit Mass Effect",
    description: "Hologramme orange d'omnitech sur bleu nuit, second accent bleu, titres lumineux et liserés orange.",
    swatches: ["#ff9a3c", "#4fb3ff", "#66e0c2", "#0e182b"],
  },
  {
    id: "spartan",
    name: "Spartan",
    inspiration: "Esprit Halo Infinite",
    description: "Visière bleu-vert, cyan pâle et vert armure, titres condensés et crochets d'angle sur les panneaux.",
    swatches: ["#7df3ff", "#a8d13a", "#9be564", "#0b2431"],
  },
  {
    id: "constellation",
    name: "Constellation",
    inspiration: "Esprit Starfield",
    description: "NASA-punk : os et graphite, typographie technique, bandes rouge, orange, jaune et bleu en tête de panneau. Aucun halo.",
    swatches: ["#ece6d6", "#e0582c", "#f2b33d", "#18191c"],
  },
  {
    id: "ishimura",
    name: "Ishimura",
    inspiration: "Esprit Dead Space",
    description: "Hologrammes orange projetés sur du noir, glace cyan, lueur diégétique et lignes de balayage.",
    swatches: ["#ff9a2e", "#6fd8ff", "#ff2a2a", "#14110d"],
  },
  {
    id: "atlas",
    name: "Atlas",
    inspiration: "Esprit No Man's Sky",
    description: "Nuit violette, magenta saturé, sarcelle et soleil jaune : un cosmos coloré et optimiste.",
    swatches: ["#ff4fd8", "#29f0d0", "#ffd23f", "#22124f"],
  },
  {
    id: "matrice",
    name: "Matrice",
    inspiration: "Esprit Ghost in the Shell",
    description: "Noir pur, vert matrice et cyan électrique, typographie terminal ; le magenta signale le danger.",
    swatches: ["#3dff6e", "#00f0ff", "#ff2d6f", "#07110a"],
  },
];

const KEY = "cosmic-empires:theme";

function initial(): ThemeId {
  try {
    const t = localStorage.getItem(KEY) as ThemeId | null;
    if (t && THEMES.some((x) => x.id === t)) return t;
  } catch {
    /* stockage indisponible */
  }
  return "tactique";
}

export const useThemeStore = create<{ theme: ThemeId }>(() => ({ theme: initial() }));

export function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  // 5.24 : lire le style avant la fin du chargement force une mise en page
  // (avertissement Firefox, risque de flash sans style) : on attend `load`.
  const syncMeta = () => {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", getComputedStyle(document.documentElement).getPropertyValue("--th-space-900").trim() || "#05070f");
  };
  if (document.readyState === "complete") syncMeta();
  else window.addEventListener("load", syncMeta, { once: true });
}

export function setTheme(theme: ThemeId) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* le choix ne survivra pas au rechargement */
  }
  applyTheme(theme);
  useThemeStore.setState({ theme });
}

applyTheme(useThemeStore.getState().theme);
