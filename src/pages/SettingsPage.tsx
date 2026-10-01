import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AlertTriangle, Bell, BellOff, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { setTheme, THEMES, useThemeStore } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { setBrowserNotifications, showBrowserNotification, useBrowserNotifyStore } from "@/store/browserNotifyStore";
import { changePassword, deleteAccount, hasRecoveryEmail, translateAuthError, validatePassword } from "@/services/authService";

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function ChangePasswordCard() {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, reset } = useForm<PasswordFormValues>();

  const onSubmit = async (values: PasswordFormValues) => {
    const passwordError = validatePassword(values.newPassword);
    if (passwordError) return toast.error(passwordError);
    if (values.newPassword !== values.confirmPassword) return toast.error("Les mots de passe ne correspondent pas.");

    setSubmitting(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      toast.success("Mot de passe mis à jour.");
      reset();
    } catch (err) {
      toast.error(translateAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changer le mot de passe</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input
            type="password"
            placeholder="Mot de passe actuel"
            autoComplete="current-password"
            {...register("currentPassword", { required: true })}
          />
          <Input
            type="password"
            placeholder="Nouveau mot de passe"
            autoComplete="new-password"
            {...register("newPassword", { required: true })}
          />
          <Input
            type="password"
            placeholder="Confirme le nouveau mot de passe"
            autoComplete="new-password"
            {...register("confirmPassword", { required: true })}
          />
          <Button type="submit" disabled={submitting} className="self-start">
            {submitting ? "…" : "Mettre à jour"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DangerZoneCard() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const player = usePlayerStore((s) => s.player);

  const handleDelete = async () => {
    if (!player) return;
    setSubmitting(true);
    try {
      await deleteAccount(password, player.pseudo);
      toast.success("Compte supprimé.");
    } catch (err) {
      toast.error(translateAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-danger-glow/20">
      <CardHeader>
        <CardTitle className="text-danger-glow">Zone dangereuse</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-slate-400">
          Supprime définitivement ton empire (ressources, bâtiments, unités, historique) ainsi que ton compte. Cette
          action est irréversible.
        </p>
        <Button variant="danger" onClick={() => setOpen(true)}>
          <AlertTriangle className="h-4 w-4" />
          Supprimer mon compte
        </Button>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="text-danger-glow">Supprimer définitivement ton compte ?</DialogTitle>
          <p className="mt-1 text-sm text-slate-400">
            Il n'y a pas de retour en arrière possible. Confirme ton mot de passe pour continuer.
          </p>
          <Input
            type="password"
            placeholder="Mot de passe"
            className="mt-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            variant="danger"
            className="mt-4 w-full"
            disabled={submitting || !password}
            onClick={() => void handleDelete()}
          >
            {submitting ? "Suppression…" : "Je confirme, supprimer mon compte"}
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function BrowserNotificationsCard() {
  const { enabled, permission } = useBrowserNotifyStore();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    try {
      const result = await setBrowserNotifications(!enabled);
      if (!enabled && result === "denied") toast.error("Notifications bloquées par le navigateur : autorise-les dans les réglages du site.");
      else if (!enabled && result === "unsupported") toast.error("Ce navigateur ne gère pas les notifications.");
      else if (!enabled && result === "granted") toast.success("Notifications activées.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications du navigateur</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-slate-400">
          Flotte hostile en approche, construction terminée, flotte rentrée… Une alerte système s'affiche quand le jeu est ouvert dans un onglet en
          arrière-plan.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={enabled ? "outline" : "primary"} disabled={busy || permission === "unsupported"} onClick={() => void toggle()}>
            {enabled ? <BellOff className="mr-1.5 h-4 w-4" /> : <Bell className="mr-1.5 h-4 w-4" />}
            {enabled ? "Désactiver" : "Activer les notifications"}
          </Button>
          {enabled && (
            <Button
              variant="ghost"
              onClick={() => {
                toast("Passe sur un autre onglet : la notification de test arrive dans 3 s.");
                setTimeout(() => showBrowserNotification("🛸 Test Cosmic Empires", "Les notifications fonctionnent."), 3000);
              }}
            >
              Tester
            </Button>
          )}
        </div>
        {permission === "denied" && <p className="text-xs text-danger-glow">Le navigateur bloque les notifications pour ce site.</p>}
        {permission === "unsupported" && <p className="text-xs text-slate-500">Ce navigateur ne gère pas les notifications.</p>}
      </CardContent>
    </Card>
  );
}

/** Thème d'interface (propre à cet appareil). */
function ThemeCard() {
  const theme = useThemeStore((s) => s.theme);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apparence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              className={cn(
                "hud-cut group flex flex-col gap-2 border p-3 text-left transition-colors",
                theme === t.id ? "border-cyan-glow/70 bg-cyan-glow/10" : "border-white/10 bg-white/[0.02] hover:border-cyan-glow/40",
              )}
            >
              <div className="flex gap-1">
                {t.swatches.map((c) => (
                  <span key={c} className="h-5 flex-1" style={{ background: c }} />
                ))}
              </div>
              <span className="flex items-center justify-between">
                <span className="hud-title text-sm text-white">{t.name}</span>
                {theme === t.id && <span className="font-mono text-[10px] tracking-[0.16em] text-cyan-glow">ACTIF</span>}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{t.inspiration}</span>
              <span className="text-xs text-slate-400">{t.description}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">Le choix s'applique tout de suite et reste mémorisé sur cet appareil.</p>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const player = usePlayerStore((s) => s.player);
  const recoveryOk = hasRecoveryEmail(user?.email);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Configuration" title="Réglages" description="Compte, sécurité et préférences." />

      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Pseudo</span>
            <span className="text-slate-100">{player?.pseudo ?? "…"}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Email de récupération</span>
            {recoveryOk ? (
              <span className="flex items-center gap-1.5 text-mint-glow">
                <ShieldCheck className="h-4 w-4" />
                {user?.email}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-gold-glow" title="Compte créé avant cette fonctionnalité">
                <ShieldAlert className="h-4 w-4" />
                Aucun
              </span>
            )}
          </div>
          {!recoveryOk && (
            <p className="text-xs text-slate-500">
              Ton compte a été créé avant l'ajout de la récupération par email : le mot de passe oublié n'est pas
              disponible pour l'instant. Change ton mot de passe ci-dessous si tu veux le mettre à jour pendant que tu
              es connecté.
            </p>
          )}
        </CardContent>
      </Card>

      <ThemeCard />
      <BrowserNotificationsCard />
      <ChangePasswordCard />
      <DangerZoneCard />
    </div>
  );
}
