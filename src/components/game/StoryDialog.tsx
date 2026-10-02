import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ONBOARDING_STEPS, onboardingEligible, onboardingState } from "@/game/onboarding";
import { chapterOf, OUTRO_LINES, RAID_LINES, STORY_SPEAKERS, storyText, type StoryLine } from "@/game/story";
import { assetUrl } from "@/lib/assets";
import { useAnnouncementPending } from "@/components/game/Announcement";
import type { PlayerState } from "@/types/game";

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

export function StoryDialog({ player }: { player: PlayerState }) {
  const [state, setState] = useState(() => readSeen(player.uid));
  const [index, setIndex] = useState(0);
  // Laisse passer d'abord une éventuelle annonce plein écran.
  const [ready, setReady] = useState(false);
  const announcing = useAnnouncementPending((s) => s.pending);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600);
    return () => clearTimeout(t);
  }, []);
  const scene = useMemo(() => (state.off ? null : pendingScene(player, state.seen)), [player, state]);
  useEffect(() => setIndex(0), [scene?.id]);
  if (!scene || !ready || announcing) return null;
  const line = scene.lines[Math.min(index, scene.lines.length - 1)];
  const sp = STORY_SPEAKERS[line.speaker];
  const close = () => {
    const next = { ...state, seen: [...state.seen, scene.id] };
    writeSeen(player.uid, next);
    setState(next);
  };
  const skipAll = () => {
    const next = { seen: [...state.seen, scene.id], off: true };
    writeSeen(player.uid, next);
    setState(next);
  };
  const last = index >= scene.lines.length - 1;

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        <div className="flex flex-col sm:flex-row">
          <AnimatePresence mode="wait">
            <motion.img
              key={line.speaker}
              src={assetUrl(sp.image)}
              alt={sp.name}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="h-56 w-full object-cover object-top sm:h-auto sm:w-48"
              style={{ boxShadow: `inset 0 0 0 1px ${sp.color}55` }}
            />
          </AnimatePresence>
          <div className="flex flex-1 flex-col gap-3 p-5">
            <p className="hud-eyebrow text-[10px] text-slate-500">{scene.title}</p>
            <DialogTitle className="text-lg" style={{ color: sp.color }}>
              {sp.name}
            </DialogTitle>
            <p className="-mt-2 text-[11px] uppercase tracking-[0.14em] text-slate-500">{sp.role}</p>
            <AnimatePresence mode="wait">
              <motion.p key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="min-h-[5.5rem] text-[15px] leading-relaxed text-slate-200">
                « {storyText(line, player.pseudo)} »
              </motion.p>
            </AnimatePresence>
            <div className="mt-auto flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-slate-500">
                {index + 1} / {scene.lines.length}
              </span>
              <button type="button" className="ml-auto text-xs text-slate-500 hover:text-slate-300" onClick={skipAll}>
                Passer l'histoire
              </button>
              <Button onClick={() => (last ? close() : setIndex((i) => i + 1))}>{last ? (scene.id === "outro" ? "Merci, Vashka" : "Compris") : "Suite"}</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


