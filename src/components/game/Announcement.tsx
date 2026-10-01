import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Skull } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { accent } from "@/components/game/PirateUltimatum";
import { activeUltimatum, FACTIONS } from "@/game/pirates";
import { usePlayerStore } from "@/store/playerStore";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* =====================================================
   Annonces plein écran (style bande-annonce d'extension), affichées une
   seule fois par compte et par appareil. Pour en ajouter une : nouvelle
   entrée en tête de ANNOUNCEMENTS, avec un identifiant inédit.
===================================================== */

export interface Announcement {
  id: string;
  eyebrow: string;
  title: string;
  text: string;
  /** Factions mises en avant (illustrations en fond). */
  factions: string[];
  /** Illustration de fond quand l'annonce ne présente pas de factions. */
  art?: string;
  artMobile?: string;
  /** Nouveautés présentées en cartes cliquables. */
  features?: { title: string; text: string; to: string }[];
  cta: { label: string; to: string };
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "v3.2-le-leviathan-arrive",
    eyebrow: "Mise à jour 3.2 · Le grand déploiement",
    title: "Le Léviathan arrive vendredi",
    text: "Le premier week-end de chaque mois, un monstre colossal menace la galaxie : unissez vos flottes pour l'abattre et partager le butin. Et ce n'est pas tout — expéditions, marché, guerres d'alliance… voici tout ce qui change.",
    factions: [],
    art: "/assets/leviathan/leviathan.webp",
    artMobile: "/assets/leviathan/leviathan-portrait.webp",
    features: [
      { title: "Le Léviathan", text: "Vendredi 18 h → lundi 18 h. Un assaut toutes les 4 h, récompenses selon tes dégâts.", to: "/game/leviathan" },
      { title: "Expéditions", text: "2 à 8 h dans l'inconnu : gisements, épaves, embuscades, rencontres… et des choix.", to: "/game/missions" },
      { title: "Marché", text: "Échange tes surplus avec les autres commandants, sans passer par le comptoir.", to: "/game/marche" },
      { title: "Formations et posture", text: "Assaut, Prudente, Raid… et choisis comment ta base encaisse les attaques.", to: "/game/unites" },
      { title: "Simulateur", text: "Teste un combat sans risque avant d'envoyer ta flotte.", to: "/game/simulateur" },
      { title: "Guerres d'alliance", text: "Déclare la guerre, marque des points, remporte le trésor et le titre « Vainqueurs ».", to: "/game/alliance" },
    ],
    cta: { label: "Voir le Léviathan", to: "/game/leviathan" },
  },
  {
    id: "v2.3-nouvelles-factions",
    eyebrow: "Nouvelles menaces · Mise à jour 2.3",
    title: "Trois factions entrent dans la guerre",
    text: "Une inquisition qui traque le savoir interdit, un cartel qui flaire les coffres pleins, une meute de cyborgs qui chasse les empires trop ambitieux. Chacune a ses raisons de frapper à ta porte… et un repaire à faire tomber.",
    factions: ["inquisition", "cartel", "meute"],
    cta: { label: "Découvrir les menaces", to: "/game/menaces" },
  },
];

const SEEN_KEY = "cosmic-empires:announcements-seen";
function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}
function markSeen(key: string) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...readSeen(), key])]));
  } catch {
    /* stockage indisponible : l'annonce reviendra au prochain chargement */
  }
}

/** Taglines courtes par type de déclencheur. */
const TAGLINE: Record<string, string> = {
  research: "Traque le savoir",
  hoard: "Flaire les coffres pleins",
  expansion: "Chasse les empires qui grandissent",
  aggression: "Traque les agresseurs",
  wealth: "Rançonne les empires riches",
};

const CLIP = [
  "polygon(0 0, 100% 0, 86% 100%, 0 100%)",
  "polygon(14% 0, 100% 0, 86% 100%, 0 100%)",
  "polygon(14% 0, 100% 0, 100% 100%, 0 100%)",
];

export function AnnouncementDialog() {
  const player = usePlayerStore((s) => s.player);
  const navigate = useNavigate();
  const [current, setCurrent] = useState<Announcement | null>(null);
  const uid = player?.uid;
  const threatened = player ? !!activeUltimatum(player, Date.now()) : false;

  useEffect(() => {
    // Pas par-dessus un ultimatum : l'annonce attendra le prochain chargement.
    if (!uid || threatened) return;
    const seen = readSeen();
    const next = ANNOUNCEMENTS.find(
      (a) => !seen.includes(`${uid}:${a.id}`) && (a.factions.length === 0 || a.factions.some((id) => FACTIONS.some((f) => f.id === id && f.enabled))),
    );
    if (!next) return;
    const timer = setTimeout(() => setCurrent(next), 1200);
    return () => clearTimeout(timer);
  }, [uid, threatened]);

  if (!current || !uid) return null;
  const factions = current.factions.map((id) => FACTIONS.find((f) => f.id === id && f.enabled)).filter((f) => !!f);
  const close = () => {
    markSeen(`${uid}:${current.id}`);
    setCurrent(null);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[94vh] max-w-5xl overflow-hidden overflow-y-auto border-0 p-0 sm:w-[94vw]">
        <div className="relative flex min-h-[78vh] flex-col justify-end overflow-hidden bg-space-950">
          {current.art && (
            <motion.picture className="absolute inset-x-0 top-0 h-[70%] sm:h-[62%]" initial={{ opacity: 0, scale: 1.08 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}>
              {current.artMobile && <source media="(max-width: 640px)" srcSet={assetUrl(current.artMobile)} />}
              <img src={assetUrl(current.art)} alt="" className="h-full w-full object-cover object-[center_75%]" />
            </motion.picture>
          )}
          {/* Illustrations en bandes obliques */}
          <div className="absolute inset-0 flex">
            {factions.map((f, i) => (
              <motion.div
                key={f.id}
                className={cn("relative h-full flex-1", i > 0 && "-ml-[5%]")}
                style={{ clipPath: CLIP[factions.length === 1 ? 2 : i === 0 ? 0 : i === factions.length - 1 ? 2 : 1] }}
                initial={{ opacity: 0, y: 60, scale: 1.08 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <img src={assetUrl(f.art)} alt={`${f.leader} et ${f.enforcer}`} className="h-full w-full object-cover object-top" />
              </motion.div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-space-950 via-space-950/75 to-space-950/0" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-space-950/80 to-transparent" />

          {/* Texte */}
          <motion.div
            className="relative z-10 flex flex-col gap-4 p-6 pt-[42vh] md:p-10 md:pt-64"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
          >
            <p className="hud-eyebrow flex items-center gap-2 text-danger-glow">
              <Skull className="h-3.5 w-3.5 animate-pulse" /> {current.eyebrow}
            </p>
            <DialogTitle className="text-3xl leading-tight md:text-5xl">{current.title}</DialogTitle>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-200 md:text-base">{current.text}</p>
            {current.features && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {current.features.map((f, i) => (
                  <motion.button
                    key={f.title}
                    type="button"
                    onClick={() => {
                      close();
                      navigate(f.to);
                    }}
                    className="rounded-lg border border-cyan-glow/25 bg-space-950/75 p-3 text-left backdrop-blur-sm transition-colors hover:border-cyan-glow/60"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + i * 0.08 }}
                  >
                    <p className="font-display text-sm text-cyan-glow">{f.title}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-slate-300">{f.text}</p>
                  </motion.button>
                ))}
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-3">
              {factions.map((f, i) => {
                const a = accent(f);
                return (
                  <motion.div
                    key={f.id}
                    className={cn("rounded-lg border bg-space-950/70 p-3 backdrop-blur-sm", a.border)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.12 }}
                  >
                    <p className={cn("font-display text-sm", a.text)}>{f.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {f.leader} · {TAGLINE[f.trigger.type] ?? ""}
                    </p>
                  </motion.div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                size="lg"
                onClick={() => {
                  close();
                  navigate(current.cta.to);
                }}
              >
                {current.cta.label}
              </Button>
              <Button variant="ghost" size="lg" onClick={close}>
                Plus tard
              </Button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
