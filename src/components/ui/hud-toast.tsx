import { Toaster } from "sonner";

/* =====================================================
   Toasts du HUD (docs/DESIGN.md) : panneau à coin coupé, liseré gauche et
   icône de la couleur sémantique, titre en capitales, bouton d'action en
   pastille. Le ton suit le type (succès = mint, erreur = danger,
   avertissement = ember, info = accent) ; une notification de jeu passe
   son propre ton avec `className: "hud-tone-…"` (voir notificationStyle).
===================================================== */

export function HudToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      expand
      visibleToasts={4}
      closeButton
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "hud-toast",
          title: "hud-toast-title",
          description: "hud-toast-description",
          icon: "hud-toast-icon",
          actionButton: "hud-toast-action",
          cancelButton: "hud-toast-cancel",
          closeButton: "hud-toast-close",
          success: "hud-tone-mint",
          error: "hud-tone-danger",
          warning: "hud-tone-ember",
          info: "hud-tone-accent",
          loading: "hud-tone-neutral",
        },
      }}
    />
  );
}
