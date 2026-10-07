import { alpha } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ONBOARDING_STEPS, onboardingEligible, onboardingState } from "@/game/onboarding";
import { chronicleOf, unlockedEpisodes } from "@/game/chronicles";
import { chapterOf, OUTRO_LINES, RAID_LINES, STORY_SPEAKERS, storyText, type StoryLine } from "@/game/story";
import { assetUrl } from "@/lib/assets";
import { useAnnouncementPending } from "@/components/game/Announcement";
import type { PlayerState } from "@/types/game";
import { coalitionPhase, coalitionScene, type Coalition } from "@/game/coalition";
import { findWarlord } from "@/game/warlords";
import { loadWarlords, useWarlordsStore } from "@/services/warlordService";
import { markAnnouncementsSeen } from "@/services/playerService";

/* v4.1 : dialogues du tutoriel scénarisé (Vashka, Varan), une fois chacun. */

const KEY = "cosmic-empires:story";

function readSeen(uid: string): { seen: string[]; off: boolean } {
  try {
    const raw = JSON.parse(localStorage.getItem(`${KEY}:${uid}`) ?? "{}") as { seen?: string[]; off?: boolean };
    return { seen: Array.isArray(raw.seen) ? raw.seen : [], off: raw.off === true };
  } catch {
    return { seen: [], off: false };
  }
}

function writeSeen(uid: string, v: { seen: string[]; off: boolean }) {
  try {
    localStorage.setItem(`${KEY}:${uid}`, JSON.stringify(v));
  } catch {
    /* stockage indisponible */
  }
}

/** Scène à jouer maintenant (chapitre, raid, épilogue), ou rien. */
function pendingScene(player: PlayerState, seen: string[]): { id: string; title: string; lines: StoryLine[] } | null {
  const st = onboardingState(player);
  const done = st.claimed.length >= ONBOARDING_STEPS.length;
  if (done) return seen.includes("outro") || !seen.includes("chapter-1") ? null : { id: "outro", title: "Épilogue · Recrue de Vashka", lines: OUTRO_LINES };
  if (!onboardingEligible(player) || st.hidden) return null;
  if (st.tutorialRaid === "sent" && !seen.includes("raid")) return { id: "raid", title: "Alerte · La Confrérie attaque", lines: RAID_LINES };
  const ch = chapterOf(st.claimed);
  if (ch && !seen.includes(`chapter-${ch.id}`)) return { id: `chapter-${ch.id}`, title: `Chapitre ${ch.id} · ${ch.title}`, lines: ch.intro };
  return null;
}

/** v4.3 : épisode des Chroniques ouvert et pas encore vu (après le tutoriel). */
function chronicleScene(player: PlayerState, seen: string[]): { id: string; title: string; lines: StoryLine[] } | null {
  const now = Date.now();
  const month = chronicleOf(now);
  if (!month || (onboardingEligible(player) && !onboardingState(player).hidden)) return null;
  const open = unlockedEpisodes(now);
  for (let i = 0; i < open; i++) {
    const id = `chron-${month.id}-${i}`;
    if (!seen.includes(id)) return { id, title: `Chroniques · ${month.title} · Épisode ${i + 1} : ${month.episodes[i].title}`, lines: month.episodes[i].lines };
  }
  return null;
}

/** v4.7 : mini-arc d'une coalition (ouverture, mi-parcours, dénouement), une fois chaque scène. */
function coalitionArcScene(player: PlayerState, co: Coalition | null, seen: string[]): { id: string; title: string; lines: StoryLine[] } | null {
  if (!co || (onboardingEligible(player) && !onboardingState(player).hidden)) return null;
  const d = findWarlord(co.warlordId);
  if (!d) return null;
  const now = Date.now();
  if (co.status !== "active" && now - (co.finishedAtMs ?? co.endsAtMs) > 3 * 24 * 3600_000) return null;
  const phase = coalitionPhase(co);
  const id = `${co.id}-${phase}`;
  if (seen.includes(id)) return null;
  const titles = { open: "Coalition · L'appel de l'Essaim", mid: "Coalition · Mi-parcours", won: "Coalition · Victoire", lost: "Coalition · Échec" };
  return { id, title: `${titles[phase]} · ${d.name}`, lines: coalitionScene(co, d, phase) };
}

export function StoryDialog({ player }: { player: PlayerState }) {
  const coalition = useWarlordsStore((s) => s.coalition);
  useEffect(() => {
    void loadWarlords().catch(() => undefined);
  }, []);
  const [local, setState] = useState(() => readSeen(player.uid));
  // v4.7.1 : les scènes vues sont aussi gardées sur le compte (autres appareils).
  const state = useMemo(() => ({ ...local, seen: [...new Set([...local.seen, ...(player.announcementsSeen ?? [])])] }), [local, player.announcementsSeen]);
  // Laisse passer d'abord une éventuelle annonce plein écran.
  const [ready, setReady] = useState(false);
  const announcing = useAnnouncementPending((s) => s.pending);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600);
    return () => clearTimeout(t);
  }, []);
  const scene = useMemo(
    () => (state.off ? null : pendingScene(player, state.seen)) ?? chronicleScene(player, state.seen) ?? coalitionArcScene(player, coalition, state.seen),
    [player, state, coalition],
  );
  if (!scene || !ready || announcing) return null;
  const close = () => {
    const next = { ...local, seen: [...local.seen, scene.id] };
    writeSeen(player.uid, next);
    setState(next);
    void markAnnouncementsSeen([scene.id]).catch(() => undefined);
  };
  const skipAll = () => {
    const next = { seen: [...local.seen, scene.id], off: true };
    writeSeen(player.uid, next);
    setState(next);
    void markAnnouncementsSeen([scene.id]).catch(() => undefined);
  };
  return <SceneDialog key={scene.id} title={scene.title} lines={scene.lines} pseudo={player.pseudo} onClose={close} onSkipAll={skipAll} doneLabel={scene.id === "outro" ? "Merci, Vashka" : "Compris"} />;
}

/** v4.3 : une scène dialoguée (tutoriel, Chroniques). */
export function SceneDialog({ title, lines, pseudo, onClose, onSkipAll, doneLabel = "Compris" }: { title: string; lines: StoryLine[]; pseudo: string; onClose: () => void; onSkipAll?: () => void; doneLabel?: string }) {
  const [index, setIndex] = useState(0);
  const line = lines[Math.min(index, lines.length - 1)];
  const sp = line.as ?? STORY_SPEAKERS[line.speaker] ?? STORY_SPEAKERS.vashka;
  const last = index >= lines.length - 1;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <div className="flex flex-col sm:flex-row">
          <AnimatePresence mode="wait">
            <motion.img
              key={sp.name}
              src={assetUrl(sp.image)}
              alt={sp.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="h-56 w-full object-cover object-top sm:h-auto sm:w-48"
              style={{ boxShadow: `inset 0 0 0 1px ${alpha(sp.color, 33)}` }}
            />
          </AnimatePresence>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <p className="hud-eyebrow text-[11px] text-slate-500">{title}</p>
            <DialogTitle className="text-lg" style={{ color: sp.color }}>
              {sp.name}
            </DialogTitle>
            <p className="-mt-2 text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500">{sp.role}</p>
            <AnimatePresence mode="wait">
              <motion.p key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-[5.5rem] text-[15px] leading-relaxed text-slate-200">
                « {storyText(line, pseudo)} »
              </motion.p>
            </AnimatePresence>
            <div className="mt-auto flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-slate-500">
                {index + 1} / {lines.length}
              </span>
              {onSkipAll && (
                <button type="button" className="ml-auto text-xs text-slate-500 hover:text-slate-300" onClick={onSkipAll}>
                  Passer l'histoire
                </button>
              )}
              <Button className={onSkipAll ? "" : "ml-auto"} onClick={() => (last ? onClose() : setIndex((i) => i + 1))}>
                {last ? doneLabel : "Suite"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


