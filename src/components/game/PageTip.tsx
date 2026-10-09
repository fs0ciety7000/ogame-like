import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { onboardingEligible } from "@/game/onboarding";
import { usePlayerStore } from "@/store/playerStore";
import { ALLIANCE_RULES, allianceMembersResearch } from "@/game/alliances";
import { PVP_RULES } from "@/game/pvp";
import { COLONY_RULES } from "@/game/colonies";
import { NAV_UNLOCK_RULES, navStatus } from "@/game/navUnlock";
import { useIsAdmin } from "@/services/adminService";
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
    return `Tous les commandants du serveur. Un débutant est protégé ${hours} h après son inscription, tant qu'il n'attaque pas (ta date : page Ressources, « Ce que tu risques ») ; contre un joueur bien moins expérimenté, butin et XP sont réduits. L'icône radar envoie des sondes en un clic.`;
  },
  "/game/combats": "Le journal de tes combats et espionnages. Depuis un rapport d'espionnage, « Simuler une attaque » estime l'issue avant d'envoyer ta flotte.",
  "/game/simulateur": "Teste un combat sans risque : la formule est exactement celle des vrais combats. Le résultat indique la puissance qu'il te faudrait pour gagner.",
  "/game/planificateur": "Tout ce qui tourne au même endroit. Enregistre une suite d'actions (bâtiments, unités, recherches) en modèle et rejoue-la en un clic : l'aperçu te dit avant ce qui passera.",
  "/game/commerce": "Quatre onglets : le Marché pour échanger tes surplus, les Contrats de livraison entre joueurs, les Enchères pour vendre reliques et plans de modules au plus offrant (en ressources ou en Ambre), et le Pot commun pour suivre les taxes versées jour après jour.",
  "/game/menaces": "Les factions surveillent les commandants trop riches ou trop agressifs. Paie le tribut ou repousse leurs raids pour localiser leur repaire.",
  get "/game/alliance"() {
    const base = Math.max(1, Math.floor(ALLIANCE_RULES.maxMembers));
    const extra = Math.max(0, ALLIANCE_RULES.membersPerQuarter);
    // 6.14.124 (AA6) : la recherche qui agrandit l'alliance est lue dans ses effets, plus dans son identifiant.
    const more = allianceMembersResearch();
    return `Une alliance partage un trésor, des recherches et des garnisons qui défendent les membres. ${base} commandants au départ${extra && more ? `, +${extra} par niveau de ${more.name}` : ""}.`;
  },
  // 6.14.81 (DP-L6) : une astuce pour chaque page qui s'ouvre au fil de la progression (menu progressif, I30).
  "/game/succes": "Chaque succès rapporte de l'XP et parfois un titre. Les succès secrets se révèlent en jouant : la liste « À découvrir » te dit où chercher.",
  "/game/passe": "Le passe est gratuit : tes actions de chaque jour remplissent ses paliers. Chaque défi dit où agir ; un palier atteint se réclame ici. Il repart à zéro au début du mois.",
  "/game/primes": "Les Kesh'Vaar paient en Ambre la capture des pillards de l'Essaim. L'Ambre se dépense au Comptoir : accélérateurs, boucliers, Planificateur et autres outils.",
  "/game/classe": "La classe d'empire donne des bonus permanents et un avantage propre. Ton premier choix est gratuit ; en changer coûte ensuite de l'Ambre et demande d'attendre.",
  "/game/journal": "Tout ce qui est arrivé à ton empire, jour après jour : chantiers, combats, récompenses. À ton retour, « Pendant ton absence » résume l'essentiel.",
  "/game/codex": "Chaque rencontre ajoute une fiche : factions, seigneurs, boss, unités, technologies. Une catégorie complète se réclame contre une récompense.",
  "/game/chroniques": "Un chapitre par mois, en quatre épisodes. Chaque épisode fixe des objectifs communs à tout le serveur ; « J'y vais » t'emmène là où agir.",
  "/game/gazette": "Chaque semaine, les grands faits du secteur : combats marquants, records, alliances qui montent. Ton nom peut y paraître.",
  "/game/statistiques": "Tout ton empire en chiffres : production, armée à quai et en vol, bonus et carrière. Le panneau Lune apparaît quand ta planète en a une, ou quand une lune peut naître.",
  "/game/portefeuille": "Tout ce que tu possèdes, hors ressources : Ambre, jetons, plans et autres monnaies. Chaque ligne dit d'où elle vient et à quoi elle sert.",
  "/game/etat-major": "Officiers, reliques et modules donnent des bonus permanents. Ton premier officier est offert ; les reliques, trouvées en expédition, sur les boss ou au passe, s'équipent ici.",
  "/game/seigneurs": "Dix empires tenus par le jeu. Ils grandissent avec le secteur et répondent à qui les provoque : espionne-les avant de piller, et pèse bien une vendetta.",
  "/game/uber": "Le boss mondial revient à dates fixes (l'agenda de l'accueil les donne). Tout le serveur l'attaque ensemble : chaque assaut compte pour ta part de la récompense, même petit.",
  "/game/boss": "Le boss de saison suit le chapitre des Chroniques. Envoie ta flotte pendant sa fenêtre : les dégâts de tous s'additionnent, les récompenses suivent ta part.",
  "/game/hall-of-fame": "Chaque boss affronté par le serveur, ses chiffres et ses champions. Les records se calculent sur le boss mondial et les boss de saison.",
  "/game/casino": "Un jeton, un tirage : les objectifs du jour donnent des jetons, et le gros lot est le pot commun du serveur.",
  get "/game/colonies"() {
    const levels = Math.max(0, Math.round(Number(COLONY_RULES.levelsRequired?.[0]) || 0));
    return `Une colonie ajoute une planète avec ses bâtiments, ses stocks et ses défenses. La première demande ${levels} niveaux de bâtiments cumulés sur ta planète mère.`;
  },
  "/game/guerre-territoire": "Les alliances se disputent les secteurs de la galaxie. Chaque secteur a son tableau de points ; à la fin, il revient à l'alliance en tête. Ton alliance doit s'y engager.",
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
  const admin = useIsAdmin();
  // 6.14.81 (DP-L6) : une page qui s'ouvre au fil de la progression (menu progressif) montre son astuce à l'arrivée, même après
  // la Prise en main ; les autres astuces restent réservées aux débutants.
  const progressivePage = !!player && !!NAV_UNLOCK_RULES.pages[pathname] && navStatus(player, { admin }) === "progressive";
  const eligible = !!player && (onboardingEligible(player) || progressivePage);
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
                  <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="hud-hit text-xs text-cyan-glow hover:underline">
                    {expanded ? "Réduire" : "Lire la suite"}
                  </button>
                )}
                <button type="button" onClick={() => close(true)} aria-label="Masquer toutes les astuces" className="hud-hit font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400 hover:text-slate-100">
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
