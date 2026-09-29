import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

// « Application URL » de PocketBase saisie avec un / final : ses liens
// d'email arrivent en //reset-password, que le routeur ne reconnaîtrait pas.
if (window.location.pathname.startsWith("//")) {
  const { pathname, search, hash } = window.location;
  window.history.replaceState(null, "", pathname.replace(/^\/+/, "/") + search + hash);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
