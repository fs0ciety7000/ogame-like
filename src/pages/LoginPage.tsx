import { UpcomingMaintenanceNotice } from "@/components/layout/MaintenanceBanner";
import { AnnouncementBanners } from "@/components/layout/AnnouncementBanners";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Starfield } from "@/components/layout/Starfield";
import { Nebula } from "@/components/layout/Nebula";
import { SchematicGrid } from "@/components/layout/SchematicGrid";
import { HoloCylinderLazy, useDeferredDecor } from "@/components/fx/HoloCylinderLazy";
import { UNITS } from "@/game/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusDot } from "@/components/ui/status-dot";
import { CornerBrackets } from "@/components/ui/corner-brackets";
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
import { pbConfigured } from "@/lib/pocketbase";
import { assetUrl } from "@/lib/assets";
import { REFERRAL_RULES } from "@/game/referral";
import { BlogLatest } from "@/components/blog/BlogLatest";
import { TrailerCard } from "@/components/auth/TrailerCard";
import { AltSignIn } from "@/components/auth/AltSignIn";
import { BLOG_URL } from "@/services/blogService";
import { claimPendingSponsor, fetchSponsorName, pendingSponsor } from "@/services/referralService";

type Mode = "login" | "register" | "forgot";

interface FormValues {
  pseudo: string;
  email: string;
  password: string;
}

/** Unités de la roue d'accueil : une sur deux, pour varier les silhouettes. */
const LOGIN_REEL = UNITS.filter((_, i) => i % 2 === 0).slice(0, 16).map((u) => ({ id: u.id, image: u.image, label: u.name }));

export function LoginPage() {
  const decor3d = useDeferredDecor();
  // v4.7.1 : un lien de parrainage ouvre directement l'inscription.
  const [mode, setMode] = useState<Mode>(() => (pendingSponsor() ? "register" : "login"));
  const [sponsorName, setSponsorName] = useState<string | null>(null);
  useEffect(() => {
    const id = pendingSponsor();
    if (id) void fetchSponsorName(id).then(setSponsorName);
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    if (mode === "forgot") {
      const emailError = validateEmail(values.email);
      if (emailError) return toast.error(emailError);
      setSubmitting(true);
      try {
        await requestPasswordReset(values.email);
        toast.success("Si un compte utilise cet email, un lien vient d'y être envoyé (pense aux spams).");
        setMode("login");
      } catch (err) {
        if (err instanceof NoRecoveryEmailError) {
          toast.error("Entre l'adresse email de ton compte.");
        } else {
          toast.error("Impossible d'envoyer l'email pour le moment. Réessaie plus tard.");
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // En connexion, le champ accepte le pseudo ou l'email du compte.
    if (mode === "register" || !values.pseudo.includes("@")) {
      const pseudoError = validatePseudo(values.pseudo);
      if (pseudoError) return toast.error(pseudoError);
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
        const sponsor = await claimPendingSponsor();
        toast.success("Empire créé avec succès !", {
          description: sponsor
            ? `Parrain : ${sponsor}. Confirme ton e-mail (lien envoyé) et atteins Bronze I : vous recevrez tous les deux de l'Ambre.`
            : "Un lien de confirmation t'a été envoyé par e-mail.",
        });
      }
    } catch (err) {
      toast.error(translateAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 lg:px-12">
      <SchematicGrid />
      <Nebula />
      <Starfield count={160} />
      {/* 5.24 : cylindre holographique ralenti et flouté derrière le formulaire ; 6.14.39 : grand écran seulement, après le chargement. */}
      {decor3d && (
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-60 blur-[3px]">
          <HoloCylinderLazy mode="background" items={LOGIN_REEL} className="h-full w-full" />
        </div>
      )}
      <div className="absolute inset-x-0 top-0 z-30">
        <AnnouncementBanners publicOnly />
      </div>

      {/* 6.14.53 (AD-3) : une colonne sur mobile, enfants en min-w-0 (sinon la colonne prend la largeur de son contenu et
          l'overflow-hidden du parent coupe le formulaire à droite). */}
      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_420px]">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden min-w-0 lg:block"
        >
          <StatusDot label="Réseau stellaire actif" />
          <h1 className="mt-5 font-display text-5xl leading-[1.05] text-slate-100 glow-text xl:text-6xl">
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
                <span className="block font-display text-xl text-slate-100">{stat.value}</span>
                <span className="hud-eyebrow text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
          <TrailerCard className="mt-8 max-w-md" />
          <BlogLatest className="mt-8 max-w-md" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full min-w-0 max-w-sm justify-self-center lg:justify-self-end"
        >
          {/* 6.14.53 (AD-4) : sur mobile, le logo du jeu et le slogan du bureau, en court. */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
            <img
              src={assetUrl("/assets/logo/logo.webp")}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 object-contain drop-shadow-[0_0_10px_color-mix(in_srgb,var(--color-cyan-glow)_35%,transparent)]"
            />
            <h1 className="font-display text-3xl tracking-wide text-slate-100 glow-text">Cosmic Empires</h1>
            <p className="font-display text-lg tracking-wide text-slate-100">
              BÂTIS. CONQUIERS. <span className="text-cyan-glow">RÈGNE.</span>
            </p>
            <p className="text-sm text-slate-400">Économie, flotte et combats contre d'autres commandants, en temps réel.</p>
          </div>

          {!pbConfigured && (
            <div className="hud-callout hud-tone-gold mb-4 px-3 py-2 text-xs text-gold-glow">
              Serveur PocketBase non configuré — copie <code>.env.example</code> en <code>.env.local</code> et renseigne{" "}
              <code>VITE_POCKETBASE_URL</code>.
            </div>
          )}

          {sponsorName && mode === "register" && (
            <div className="hud-callout hud-tone-gold mb-4 flex items-center gap-2 px-3 py-2 text-xs text-gold-glow">
              <UserPlus className="h-4 w-4 shrink-0" />
              <span>
                Invité par <strong>{sponsorName}</strong> : crée ton empire, confirme ton e-mail et atteins Bronze I pour recevoir {REFERRAL_RULES.amberRecruit} Ambre (ton parrain aussi).
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="glass-panel hud-cut flex flex-col gap-3 p-6">
            <CornerBrackets />
            <p className="hud-eyebrow hidden text-slate-500 lg:block">
              {mode === "login" ? "Accès commandement" : mode === "register" ? "Nouvel empire" : "Récupération"}
            </p>
          {mode === "forgot" && (
            <p className="text-xs text-slate-400">
              Entre l'email de ton compte : on t'y enverra un lien pour choisir un nouveau mot de passe.
            </p>
          )}

          {mode !== "forgot" && (
            <div>
              <Input
                placeholder={mode === "login" ? "Pseudo ou email" : "Nom du joueur"}
                autoComplete="username"
                {...register("pseudo", { required: true })}
              />
              {errors.pseudo && <p className="mt-1 text-xs text-danger-glow">Pseudo requis.</p>}
            </div>
          )}

          {mode !== "login" && (
            <div>
              <Input
                type="email"
                placeholder={mode === "register" ? "Email (pour récupérer ton compte)" : "Email du compte"}
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
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
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

          {/* 6.14.53 (AD-4) : l'inscription, action principale d'un visiteur, devient un vrai bouton sous « Connexion ». */}
          {mode === "login" && (
            <Button type="button" variant="secondary" size="md" className="w-full" onClick={() => setMode("register")}>
              <UserPlus className="h-4 w-4" />
              Créer mon empire
            </Button>
          )}

          {mode === "login" && (
            <button
              type="button"
              className="text-center text-xs text-slate-500 transition hover:text-cyan-glow"
              onClick={() => setMode("forgot")}
            >
              Mot de passe oublié ?
            </button>
          )}

          {mode !== "forgot" && <AltSignIn />}

          {mode !== "login" && (
            <button
              type="button"
              className="mt-1 text-center text-xs text-slate-400 transition hover:text-cyan-glow"
              onClick={() => setMode("login")}
            >
              {mode === "register" ? "Déjà un empire ? Connecte-toi" : "Retour à la connexion"}
            </button>
          )}
        </form>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">
          <a href="/bible/index.html" className="transition hover:text-cyan-glow">
            Bible visuelle du jeu
          </a>
          <span aria-hidden className="text-slate-700">·</span>
          <a href={BLOG_URL} target="_blank" rel="noopener" className="transition hover:text-cyan-glow">
            Devblog
          </a>
          <span aria-hidden className="text-slate-700">·</span>
          <a href="/confidentialite.html" className="transition hover:text-cyan-glow">
            Confidentialité
          </a>
          <span aria-hidden className="text-slate-700">·</span>
          <a href="/statut" className="transition hover:text-cyan-glow">
            Statut
          </a>
        </div>
        <UpcomingMaintenanceNotice className="mt-4 border" />
        <TrailerCard className="mt-6 lg:hidden" />
        <BlogLatest className="mt-6 lg:hidden" />
        </motion.div>
      </div>
    </div>
  );
}
