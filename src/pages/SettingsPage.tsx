import { useState } from "react";
import { setEmailOptOut, setNotifPrefs } from "@/services/mailService";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AlertTriangle, Bell, BellOff, Palmtree, ShieldCheck, ShieldAlert } from "lucide-react";
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
import { onboardingEligible, onboardingState } from "@/game/onboarding";
import { setTipsEnabled, tipsEnabled } from "@/components/game/PageTip";
import { GameActionError, hideOnboarding, syncPlayer } from "@/services/playerService";
import { endVacation, startVacation } from "@/services/warlordService";
import { onVacation, VACATION_RULES } from "@/game/vacation";
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

/** v3.9.2 : nouvelles du jeu par e-mail. */
function EmailNewsCard() {
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const on = !player.emailOptOut;
  const toggle = async () => {
    setBusy(true);
    try {
      await setEmailOptOut(player.uid, on);
      usePlayerStore.setState({ player: { ...player, emailOptOut: on } });
      toast.success(on ? "Tu ne recevras plus nos nouvelles par e-mail." : "Nouvelles par e-mail réactivées.");
    } catch {
      toast.error("Réglage impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelles par e-mail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-slate-400">Les grandes mises à jour du jeu, quelques fois par mois au plus. Jamais de publicité.</p>
        <Button variant={on ? "outline" : "primary"} disabled={busy} onClick={() => void toggle()}>
          {on ? <BellOff className="mr-1.5 h-4 w-4" /> : <Bell className="mr-1.5 h-4 w-4" />}
          {on ? "Ne plus recevoir" : "Recevoir les nouvelles"}
        </Button>
      </CardContent>
    </Card>
  );
}

/** v4.0 : notifications d'alliance (canal, diplomatie, annonces). */
const ALLIANCE_NOTIFS = [
  { key: "allianceChat", label: "Messages du canal d'alliance", hint: "Pastille de messages non lus dans le menu." },
  { key: "pactMessages", label: "Canal diplomatique", hint: "Notification quand une alliance liée par un pacte écrit." },
  { key: "allianceEvents", label: "Annonces de l'alliance", hint: "Pactes proposés ou rompus, guerres, déclarations." },
  { key: "warlords", label: "Messages des seigneurs de guerre", hint: "Provocations et répliques des empires tenus par le jeu (une par jour au plus)." },
] as const;

function AllianceNotifsCard() {
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const prefs = player.notifPrefs ?? {};
  const toggle = async (key: (typeof ALLIANCE_NOTIFS)[number]["key"]) => {
    const next = { ...prefs, [key]: prefs[key] === false };
    setBusy(true);
    try {
      await setNotifPrefs(player.uid, next);
      usePlayerStore.setState({ player: { ...player, notifPrefs: next } });
    } catch {
      toast.error("Réglage impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications de messages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {ALLIANCE_NOTIFS.map((n) => (
          <label key={n.key} className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-slate-200">{n.label}</span>
              <span className="text-xs text-slate-500">{n.hint}</span>
            </span>
            <input type="checkbox" className="h-4 w-4 shrink-0 accent-cyan-400" checked={prefs[n.key] !== false} disabled={busy} onChange={() => void toggle(n.key)} />
          </label>
        ))}
      </CardContent>
    </Card>
  );
}


/** v4.2 : mode vacances (2 à 21 jours, production au quart, aucune attaque). */
function VacationCard() {
  const player = usePlayerStore((s) => s.player);
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!player) return null;
  const now = Date.now();
  const v = player.vacation;
  const away = onVacation(player, now);
  const canReturnAt = v ? v.startedAtMs + VACATION_RULES.minStayHours * 3600_000 : 0;
  const lastEnd = v?.endedAtMs ?? v?.untilMs ?? 0;
  const cooldownUntil = !away && lastEnd > 0 ? lastEnd + VACATION_RULES.cooldownDays * 86400_000 : 0;
  const run = async (task: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await task();
      await syncPlayer(player.uid);
      toast.success(ok);
      setConfirm(false);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };
  const fmt = (ms: number) => new Date(ms).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palmtree className="h-4 w-4 text-cyan-glow" /> Mode vacances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {away && v ? (
          <>
            <p className="text-slate-200">
              Tu es en vacances jusqu'au <strong>{fmt(v.untilMs)}</strong>. Personne ne peut t'attaquer, ta production tourne à {Math.round(VACATION_RULES.productionFactor * 100)} % et tes chantiers sont en pause.
            </p>
            <Button variant="secondary" disabled={busy || now < canReturnAt} onClick={() => void run(() => endVacation(), "Bon retour, commandant !")}>
              Revenir maintenant
            </Button>
            {now < canReturnAt && <p className="text-xs text-slate-500">Retour anticipé possible à partir du {fmt(canReturnAt)}.</p>}
          </>
        ) : (
          <>
            <p className="text-slate-400">
              Tu pars quelques jours ? Déclare ton absence : aucune attaque (joueurs, seigneurs, factions), production à {Math.round(VACATION_RULES.productionFactor * 100)} %, constructions, recherches et missions gelées puis reprises à ton retour.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 border border-cyan-glow/30 bg-space-950 px-2 text-sm text-slate-200" aria-label="Durée des vacances">
                {Array.from({ length: VACATION_RULES.maxDays - VACATION_RULES.minDays + 1 }, (_, i) => i + VACATION_RULES.minDays).map((d) => (
                  <option key={d} value={d}>
                    {d} jours
                  </option>
                ))}
              </select>
              <Button disabled={busy || cooldownUntil > now} onClick={() => setConfirm(true)}>
                Partir en vacances
              </Button>
            </div>
            {cooldownUntil > now && <p className="text-xs text-slate-500">Prochaines vacances possibles à partir du {fmt(cooldownUntil)}.</p>}
            <p className="text-xs text-slate-500">
              Il faut que toutes tes flottes soient à quai, sans flotte hostile en approche, sans ultimatum en cours, et ne pas avoir été attaqué dans les {VACATION_RULES.recentAttackHours} dernières heures. Retour anticipé après {VACATION_RULES.minStayHours} h, puis {VACATION_RULES.cooldownDays} jours d'attente avant les prochaines.
            </p>
          </>
        )}
        <Dialog open={confirm} onOpenChange={setConfirm}>
          <DialogContent className="max-w-md">
            <DialogTitle>Partir {days} jours ?</DialogTitle>
            <p className="text-sm text-slate-300">
              Pendant ce temps, tu ne pourras ni construire, ni lancer de flotte, ni échanger au marché. Ta base sera protégée de toute attaque jusqu'au {fmt(now + days * 86400_000)}.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirm(false)}>
                Annuler
              </Button>
              <Button disabled={busy} onClick={() => void run(() => startVacation(days), "Bonnes vacances ! Ta base est protégée.")}>
                Confirmer le départ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

/** Thème d'interface (propre à cet appareil). */
function HelpCard() {
  const player = usePlayerStore((s) => s.player);
  const [tips, setTips] = useState(tipsEnabled);
  const hidden = player ? onboardingState(player).hidden === true : false;
  const eligible = player ? onboardingEligible(player) : false;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aide et prise en main</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <label className="flex items-center justify-between gap-3">
          <span className="text-slate-300">Bulles d'aide sur les pages (débutants)</span>
          <input
            type="checkbox"
            checked={tips}
            onChange={(e) => {
              setTipsEnabled(e.target.checked, e.target.checked);
              setTips(e.target.checked);
              toast.success(e.target.checked ? "Les bulles d'aide réapparaîtront sur chaque page." : "Bulles d'aide désactivées.");
            }}
          />
        </label>
        {eligible && hidden && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              void hideOnboarding(false)
                .then(() => toast.success("Les objectifs de prise en main sont de retour sur l'accueil."))
                .catch((err) => toast.error(err instanceof GameActionError ? err.message : "Action impossible."))
            }
          >
            Réafficher les objectifs de prise en main
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

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
      <HelpCard />
      <BrowserNotificationsCard />
      <VacationCard />
      <AllianceNotifsCard />
      <EmailNewsCard />
      <ChangePasswordCard />
      <DangerZoneCard />
    </div>
  );
}
