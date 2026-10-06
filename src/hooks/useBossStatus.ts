import { useEffect, useState } from "react";
import { bossPhase, upcomingLeviathanStart, type BossPhase } from "@/game/leviathan";
import { seasonBossWindow } from "@/game/chronicles";
import { useLeviathan } from "@/services/leviathanService";
import { useSeasonBoss } from "@/services/seasonBossService";
import type { HudTone } from "@/components/ui/hud";

/* 5.26.2 : état des boss (mondial, de saison) et heure de leur retour, partagés
   par le menu et l'accueil. */

export type BossNavInfo = { phase: BossPhase; returnMs: number | null; now: number };

/* v5.10.2 : les onglets des boss changent selon l'état du combat. */
export const BOSS_NAV: Record<BossPhase, { label: string; chip: string; color: string }> = {
  active: { label: "En cours", chip: "En cours", color: "var(--color-danger-glow)" },
  killed: { label: "Abattu", chip: "Abattu", color: "var(--color-mint-glow)" },
  failed: { label: "Retiré", chip: "Retiré", color: "var(--color-ember-glow)" },
  dormant: { label: "En sommeil", chip: "Zzz", color: "var(--color-slate-500)" },
};

export const BOSS_TONE: Record<BossPhase, HudTone> = { active: "danger", killed: "mint", failed: "ember", dormant: "neutral" };

/** Minute courante (les fins de combat sont gérées sans attendre le serveur). */
function useMinute(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** État du boss d'une page de la navigation (null pour les autres pages). */
/** 5.26.1 : état du boss dans le menu et heure de son retour.
 *  Abattu (ou retiré) tant que sa fenêtre court ; une fois la fenêtre passée, il dort
 *  et le menu affiche le temps avant son retour. */
export function useBossNavInfo(to: string): { phase: BossPhase; returnMs: number | null; now: number } | null {
  const leviathan = useLeviathan();
  const seasonBoss = useSeasonBoss();
  const now = useMinute();
  const world = to === "/game/uber";
  if (!world && to !== "/game/boss") return null;
  const state = world ? leviathan : seasonBoss;
  let phase = bossPhase(state, now);
  if ((phase === "killed" || phase === "failed") && state && now >= state.endMs) phase = "dormant";
  if (phase === "active") return { phase, returnMs: null, now };
  let returnMs: number | null;
  if (world) returnMs = upcomingLeviathanStart(now);
  else {
    // Comme la page du boss : la fenêtre en cours est sautée si son combat est déjà joué.
    const win = seasonBossWindow(now, true);
    const replayed = !!win && (now >= win.startMs || (!!state && state.id === win.id));
    returnMs = win ? (replayed ? (seasonBossWindow(win.endMs, true)?.startMs ?? null) : win.startMs) : null;
  }
  return { phase, returnMs: returnMs !== null && returnMs > now ? returnMs : null, now };
}


/** « 2j 4h », « 5h12 », « 18 min » (compte à rebours compact du menu). */
export function shortWait(ms: number): string {
  const m = Math.max(1, Math.ceil(ms / 60_000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h${String(m % 60).padStart(2, "0")}`;
  return `${m} min`;
}

/** Libellé court et phrase complète de l'état d'un boss pour le menu. */
export function bossNavText(info: { phase: BossPhase; returnMs: number | null; now: number }): { chip: string; full: string } {
  const back = info.returnMs !== null ? shortWait(info.returnMs - info.now) : null;
  if (info.phase === "dormant") return back ? { chip: back, full: `En sommeil, retour dans ${back}` } : { chip: "Zzz", full: "En sommeil" };
  const base = BOSS_NAV[info.phase];
  return { chip: base.chip, full: back ? `${base.label}, retour dans ${back}` : base.label };
}
