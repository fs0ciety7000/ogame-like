import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { onboardingEligible } from "@/game/onboarding";
import { usePlayerStore } from "@/store/playerStore";

/* Bulles d'aide (v2.9) : une explication courte la première fois qu'un
   joueur débutant ouvre chaque page. Mémorisées dans le navigateur. */

const SEEN_KEY = "cosmic-empires:tips-seen";
const OFF_KEY = "cosmic-empires:tips-off";

export const PAGE_TIPS: Record<string, string> = {
  "/game/ressources": "Chaque bâtiment d'extraction produit en continu, même hors ligne. Surveille les jauges : un stock plein ne monte plus, et l'entrepôt met une partie à l'abri des pillards.",
  "/game/batiments": "Améliorer un bâtiment augmente sa production ou son effet. Chaque bâtiment a son propre chantier ; « Programmer » prépare la suite, lancée seule dès que possible.",
  "/game/unites": "Les unités d'attaque partent en mission ou au combat ; les défenses protègent ta base. Chaque unité se débloque et s'améliore au Labo.",
  "/game/labo": "Les recherches débloquent les unités et donnent des bonus permanents (production, combat, vitesse…). Survole une technologie pour voir ses effets.",
  "/game/missions": "Envoie des unités en mission : elles reviennent avec des ressources et de l'XP. Les unités engagées ne défendent pas ta base pendant ce temps.",
  "/game/galaxie": "La carte montre les autres commandants. Espionne avant d'attaquer : le rapport révèle ressources, flotte et défenses selon ton niveau d'Espionnage.",
  "/game/joueurs": "Tous les commandants du serveur. Les débutants sont protégés 72 h ; contre un joueur bien moins expérimenté, butin et XP sont réduits. L'icône radar envoie des sondes en un clic.",
  "/game/combats": "Le journal de tes combats et espionnages. Depuis un rapport d'espionnage, « Simuler une attaque » estime l'issue avant d'envoyer ta flotte.",
  "/game/simulateur": "Teste un combat sans risque : la formule est exactement celle des vrais combats. Le résultat indique la puissance qu'il te faudrait pour gagner.",
  "/game/planificateur": "Tout ce qui tourne au même endroit. Enregistre une suite d'actions (bâtiments, unités, recherches) en modèle et rejoue-la en un clic : l'aperçu te dit avant ce qui passera.",
  "/game/commerce": "Trois onglets : le Marché pour échanger tes surplus, les Contrats de livraison entre joueurs, et les Enchères pour vendre reliques et plans de modules au plus offrant (en ressources ou en Ambre).",
  "/game/menaces": "Les factions surveillent les commandants trop riches ou trop agressifs. Paie le tribut ou repousse leurs raids pour localiser leur repaire.",
  "/game/alliance": "Une alliance partage un trésor, des recherches et des garnisons qui défendent les membres. Jusqu'à 6 commandants.",
};

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function tipsEnabled(): boolean {
  try {
    return localStorage.getItem(OFF_KEY) !== "1";
  } catch {
    return true;
  }
}

export function setTipsEnabled(on: boolean, resetSeen = false) {
  try {
    if (on) localStorage.removeItem(OFF_KEY);
    else localStorage.setItem(OFF_KEY, "1");
    if (resetSeen) localStorage.removeItem(SEEN_KEY);
  } catch {
    /* stockage indisponible */
  }
}

export function PageTip() {
  const { pathname } = useLocation();
  const player = usePlayerStore((s) => s.player);
  const [visible, setVisible] = useState<string | null>(null);
  const tip = PAGE_TIPS[pathname];
  const eligible = !!player && onboardingEligible(player);

  useEffect(() => {
    setVisible(tip && eligible && tipsEnabled() && !readSeen().includes(pathname) ? pathname : null);
  }, [pathname, tip, eligible]);

  const close = (all: boolean) => {
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...readSeen(), pathname])]));
    } catch {
      /* stockage indisponible */
    }
    if (all) setTipsEnabled(false);
    setVisible(null);
  };

  return (
    <AnimatePresence>
      {visible === pathname && tip && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="hud-cut-sm mb-4 flex items-start gap-3 border border-gold-glow/30 bg-gold-glow/[0.06] p-3"
          role="note"
        >
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold-glow" />
          <p className="flex-1 text-sm text-slate-300">{tip}</p>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <button type="button" onClick={() => close(false)} className="p-0.5 text-slate-500 hover:text-slate-200" aria-label="Fermer l'aide">
              <X className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => close(true)} className="font-mono text-[9px] uppercase tracking-[0.12em] text-slate-500 hover:text-gold-glow">
              Tout masquer
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
