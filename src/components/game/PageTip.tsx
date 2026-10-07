import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { onboardingEligible } from "@/game/onboarding";
import { usePlayerStore } from "@/store/playerStore";
import { ALLIANCE_RULES, findAllianceResearch } from "@/game/alliances";
import { PVP_RULES } from "@/game/pvp";
import { HudCallout } from "@/components/ui/hud";
import { markAnnouncementsSeen } from "@/services/playerService";
import { cn } from "@/lib/utils";

/* Bulles d'aide (v2.9) : une explication courte la première fois qu'un
   joueur débutant ouvre chaque page. Mémorisées sur le compte depuis 6.14.62.
   6.14.54 (AD-7) : un chiffre de règle est lu dans la règle en vigueur (accesseur, réglable dans l'admin), jamais écrit en dur. */

const SEEN_KEY = "cosmic-empires:tips-seen";
const OFF_KEY = "cosmic-empires:tips-off";

export const PAGE_TIPS: Record<string, string> = {
  "/game/ressources": "Chaque bâtiment d'extraction produit en continu, même hors ligne. Surveille les jauges : un stock plein ne monte plus, et l'entrepôt met une partie à l'abri des pillards.",
  "/game/batiments": "Améliorer un bâtiment augmente sa production ou son effet. Chaque bâtiment a son propre chantier ; « Programmer » prépare la suite, lancée seule dès que possible.",
  "/game/unites": "Les unités d'attaque partent en mission ou au combat ; les défenses protègent ta base. Chaque unité se débloque et s'améliore au Labo.",
  "/game/labo": "Les recherches débloquent les unités et donnent des bonus permanents (production, combat, vitesse…). Touche ou survole une technologie pour voir ses effets.",
  "/game/missions": "Envoie des unités en mission : elles reviennent avec des ressources et de l'XP. Les unités engagées ne défendent pas ta base pendant ce temps.",
  "/game/galaxie": "La carte montre les autres commandants. Espionne avant d'attaquer : le rapport révèle ressources, flotte et défenses selon ton niveau d'Espionnage.",
  get "/game/joueurs"() {
    const hours = Math.round(PVP_RULES.newbieProtectionMs / 3_600_000);
    return `Tous les commandants du serveur. Les débutants sont protégés ${hours} h ; contre un joueur bien moins expérimenté, butin et XP sont réduits. L'icône radar envoie des sondes en un clic.`;
  },
  "/game/combats": "Le journal de tes combats et espionnages. Depuis un rapport d'espionnage, « Simuler une attaque » estime l'issue avant d'envoyer ta flotte.",
  "/game/simulateur": "Teste un combat sans risque : la formule est exactement celle des vrais combats. Le résultat indique la puissance qu'il te faudrait pour gagner.",
  "/game/planificateur": "Tout ce qui tourne au même endroit. Enregistre une suite d'actions (bâtiments, unités, recherches) en modèle et rejoue-la en un clic : l'aperçu te dit avant ce qui passera.",
  "/game/commerce": "Quatre onglets : le Marché pour échanger tes surplus, les Contrats de livraison entre joueurs, les Enchères pour vendre reliques et plans de modules au plus offrant (en ressources ou en Ambre), et le Pot commun pour suivre les taxes versées jour après jour.",
  "/game/menaces": "Les factions surveillent les commandants trop riches ou trop agressifs. Paie le tribut ou repousse leurs raids pour localiser leur repaire.",
  get "/game/alliance"() {
    const base = Math.max(1, Math.floor(ALLIANCE_RULES.maxMembers));
    const extra = Math.max(0, ALLIANCE_RULES.membersPerQuarter);
    return `Une alliance partage un trésor, des recherches et des garnisons qui défendent les membres. ${base} commandants au départ${extra ? `, +${extra} par niveau de ${findAllianceResearch("quartiers")?.name ?? "Quartiers fédérés"}` : ""}.`;
  },
};

/* 6.14.62 (AD-6, Q93) : la vue d'une astuce est gardée sur le compte, dans la liste des annonces vues (`announcementsSeen`,
   identifiants « tip:<page> », comme les scènes du récit) : une astuce fermée ne revient sur aucun appareil. Le navigateur
   garde une copie (affichage immédiat, hors ligne). « Réafficher les astuces » (Réglages) vaut pour cet appareil : il ignore
   alors les vues du compte (OVERRIDE_KEY). */
const OVERRIDE_KEY = "cosmic-empires:tips-local";

/** Identifiant d'une astuce dans la liste des vues du compte (`/game/batiments` → `tip:batiments`). */
export function tipId(pathname: string): string {
  return `tip:${pathname.replace(/^\/game\/?/, "").replace(/[^A-Za-z0-9._-]+/g, "-") || "accueil"}`;
}

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function localOnly(): boolean {
  try {
    return localStorage.getItem(OVERRIDE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Astuce déjà vue : sur cet appareil, ou sur le compte (sauf si le joueur les a réaffichées ici). */
export function tipSeen(pathname: string, accountSeen: readonly string[] | undefined, local = readSeen(), ignoreAccount = localOnly()): boolean {
  return local.includes(pathname) || (!ignoreAccount && (accountSeen ?? []).includes(tipId(pathname)));
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
    if (resetSeen) {
      localStorage.removeItem(SEEN_KEY);
      localStorage.setItem(OVERRIDE_KEY, "1");
    }
  } catch {
    /* stockage indisponible */
  }
}

/** Astuce de la page (une fois par page, joueurs en Prise en main) : sous le titre, ton neutre, deux lignes et « Lire la suite ».
 *  Rendue par `PageHeader` (6.14.62), plus au-dessus du titre. */
export function PageTip() {
  const { pathname } = useLocation();
  const player = usePlayerStore((s) => s.player);
  const accountSeen = player?.announcementsSeen;
  const [closed, setClosed] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const tip = PAGE_TIPS[pathname];
  const eligible = !!player && onboardingEligible(player);
  const visible = !!tip && eligible && closed !== pathname && tipsEnabled() && !tipSeen(pathname, accountSeen);

  useEffect(() => {
    setExpanded(false);
  }, [pathname]);
  useLayoutEffect(() => {
    const el = textRef.current;
    setClamped(!!el && el.scrollHeight > el.clientHeight + 1);
  }, [tip, visible, expanded]);

  const close = (all: boolean) => {
    const paths = all ? Object.keys(PAGE_TIPS) : [pathname];
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...readSeen(), ...paths])]));
    } catch {
      /* stockage indisponible */
    }
    if (all) setTipsEnabled(false);
    setClosed(pathname);
    // Gardé sur le compte : l'astuce ne revient pas sur un autre appareil (échec silencieux : la copie locale suffit ici).
    void markAnnouncementsSeen(paths.map(tipId)).catch(() => undefined);
  };

  return (
    <AnimatePresence initial={false}>
      {visible && tip && (
        <motion.div key={pathname} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
          <HudCallout tone="neutral" role="note" aria-label="Astuce" className="flex items-start gap-3 text-sm">
            <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <p ref={textRef} className={cn("text-slate-300", !expanded && "line-clamp-2")}>
                {tip}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                {(clamped || expanded) && (
                  <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="relative text-xs text-cyan-glow before:absolute before:-inset-2 hover:underline">
                    {expanded ? "Réduire" : "Lire la suite"}
                  </button>
                )}
                <button type="button" onClick={() => close(true)} aria-label="Masquer toutes les astuces" className="relative font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400 before:absolute before:-inset-2 hover:text-slate-100">
                  Tout masquer
                </button>
              </div>
            </div>
            <button type="button" onClick={() => close(false)} aria-label="Fermer l'astuce" className="-my-2.5 -mr-2.5 grid h-11 w-11 shrink-0 place-items-center text-slate-400 hover:text-slate-100">
              <X className="h-4 w-4" />
            </button>
          </HudCallout>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
