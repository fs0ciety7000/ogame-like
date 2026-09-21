import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
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
      const code = (err as { code?: string })?.code ?? "";
      toast.error(translateAuthError(code));
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
      const code = (err as { code?: string })?.code ?? "";
      toast.error(translateAuthError(code));
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

      <ChangePasswordCard />
      <DangerZoneCard />
    </div>
  );
}
