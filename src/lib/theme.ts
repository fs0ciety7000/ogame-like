import { create } from "zustand";

/* Thèmes d'interface (v2.4) : jetons définis dans src/index.css sous
   html[data-theme]. Le choix est propre à chaque appareil. */

export type ThemeId = "tactique" | "holo" | "cockpit" | "netrunner" | "aurora";

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
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", getComputedStyle(document.documentElement).getPropertyValue("--th-space-900").trim() || "#05070f");
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
