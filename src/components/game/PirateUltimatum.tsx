import { assetUrl } from "@/lib/assets";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skull, Swords } from "lucide-react";
import { create } from "zustand";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { activeUltimatum, pirateState, raidPower, type FactionDef } from "@/game/pirates";
import { ThreatGauge } from "@/components/game/ThreatGauge";
import type { Fleet } from "@/game/fleets";
import { RESOURCE_LIST } from "@/game/resources";
import { answerPirateUltimatum, GameActionError } from "@/services/playerService";
import { cn, formatCompact, formatDuration } from "@/lib/utils";
import { ResourceIcon } from "@/components/ui/game-icon";

/** Couleurs d'accent des factions (classes Tailwind complètes). */
export const FACTION_ACCENT: Record<string, { text: string; border: string; bg: string }> = {
  ember: { text: "text-ember-glow", border: "border-ember-glow/40", bg: "bg-ember-glow/10" },
  gold: { text: "text-gold-glow", border: "border-gold-glow/40", bg: "bg-gold-glow/10" },
  cyan: { text: "text-cyan-glow", border: "border-cyan-glow/40", bg: "bg-cyan-glow/10" },
  mint: { text: "text-mint-glow", border: "border-mint-glow/40", bg: "bg-mint-glow/10" },
  danger: { text: "text-danger-glow", border: "border-danger-glow/40", bg: "bg-danger-glow/10" },
};
export function accent(faction: Pick<FactionDef, "color">) {
  return FACTION_ACCENT[faction.color] ?? FACTION_ACCENT.ember;
}

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

function useActiveUltimatum() {
  const player = usePlayerStore((s) => s.player);
  return player ? activeUltimatum(player, Date.now()) : null;
}

/** Fenêtre de l'ultimatum en cours (toutes factions) : payer ou refuser.
 *  S'ouvre d'elle-même à la réception, une fois par ultimatum. */
export function UltimatumDialog() {
  useNowTicker();
  const active = useActiveUltimatum();
  const player = usePlayerStore((s) => s.player);
  const { open, dismissed } = useUltimatumStore();
  const [busy, setBusy] = useState(false);
  const issuedAt = active?.ultimatum.issuedAtMs;

  useEffect(() => {
    if (issuedAt && issuedAt !== dismissed) useUltimatumStore.setState({ open: true });
  }, [issuedAt, dismissed]);

  const close = () => {
    const value = issuedAt ?? 0;
    useUltimatumStore.setState({ open: false, dismissed: value });
    try {
      localStorage.setItem(DISMISS_KEY, String(value));
    } catch {
      /* stockage indisponible : la fenêtre se rouvrira au prochain chargement */
    }
  };
  const answer = async (choice: "pay" | "refuse") => {
    if (!active) return;
    setBusy(true);
    try {
      await answerPirateUltimatum(choice);
      if (choice === "pay") toast.success(`${active.faction.leader} te laisse en paix… pour l'instant.`);
      else toast(`Tu as refusé : ${active.faction.enforcer} arrive !`, { icon: "☠️", description: "Prépare tes défenses, appelle tes alliés ou mets ta flotte à l'abri." });
      close();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réponse impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (!active || !player) return null;
  const { faction, ultimatum } = active;
  const a = accent(faction);
  const totalTribute = Object.values(ultimatum.tribute).reduce((x: number, y) => x + (y ?? 0), 0);
  const canPay = Object.entries(ultimatum.tribute).every(([res, v]) => (player.resources[res as keyof typeof player.resources] ?? 0) >= (v ?? 0));
  const left = Math.max(0, Math.floor((ultimatum.expiresAtMs - Date.now()) / 1000));
  const fleetOnly = faction.raid.target === "fleet";

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? openUltimatum() : close())}>
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="grid sm:grid-cols-[minmax(0,15rem)_1fr]">
          <div className="relative min-h-56 overflow-hidden sm:min-h-full">
            <img src={assetUrl(faction.art)} alt={`${faction.leader} et ${faction.enforcer}`} className="absolute inset-0 h-full w-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-space-950/90 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-transparent sm:to-space-950/80" />
          </div>
          <div className="flex flex-col gap-3 p-5">
            <p className={cn("hud-eyebrow", a.text)}>{faction.name} · Transmission entrante</p>
            <DialogTitle className="font-display text-xl text-white">{faction.ultimatum.title}</DialogTitle>
            <p className="text-sm italic text-slate-300">« {faction.ultimatum.quote.replace(/\{pseudo\}/g, player.pseudo)} »</p>
            <p className="text-right text-xs text-slate-500">— {faction.ultimatum.signature}</p>
            <div className={cn("rounded-lg border p-3", a.border, a.bg)}>
              <p className="text-xs text-slate-400">
                {faction.tribute.basis === "plunder"
                  ? `Prix exigé (${Math.round(faction.tribute.plunderPct * 100)} % de ton butin récent)`
                  : faction.tribute.basis === "stock"
                    ? `Intérêts exigés (${Math.round((faction.tribute.stockPct ?? 0) * 100)} % de ton stock)`
                    : `Tribut exigé (${faction.tribute.hours} h de ta production)`}
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-100">
                {RESOURCE_LIST.filter((r) => (ultimatum.tribute[r.id] ?? 0) > 0).map((r) => (
                  <span key={r.id} className="tabular-mono">
                    <ResourceIcon id={r.id} /> {formatCompact(ultimatum.tribute[r.id] ?? 0)}
                  </span>
                ))}
                <span className="text-slate-500">({formatCompact(totalTribute)} au total)</span>
              </p>
              <p className={cn("mt-2 text-xs", a.text)}>Délai : {formatDuration(left)}. Sans réponse, le raid part tout seul.</p>
            </div>
            <p className="text-xs text-slate-400">
              Si tu refuses, {faction.enforcer} frappe {formatDuration(faction.raidTravelHours * 3600)} plus tard
              {fleetOnly ? " et vise ta flotte à quai (tes défenses ne combattent pas)" : ""}. Repoussé, le raid te rapporte une prime ; réussi, il emporte{" "}
              {Math.round(faction.raid.lootPct * 100)} % de tes ressources {faction.raid.lootKind === "rare" ? "rares" : "communes"}.
            </p>
            <ThreatGauge
              fleet={{ id: "ultimatum", mission: "pirate", factionId: faction.id, units: {}, targetUid: player.uid, power: raidPower(faction, player, pirateState(player, faction.id).notoriety) } as unknown as Fleet}
              className="rounded-lg border border-white/10 bg-space-950/40 p-2"
            />
            <div className="mt-1 flex flex-wrap gap-2">
              <Button variant="outline" className="flex-1" disabled={busy || !canPay} onClick={() => void answer("pay")}>
                {canPay ? faction.ultimatum.payLabel : "Pas assez pour payer"}
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
  const active = useActiveUltimatum();
  if (!active) return null;
  const a = accent(active.faction);
  return (
    <button
      type="button"
      onClick={openUltimatum}
      className={cn("animate-pulse-alert flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold", a.border, a.bg, a.text)}
      title={`Ultimatum : ${active.faction.name}`}
    >
      <Skull className="h-3.5 w-3.5" /> Ultimatum · {formatDuration(Math.max(0, Math.floor((active.ultimatum.expiresAtMs - Date.now()) / 1000)))}
    </button>
  );
}
