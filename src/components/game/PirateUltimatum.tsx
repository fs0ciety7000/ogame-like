import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skull, Swords } from "lucide-react";
import { create } from "zustand";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { pirateState, PIRATE_RULES } from "@/game/pirates";
import { RESOURCE_LIST } from "@/game/resources";
import { answerPirateUltimatum, GameActionError } from "@/services/playerService";
import { formatCompact, formatDuration } from "@/lib/utils";

export const PIRATE_ART = "/assets/story/varan.webp";

/** Ouverture de la fenêtre d'ultimatum (pastille de l'en-tête, page Menaces). */
const DISMISS_KEY = "cosmic-empires:ultimatum-dismissed";
function readDismissed(): number {
  try {
    return Number(localStorage.getItem(DISMISS_KEY)) || 0;
  } catch {
    return 0;
  }
}
const useUltimatumStore = create<{ open: boolean; dismissed: number }>(() => ({ open: false, dismissed: readDismissed() }));
export function openUltimatum() {
  useUltimatumStore.setState({ open: true });
}

function useUltimatum() {
  const player = usePlayerStore((s) => s.player);
  const u = player ? pirateState(player).ultimatum : null;
  return u && u.expiresAtMs > Date.now() ? u : null;
}

/** Fenêtre de l'ultimatum de Varan : payer le tribut ou refuser. S'ouvre
 *  d'elle-même à la réception (une fois par ultimatum). */
export function UltimatumDialog() {
  useNowTicker();
  const ultimatum = useUltimatum();
  const player = usePlayerStore((s) => s.player);
  const { open, dismissed } = useUltimatumStore();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ultimatum && ultimatum.issuedAtMs !== dismissed) useUltimatumStore.setState({ open: true });
  }, [ultimatum, dismissed]);

  const close = () => {
    const dismissed = ultimatum?.issuedAtMs ?? 0;
    useUltimatumStore.setState({ open: false, dismissed });
    try {
      localStorage.setItem(DISMISS_KEY, String(dismissed));
    } catch {
      /* stockage indisponible : la fenêtre se rouvrira au prochain chargement */
    }
  };
  const answer = async (choice: "pay" | "refuse") => {
    setBusy(true);
    try {
      await answerPirateUltimatum(choice);
      if (choice === "pay") toast.success("Tribut payé. Varan raye ton nom de la Liste… pour l'instant.");
      else toast("Tu as refusé : le Silencieux arrive !", { icon: "☠️", description: "Prépare tes défenses, appelle tes alliés ou mets ta flotte à l'abri." });
      close();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réponse impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (!ultimatum || !player) return null;
  const total = Object.values(ultimatum.tribute).reduce((a, b) => a + (b ?? 0), 0);
  const canPay = Object.entries(ultimatum.tribute).every(([res, v]) => (player.resources[res as keyof typeof player.resources] ?? 0) >= (v ?? 0));
  const left = Math.max(0, Math.floor((ultimatum.expiresAtMs - Date.now()) / 1000));

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? openUltimatum() : close())}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="grid sm:grid-cols-[minmax(0,15rem)_1fr]">
          <div className="relative min-h-56 overflow-hidden sm:min-h-full">
            <img src={PIRATE_ART} alt="Le capitaine Varan et le Silencieux" className="absolute inset-0 h-full w-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-space-950/90 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-space-950/80" />
          </div>
          <div className="flex flex-col gap-3 p-5">
            <p className="hud-eyebrow text-ember-glow">Confrérie du Vide · Transmission entrante</p>
            <DialogTitle className="font-display text-xl text-white">« Ton nom est sur ma Liste. »</DialogTitle>
            <p className="text-sm italic text-slate-300">
              « {player.pseudo}… Ton empire brille un peu trop dans le noir. Le Silencieux t'a désigné, et il ne se trompe jamais. Verse ta part à la
              Confrérie, et nous t'oublierons. Refuse, et il viendra la prendre lui-même. »
            </p>
            <p className="text-right text-xs text-slate-500">— Capitaine Orsk Varan</p>
            <div className="rounded-lg border border-ember-glow/30 bg-ember-glow/5 p-3">
              <p className="text-xs text-slate-400">Tribut exigé ({PIRATE_RULES.tributeHours} h de ta production)</p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-100">
                {RESOURCE_LIST.filter((r) => (ultimatum.tribute[r.id] ?? 0) > 0).map((r) => (
                  <span key={r.id} className="tabular-mono">
                    {r.emoji} {formatCompact(ultimatum.tribute[r.id] ?? 0)}
                  </span>
                ))}
                <span className="text-slate-500">({formatCompact(total)} au total)</span>
              </p>
              <p className="mt-2 text-xs text-ember-glow">Délai : {formatDuration(left)}. Sans réponse, le raid part tout seul.</p>
            </div>
            <p className="text-xs text-slate-400">
              Si tu refuses, le raid arrive {formatDuration(PIRATE_RULES.raidTravelHours * 3600)} plus tard. Repoussé, il te rapporte une prime de{" "}
              {PIRATE_RULES.bountyHours} h de production et +{PIRATE_RULES.bountyXp} XP ; réussi, les pirates pillent {Math.round(PIRATE_RULES.lootPct * 100)} % de
              tes ressources communes.
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Button variant="outline" className="flex-1" disabled={busy || !canPay} onClick={() => void answer("pay")}>
                {canPay ? "Payer le tribut" : "Pas assez pour payer"}
              </Button>
              <Button variant="danger" className="flex-1" disabled={busy} onClick={() => void answer("refuse")}>
                <Swords className="mr-1.5 h-4 w-4" /> Refuser
              </Button>
            </div>
            <button type="button" className="self-center text-[11px] text-slate-500 hover:text-slate-300" onClick={close}>
              Décider plus tard
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Pastille de l'en-tête tant qu'un ultimatum attend une réponse. */
export function UltimatumBadge() {
  useNowTicker();
  const ultimatum = useUltimatum();
  if (!ultimatum) return null;
  return (
    <button
      type="button"
      onClick={openUltimatum}
      className="animate-pulse-alert flex items-center gap-1.5 rounded-lg border border-ember-glow/60 bg-ember-glow/15 px-2 py-1 text-[11px] font-semibold text-ember-glow"
      title="Ultimatum du capitaine Varan"
    >
      <Skull className="h-3.5 w-3.5" /> Ultimatum · {formatDuration(Math.max(0, Math.floor((ultimatum.expiresAtMs - Date.now()) / 1000)))}
    </button>
  );
}
