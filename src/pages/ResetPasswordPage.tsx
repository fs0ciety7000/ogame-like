import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ClientResponseError } from "pocketbase";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Starfield } from "@/components/layout/Starfield";
import { Nebula } from "@/components/layout/Nebula";
import { SchematicGrid } from "@/components/layout/SchematicGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CornerBrackets } from "@/components/ui/corner-brackets";
import { confirmPasswordReset, translateAuthError, validatePassword } from "@/services/authService";

/** Page ouverte depuis le lien de l'email « mot de passe oublié » envoyé
 *  par PocketBase ({APP_URL}/reset-password?token=…, voir le modèle
 *  d'email de la collection users). Accessible connecté ou non. */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validatePassword(password);
    if (error) return toast.error(error);
    if (password !== confirm) return toast.error("Les deux mots de passe ne correspondent pas.");

    setLoading(true);
    try {
      await confirmPasswordReset(token, password);
      toast.success("Mot de passe mis à jour. Tu peux maintenant te connecter.");
      navigate("/", { replace: true });
    } catch (err) {
      const fields = err instanceof ClientResponseError ? ((err.response?.data ?? {}) as Record<string, unknown>) : {};
      toast.error(
        fields.token || (err instanceof ClientResponseError && err.status === 400 && !fields.password)
          ? "Ce lien est invalide ou a expiré. Refais une demande de mot de passe oublié."
          : translateAuthError(err),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <SchematicGrid />
      <Nebula />
      <Starfield count={160} />

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-6 text-center">
          <p className="font-display text-2xl text-slate-100">Cosmic Empires</p>
          <p className="text-sm text-slate-400">Choisis un nouveau mot de passe.</p>
        </div>

        {!token ? (
          <div className="glass-panel hud-cut flex flex-col gap-3 p-6 text-center">
            <CornerBrackets />
            <p className="text-sm text-slate-300">Ce lien de réinitialisation est incomplet.</p>
            <p className="text-xs text-slate-500">Ouvre le lien reçu par email tel quel, ou refais une demande.</p>
            <Link to="/" className="text-xs text-cyan-glow hover:underline">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-panel hud-cut flex flex-col gap-3 p-6">
            <CornerBrackets />
            <p className="hud-eyebrow flex items-center gap-2 text-slate-500">
              <KeyRound className="h-3.5 w-3.5" /> Nouveau mot de passe
            </p>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe (8 caractères min.)"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirme le mot de passe"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <Button type="submit" size="lg" disabled={loading} className="mt-1">
              {loading ? "…" : "Enregistrer"}
            </Button>
            <Link to="/" className="mt-1 text-center text-xs text-slate-400 transition hover:text-cyan-glow">
              Retour à la connexion
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
