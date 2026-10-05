import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Rocket } from "lucide-react";
import { Starfield } from "@/components/layout/Starfield";
import { Nebula } from "@/components/layout/Nebula";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CornerBrackets } from "@/components/ui/corner-brackets";
import { chooseFirstPseudo } from "@/services/oauthService";
import { logout } from "@/services/authService";
import { RENAME_RULES } from "@/game/rename";

/** v5.9 : compte ouvert par Google, pas encore de pseudo ni d'empire. */
export function ChoosePseudoScreen() {
  const [pseudo, setPseudo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await chooseFirstPseudo(pseudo);
      toast.success(`Bienvenue, commandant ${pseudo.trim()} !`);
    } catch (err) {
      toast.error((err as { message?: string })?.message || "Pseudo refusé.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <Nebula />
      <Starfield count={140} />
      <form onSubmit={submit} className="hud-cut relative z-10 flex w-full max-w-sm flex-col gap-4 border border-cyan-glow/25 bg-space-950/80 p-6 backdrop-blur">
        <CornerBrackets />
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center bg-cyan-glow/10 text-cyan-glow">
            <Rocket className="h-5 w-5" />
          </span>
          <div>
            <p className="hud-eyebrow text-cyan-glow">Dernière étape</p>
            <h1 className="font-display text-xl text-slate-100">Choisis ton pseudo</h1>
          </div>
        </div>
        <p className="text-sm text-slate-400">C'est le nom que les autres commandants verront au classement, dans les alliances et les rapports de combat.</p>
        <Input autoFocus value={pseudo} onChange={(e) => setPseudo(e.target.value)} placeholder="Pseudo" maxLength={RENAME_RULES.maxLength} aria-label="Pseudo" autoComplete="nickname" />
        <p className="-mt-2 text-xs text-slate-500">{RENAME_RULES.minLength} à {RENAME_RULES.maxLength} caractères : lettres, chiffres, - ou _.</p>
        <Button type="submit" size="lg" disabled={busy || pseudo.trim().length < RENAME_RULES.minLength}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fonder mon empire"}
        </Button>
        <button type="button" onClick={logout} className="text-center text-xs text-slate-500 transition hover:text-cyan-glow">
          Annuler et me déconnecter
        </button>
      </form>
    </div>
  );
}
