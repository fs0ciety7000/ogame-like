import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Rocket, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Starfield } from "@/components/layout/Starfield";
import { Nebula } from "@/components/layout/Nebula";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusDot } from "@/components/ui/status-dot";
import {
  loginPlayer,
  NoRecoveryEmailError,
  registerPlayer,
  requestPasswordReset,
  translateAuthError,
  validateEmail,
  validatePassword,
  validatePseudo,
} from "@/services/authService";
import { firebaseConfigured } from "@/lib/firebase";

type Mode = "login" | "register" | "forgot";

interface FormValues {
  pseudo: string;
  email: string;
  password: string;
}

export function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    const pseudoError = validatePseudo(values.pseudo);
    if (pseudoError) return toast.error(pseudoError);

    if (mode === "forgot") {
      setSubmitting(true);
      try {
        await requestPasswordReset(values.pseudo);
        toast.success("Email envoyé ! Vérifie ta boîte de réception (et tes spams).");
        setMode("login");
      } catch (err) {
        if (err instanceof NoRecoveryEmailError) {
          toast.error(
            "Ce compte n'a pas d'email de récupération associé (créé avant l'ajout de cette fonctionnalité).",
          );
        } else {
          toast.error("Impossible d'envoyer l'email pour le moment. Réessaie plus tard.");
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "register") {
      const emailError = validateEmail(values.email);
      if (emailError) return toast.error(emailError);
      const passwordError = validatePassword(values.password);
      if (passwordError) return toast.error(passwordError);
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await loginPlayer(values.pseudo, values.password);
      } else {
        await registerPlayer(values.pseudo, values.email, values.password);
        toast.success("Empire créé avec succès !");
      }
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      toast.error(translateAuthError(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 lg:px-12">
      <Nebula />
      <Starfield count={160} />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_420px]">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden lg:block"
        >
          <StatusDot label="Réseau stellaire actif" />
          <h1 className="mt-5 font-display text-5xl leading-[1.05] text-white glow-text xl:text-6xl">
            BÂTIS.
            <br />
            CONQUIERS.
            <br />
            <span className="text-cyan-glow">RÈGNE.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm text-slate-400">
            Gère ton économie, développe ta flotte et affronte d'autres commandants en temps réel dans Cosmic
            Empires.
          </p>
          <div className="mt-10 flex gap-8">
            {[
              { value: "8", label: "Ressources" },
              { value: "∞", label: "Combats" },
              { value: "24/7", label: "Temps réel" },
            ].map((stat) => (
              <div key={stat.label}>
                <span className="block font-display text-xl text-white">{stat.value}</span>
                <span className="hud-eyebrow text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm justify-self-center lg:justify-self-end"
        >
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-glow/10 text-cyan-glow shadow-[0_0_30px_-8px_var(--color-cyan-glow)]">
              <Rocket className="h-7 w-7" />
            </div>
            <h1 className="font-display text-3xl tracking-wide text-white glow-text">Cosmic Empires</h1>
            <p className="text-sm text-slate-400">Bâtis ton empire. Recherche. Combats. En temps réel.</p>
          </div>

          {!firebaseConfigured && (
            <div className="mb-4 rounded-lg border border-gold-glow/30 bg-gold-glow/10 px-3 py-2 text-xs text-gold-glow">
              Configuration Firebase manquante — copie <code>.env.example</code> en <code>.env.local</code> et renseigne ton
              projet Firebase.
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="glass-panel flex flex-col gap-3 rounded-2xl p-6">
            <p className="hud-eyebrow hidden text-slate-500 lg:block">
              {mode === "login" ? "Accès commandement" : mode === "register" ? "Nouvel empire" : "Récupération"}
            </p>
          {mode === "forgot" && (
            <p className="text-xs text-slate-400">
              Entre ton pseudo : si un email de récupération y est associé, on t'y enverra un lien de réinitialisation.
            </p>
          )}

          <div>
            <Input placeholder="Nom du joueur" autoComplete="username" {...register("pseudo", { required: true })} />
            {errors.pseudo && <p className="mt-1 text-xs text-danger-glow">Pseudo requis.</p>}
          </div>

          {mode === "register" && (
            <div>
              <Input
                type="email"
                placeholder="Email (pour récupérer ton compte)"
                autoComplete="email"
                {...register("email", { required: true })}
              />
              {errors.email && <p className="mt-1 text-xs text-danger-glow">Email requis.</p>}
            </div>
          )}

          {mode !== "forgot" && (
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                {...register("password", { required: true })}
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
          )}

          <Button type="submit" size="lg" disabled={submitting} className="mt-1">
            {submitting
              ? "…"
              : mode === "login"
                ? "Connexion"
                : mode === "register"
                  ? "Créer mon empire"
                  : "Envoyer le lien"}
          </Button>

          {mode === "login" && (
            <button
              type="button"
              className="text-center text-xs text-slate-500 transition hover:text-cyan-glow"
              onClick={() => setMode("forgot")}
            >
              Mot de passe oublié ?
            </button>
          )}

          <button
            type="button"
            className="mt-1 text-center text-xs text-slate-400 transition hover:text-cyan-glow"
            onClick={() => setMode(mode === "register" ? "login" : mode === "forgot" ? "login" : "register")}
          >
            {mode === "login" && "Nouveau joueur ? Crée ton empire"}
            {mode === "register" && "Déjà un empire ? Connecte-toi"}
            {mode === "forgot" && "Retour à la connexion"}
          </button>
        </form>
        </motion.div>
      </div>
    </div>
  );
}
