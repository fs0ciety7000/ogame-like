import { fxOn, glitch, laserScan, loadFx, scramble } from "@/lib/fx/uiFx";

/* 5.25 : retour visuel global, par délégation (aucun composant à modifier) :
   - tout clic sur un bouton, un onglet ou un lien d'action : glitch RVB bref ;
   - bouton d'action principal dans un panneau : ligne laser sur le panneau ;
   - survol d'un lien de navigation : libellé brouillé puis décodé ;
   - panneau qui entre à l'écran pour la première fois : il s'allume comme un écran
     (scintillement + balayage), au plus 12 par page, en cascade. */

const CLICKABLE = "button, [role='button'], [role='tab'], a.hud-btn, [data-fx='click']";
// Libellés fixes seulement (React garde la main sur le texte : pas de compteurs vivants).
const HOVER_TEXT = "nav a, aside a";

/** Dernier nœud texte non vide d'un élément (les libellés côtoient souvent une icône). */
function labelOf(el: Element): HTMLElement | null {
  const spans = el.querySelectorAll("span");
  for (let i = spans.length - 1; i >= 0; i--) {
    const s = spans[i] as HTMLElement;
    if (s.childElementCount === 0 && (s.textContent ?? "").trim().length > 1) return s;
  }
  return el.childElementCount === 0 && (el.textContent ?? "").trim().length > 1 ? (el as HTMLElement) : null;
}

const hovering = new WeakSet<Element>();
let seen = new WeakSet<Element>();
let lit = 0;
let io: IntersectionObserver | null = null;

async function lightPanel(panel: HTMLElement) {
  if (!fxOn() || lit >= 12) return;
  const i = lit++;
  const { gsap } = await loadFx();
  gsap
    .timeline({ delay: Math.min(0.5, i * 0.05) })
    .fromTo(panel, { opacity: 0.25 }, { opacity: 1, duration: 0.18, ease: "steps(3)" })
    .to(panel, { opacity: 0.7, duration: 0.04, yoyo: true, repeat: 1 })
    .set(panel, { clearProps: "opacity" });
}

function observePanels() {
  if (!io) return;
  document.querySelectorAll(".glass-panel").forEach((p) => {
    if (!seen.has(p)) {
      seen.add(p);
      io!.observe(p);
    }
  });
}

/** À appeler à chaque changement de page : les panneaux de la nouvelle page s'allument. */
export function resetPanelLighting() {
  seen = new WeakSet();
  lit = 0;
  requestAnimationFrame(observePanels);
}

export function installUiFx(): () => void {
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 || !fxOn()) return;
    const target = (e.target as Element | null)?.closest(CLICKABLE) as HTMLElement | null;
    if (!target || target.closest("[data-fx='none']") || (target as HTMLButtonElement).disabled) return;
    void glitch(target);
    if (target.matches(".hud-btn-primary, [data-fx-scan]")) {
      const panel = target.closest(".glass-panel, [data-fx-panel]") as HTMLElement | null;
      if (panel) void laserScan(panel);
    }
  };
  const onOver = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !fxOn()) return;
    const link = (e.target as Element | null)?.closest(HOVER_TEXT);
    if (!link || hovering.has(link)) return;
    const label = labelOf(link);
    if (!label) return;
    hovering.add(link);
    const text = label.dataset.fxText ?? label.textContent ?? "";
    label.dataset.fxText = text;
    void scramble(label, text, 0.35).finally(() => setTimeout(() => hovering.delete(link), 400));
  };
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointerover", onOver, { passive: true });

  io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        io?.unobserve(en.target);
        void lightPanel(en.target as HTMLElement);
      }
    },
    { threshold: 0.15 },
  );
  // Regroupé par image : le DOM change souvent (compteurs à la seconde).
  let queued = false;
  const mo = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      observePanels();
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
  observePanels();
  return () => {
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("pointerover", onOver);
    mo.disconnect();
    io?.disconnect();
    io = null;
  };
}

