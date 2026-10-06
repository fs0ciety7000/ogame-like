import { installWebVitals } from "@/lib/webVitals";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./lib/theme";
import "./lib/density";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { startContentSync } from "./services/contentService";
import { installErrorReporter } from "./services/errorReporter";
import { rememberSponsorFromUrl } from "./services/referralService";
import { reloadForUpdate } from "./lib/updateReload";

// « Application URL » de PocketBase saisie avec un / final : ses liens
// d'email arrivent en //reset-password, que le routeur ne reconnaîtrait pas.
if (window.location.pathname.startsWith("//")) {
  const { pathname, search, hash } = window.location;
  window.history.replaceState(null, "", pathname.replace(/^\/+/, "/") + search + hash);
}

// v4.3.2 : chargement à la demande d'une page dont le fichier a disparu
// avec la dernière mise à jour (onglet resté ouvert) : on recharge une fois.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForUpdate()) event.preventDefault();
});
// La version rechargée a fait son travail : on retire le paramètre de l'adresse.
if (new URLSearchParams(window.location.search).has("v")) {
  const url = new URL(window.location.href);
  url.searchParams.delete("v");
  window.history.replaceState(null, "", url.pathname + url.search + url.hash);
}

// v4.1 : lien de parrainage (?parrain=<uid>) gardé jusqu'à l'inscription.
rememberSponsorFromUrl();

// Contenu du jeu (bâtiments, unités, technos…) personnalisé dans l'administration.
startContentSync();

// Erreurs JavaScript remontées à l'équipe sous forme de signalements automatiques.
installErrorReporter();
// 5.26 : performances réelles (Web Vitals), un chargement sur quatre.
installWebVitals();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
