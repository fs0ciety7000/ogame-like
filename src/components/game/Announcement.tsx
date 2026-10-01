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
  cta: { label: string; to: string };
}

export const ANNOUNCEMENTS: Announcement[] = [
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
    const next = ANNOUNCEMENTS.find((a) => !seen.includes(`${uid}:${a.id}`) && a.factions.some((id) => FACTIONS.some((f) => f.id === id && f.enabled)));
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
