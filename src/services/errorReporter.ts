import { pb } from "@/lib/pocketbase";
import { CURRENT_VERSION } from "@/lib/changelog";
import { errorKey, isIgnoredError } from "@/game/errorReports";

/* Erreurs JavaScript remontées automatiquement à l'équipe (v2.8) : le
   serveur les regroupe en signalements « Bug (auto) ». Une même erreur
   n'est envoyée qu'une fois par session, et seulement si on est connecté. */

const sent = new Set<string>();
let installed = false;

/** `componentStack` (erreurs de rendu) : composants React en cause, joints à la pile. */
export function reportClientError(error: unknown, fallbackMessage = "", componentStack = "") {
  try {
    if (!pb.authStore.isValid) return;
    const err = error instanceof Error ? error : null;
    const message = (err ? `${err.name}: ${err.message}` : String(error ?? fallbackMessage)).slice(0, 300);
    const components = componentStack.trim() ? `\n\nComposants :\n${componentStack.trim().split("\n").slice(0, 12).join("\n")}` : "";
    const stack = ((err?.stack ?? "").slice(0, 3000 - Math.min(components.length, 1400)) + components.slice(0, 1400)).slice(0, 3000);
    if (!message || isIgnoredError(message, stack)) return;
    const key = errorKey(message, stack);
    if (sent.has(key) || sent.size >= 20) return;
    sent.add(key);
    void pb
      .send("/api/cosmic/reports/error", {
        method: "POST",
        body: { message, stack, page: window.location.pathname, version: CURRENT_VERSION ?? "" },
        requestKey: null,
      })
      .catch(() => undefined);
  } catch {
    /* ne jamais faire planter le jeu en signalant une erreur */
  }
}

export function installErrorReporter() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (ev) => reportClientError(ev.error ?? ev.message, String(ev.message ?? "")));
  window.addEventListener("unhandledrejection", (ev) => reportClientError(ev.reason));
}
