import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./lib/theme";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { startContentSync } from "./services/contentService";
import { installErrorReporter } from "./services/errorReporter";
import { rememberSponsorFromUrl } from "./services/referralService";

// « Application URL » de PocketBase saisie avec un / final : ses liens
// d'email arrivent en //reset-password, que le routeur ne reconnaîtrait pas.
if (window.location.pathname.startsWith("//")) {
  const { pathname, search, hash } = window.location;
  window.history.replaceState(null, "", pathname.replace(/^\/+/, "/") + search + hash);
}

// v4.1 : lien de parrainage (?parrain=<uid>) gardé jusqu'à l'inscription.
rememberSponsorFromUrl();

// Contenu du jeu (bâtiments, unités, technos…) personnalisé dans l'administration.
startContentSync();

// Erreurs JavaScript remontées à l'équipe sous forme de signalements automatiques.
installErrorReporter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
