import { create } from "zustand";

/* 5.25 : retour visuel de l'interface (GSAP). Tout passe par ce module :
   - réglage « Animations de l'interface » (Réglages, mémorisé sur l'appareil) ;
   - animations réduites du système respectées (rien ne bouge) ;
   - GSAP et ses plugins chargés à la demande (hors du paquet principal).
   Règles d'usage : docs/DESIGN.md, section « Retour visuel ». */

const KEY = "cosmic-empires:ui-fx";

function initial(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export const useUiFxStore = create<{ enabled: boolean }>(() => ({ enabled: initial() }));

export function setUiFx(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? "on" : "off");
  } catch {
    /* choix gardé pour la session */
  }
  useUiFxStore.setState({ enabled });
}

/** Faut-il animer maintenant ? (réglage du joueur + animations réduites du système). */
export function fxOn(): boolean {
  if (!useUiFxStore.getState().enabled) return false;
  try {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return true;
  }
}

type Gsap = typeof import("gsap").gsap;
export interface FxKit {
  gsap: Gsap;
  SplitText: typeof import("gsap/SplitText").SplitText;
  Flip: typeof import("gsap/Flip").Flip;
}

let kit: Promise<FxKit> | null = null;
/** GSAP + SplitText, ScrambleText, Text et Flip, chargés une seule fois. */
export function loadFx(): Promise<FxKit> {
  kit ??= Promise.all([import("gsap"), import("gsap/SplitText"), import("gsap/ScrambleTextPlugin"), import("gsap/TextPlugin"), import("gsap/Flip")]).then(
    ([g, st, sc, tp, fl]) => {
      g.gsap.registerPlugin(st.SplitText, sc.ScrambleTextPlugin, tp.TextPlugin, fl.Flip);
      return { gsap: g.gsap, SplitText: st.SplitText, Flip: fl.Flip };
    },
  );
  return kit;
}

/** Couleur d'un jeton du thème (GSAP n'interpole pas color-mix ni var()). */
export function token(name: string, fallback = "currentColor"): string {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  } catch {
    return fallback;
  }
}

/** Jeu de caractères des textes brouillés (façon terminal de bord). */
export const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>▮▯";

/** Glitch RVB d'un élément cliqué : séparation des couleurs + secousse (140 ms). */
export async function glitch(el: HTMLElement) {
  if (!fxOn()) return;
  const { gsap } = await loadFx();
  const a = token("--th-accent2"), b = token("--th-danger");
  gsap.killTweensOf(el, "x,textShadow");
  gsap
    .timeline()
    .to(el, { x: 2, textShadow: `-2px 0 ${a}, 2px 0 ${b}`, duration: 0.035, repeat: 3, yoyo: true, ease: "none" })
    .set(el, { x: 0, textShadow: "none", clearProps: "x,textShadow,transform" });
}

/** Ligne laser qui balaie un panneau de haut en bas (confirmation d'une action). */
export async function laserScan(panel: HTMLElement) {
  if (!fxOn()) return;
  const { gsap } = await loadFx();
  const line = document.createElement("span");
  line.setAttribute("aria-hidden", "true");
  line.className = "fx-laser";
  if (getComputedStyle(panel).position === "static") panel.style.position = "relative";
  panel.appendChild(line);
  gsap
    .timeline({ onComplete: () => line.remove() })
    .fromTo(line, { top: "0%", opacity: 1 }, { top: "100%", duration: 0.5, ease: "power2.inOut" })
    .to(line, { opacity: 0, duration: 0.12 });
  gsap.fromTo(panel, { "--fx-flare": 1 }, { "--fx-flare": 0, duration: 0.6, ease: "power2.out", clearProps: "--fx-flare" });
}

/** Texte brouillé qui se décode (ScrambleText). L'élément ne doit contenir que du texte. */
export async function scramble(el: HTMLElement, text = el.textContent ?? "", duration = 0.6) {
  if (!fxOn() || !text.trim()) return;
  const { gsap } = await loadFx();
  gsap.to(el, { duration, scrambleText: { text, chars: SCRAMBLE_CHARS, revealDelay: 0.1, speed: 0.6 }, ease: "none" });
}

/** Lettres qui s'allument une à une, avec un scintillement de tube néon (SplitText). */
export async function lightUp(el: HTMLElement) {
  if (!fxOn()) return;
  const { gsap, SplitText } = await loadFx();
  const split = SplitText.create(el, { type: "chars", aria: "auto" });
  gsap
    .timeline({ onComplete: () => split.revert() })
    .from(split.chars, { opacity: 0, y: 6, filter: "blur(4px)", duration: 0.35, ease: "power3.out", stagger: { each: 0.022, from: "start" } })
    .to(split.chars, { opacity: 0.35, duration: 0.04, repeat: 1, yoyo: true, stagger: { each: 0.02, from: "random", amount: 0.25 } }, 0.25);
}

/** Texte tapé façon terminal (TextPlugin), curseur bloc pendant la frappe. */
export async function typewrite(el: HTMLElement, text = el.textContent ?? "", cps = 70) {
  if (!fxOn() || !text) return;
  const { gsap } = await loadFx();
  el.classList.add("fx-caret");
  gsap.fromTo(el, { text: "" }, { text: { value: text }, duration: Math.min(2.5, text.length / cps), ease: "none", onComplete: () => el.classList.remove("fx-caret") });
}

/** Ouverture d'une fenêtre : la projection se déplie depuis sa ligne médiane. */
export async function unfold(el: HTMLElement) {
  if (!fxOn()) return;
  const { gsap } = await loadFx();
  gsap.fromTo(el, { clipPath: "inset(48% 0 48% 0)", filter: "brightness(1.6)" }, { clipPath: "inset(0% 0 0% 0)", filter: "brightness(1)", duration: 0.32, ease: "power3.out", clearProps: "clipPath,filter" });
}

/** Éléments qui arrivent en cascade (changement de page d'une liste, nouveaux résultats). */
export async function cascade(els: Element[] | NodeListOf<Element> | HTMLCollection) {
  const list = Array.from(els);
  if (!fxOn() || list.length === 0) return;
  const { gsap } = await loadFx();
  gsap.from(list, { opacity: 0, y: 8, duration: 0.28, ease: "power2.out", stagger: Math.min(0.04, 0.4 / list.length), clearProps: "opacity,transform" });
}

/** Changement de page : trois bandes d'interférence traversent l'écran (≈ 220 ms). */
export async function interference() {
  if (!fxOn()) return;
  const { gsap } = await loadFx();
  const host = document.createElement("div");
  host.className = "fx-interference";
  host.setAttribute("aria-hidden", "true");
  const bands = Array.from({ length: 3 }, () => {
    const b = document.createElement("span");
    b.style.top = `${10 + Math.random() * 75}%`;
    b.style.height = `${2 + Math.random() * 10}px`;
    host.appendChild(b);
    return b;
  });
  document.body.appendChild(host);
  gsap
    .timeline({ onComplete: () => host.remove() })
    .fromTo(bands, { xPercent: -30, opacity: 0.9 }, { xPercent: 30, opacity: 0, duration: 0.22, ease: "steps(4)", stagger: 0.03 });
}

const BOOT_KEY = "cosmic-empires:booted";
const BOOT_LINES = ["LIAISON SUBSPATIALE ............ OK", "CHIFFREMENT QUANTIQUE ......... OK", "TÉLÉMÉTRIE DE L'EMPIRE ........ OK", "POSTE DE COMMANDEMENT EN LIGNE"];

/** Séquence d'amorçage du poste de commandement : une fois par session, ≈ 1,4 s, un clic la passe. */
export async function bootSequence() {
  try {
    if (!fxOn() || sessionStorage.getItem(BOOT_KEY)) return;
    sessionStorage.setItem(BOOT_KEY, "1");
  } catch {
    return;
  }
  const { gsap } = await loadFx();
  const root = document.createElement("div");
  root.className = "fx-boot";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `<div style="width:min(30rem,86vw)"><div class="fx-boot-lines" style="font-size:12px;letter-spacing:.18em;line-height:2"></div><div style="margin-top:14px;height:2px;background:color-mix(in srgb,var(--color-cyan-glow) 15%,transparent)"><div class="fx-boot-bar" style="height:100%;width:0;background:var(--color-cyan-glow);box-shadow:0 0 12px var(--color-cyan-glow)"></div></div></div>`;
  document.body.appendChild(root);
  const lines = root.querySelector(".fx-boot-lines") as HTMLElement;
  const rows = BOOT_LINES.map((t, i) => {
    const row = document.createElement("div");
    row.style.opacity = i === BOOT_LINES.length - 1 ? "1" : "0.75";
    lines.appendChild(row);
    return { row, t };
  });
  const tl = gsap.timeline({ onComplete: () => root.remove() });
  rows.forEach(({ row, t }, i) => tl.to(row, { duration: 0.24, text: { value: t }, ease: "none" }, i * 0.22));
  tl.to(root.querySelector(".fx-boot-bar"), { width: "100%", duration: 1, ease: "power2.inOut" }, 0)
    .to(root, { clipPath: "inset(50% 0 50% 0)", duration: 0.28, ease: "power3.in" }, 1.1);
  root.addEventListener("pointerdown", () => tl.progress(1), { once: true });
}

/** Alerte critique : le panneau « décroche » brièvement toutes les ~2 s (glitch rouge). Renvoie l'arrêt. */
export function alarmGlitch(el: HTMLElement): () => void {
  let stop = false;
  let kill: (() => void) | null = null;
  void (async () => {
    if (!fxOn()) return;
    const { gsap } = await loadFx();
    if (stop) return;
    const d = token("--th-danger"), a = token("--th-accent2");
    const tl = gsap
      .timeline({ repeat: -1, repeatDelay: 1.6 })
      .to(el, { x: -4, skewX: 6, textShadow: `3px 0 ${d}, -3px 0 ${a}`, duration: 0.05, ease: "none" })
      .to(el, { x: 3, skewX: -4, clipPath: "inset(20% 0 35% 0)", duration: 0.05, ease: "none" })
      .to(el, { x: 0, skewX: 0, textShadow: "0 0 0 transparent", clipPath: "inset(0% 0 0% 0)", duration: 0.06, ease: "none" });
    kill = () => {
      tl.kill();
      gsap.set(el, { clearProps: "x,skewX,textShadow,clipPath,transform" });
    };
  })();
  return () => {
    stop = true;
    kill?.();
  };
}
