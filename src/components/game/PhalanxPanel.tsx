import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, DoorOpen, Moon, Radar, ScanSearch, ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CostPill, EmptyState, HudCallout, HudChip, HudMeter, StatTile } from "@/components/ui/hud";
import { HudPanel } from "@/components/ui/panel";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { GarrisonDialog } from "@/components/game/MissionDialogs";
import { PlayerName } from "@/components/ui/player-name";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatWait, PHALANX_RULES, phalanxFeatures, phalanxLevel, phalanxRange, scanCost, type ScanReport } from "@/game/phalanx";
import { gateCooldownMs, gateMinLevel, gateReadyAtMs, gateUnlocked, JUMP_GATE_RULES, jumpMissions } from "@/game/jumpGate";
import { MOON_RULES, moonLevel, moonPity, moonPityText, playerMoon } from "@/game/moon";
import { FLEET_MISSION_LABELS } from "@/game/fleets";
import { findUnit } from "@/game/units";
import { formatClock, formatCompact, formatDecimal } from "@/lib/utils";
import { GameActionError, scanAggressor, type PhalanxFleetLine } from "@/services/playerService";
import { refreshPhalanx, usePhalanxStore, usePhalanxSync } from "@/store/phalanxStore";
import { usePlayerStore } from "@/store/playerStore";
import type { PlayerState } from "@/types/game";

/* =====================================================
   6.14.49 (É30-1c, proposals/phalange-porte-de-saut.md §5.5 et §5.6) :
   écrans de la phalange et de la porte de saut. Le serveur décide de tout
   (routes moon/phalanx, moon/scan, fleet/jump) ; l'écran ne fait qu'afficher
   l'état et transmettre les refus du serveur, en tutoiement.
===================================================== */

const MISSION_PLURAL: Record<string, string> = { patrol: "patrouilles", garrison: "garnisons", colonybase: "bases avancées" };

/** « 42 croiseurs, 3 frégates ». */
export function unitsSummary(units: Record<string, number> | null | undefined): string {
  return Object.entries(units ?? {})
    .filter(([, n]) => n > 0)
    .map(([id, n]) => `${formatCompact(n)} ${findUnit(id)?.name ?? id}`)
    .join(", ");
}

/** Compte à rebours d'une recharge (« 12:04 », « 1 j 02 h ») ; null si prête. */
function left(readyAtMs: number, now: number): string | null {
  return readyAtMs > now ? formatClock(Math.ceil((readyAtMs - now) / 1000)) : null;
}

/** Bouton « Balayer » : balayage de l'agresseur (énergie, recharge), rapport affiché ensuite. */
export function ScanButton({ targetUid, pseudo, className, compact }: { targetUid: string; pseudo: string; className?: string; compact?: boolean }) {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ScanReport | null>(null);
  const level = phalanxLevel(player);
  if (!player || level <= 0 || !PHALANX_RULES.enabled) return null;
  const now = Date.now();
  const wait = left(Number(playerMoon(player)?.scanReadyAtMs) || 0, now);
  const cost = scanCost(player);
  const energy = player.resources.energy ?? 0;

  const scan = async () => {
    const ok = await askConfirm({
      title: `Balayer ${pseudo} ?`,
      message: `Ta phalange relève ses flottes en vol et ses vaisseaux à quai. Il ne le saura pas. Prochain balayage dans ${formatWait(phalanxFeatures(level).scanCooldownMs)}.`,
      details: (
        <CostPill ok={energy >= cost} missing={energy < cost ? `manque ${formatCompact(cost - energy)}` : undefined}>
          {formatCompact(cost)} énergie
        </CostPill>
      ),
      confirmLabel: "Balayer",
      tone: "gold",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await scanAggressor(targetUid);
      // Le serveur envoie aussi la notification « Balayage de X » (toast et Journal) : ici, le rapport seul.
      setReport(res.report);
      void refreshPhalanx(undefined, true);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Balayage impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className={compact ? `h-7 px-2 text-xs ${className ?? ""}` : className}
        disabled={busy || !!wait}
        title={wait ? `Ta phalange se recharge : encore ${wait}.` : `Balayage : ${formatCompact(cost)} énergie.`}
        onClick={() => void scan()}
      >
        <ScanSearch className="mr-1 h-3.5 w-3.5" /> Balayer
        {wait && <span className="ml-1 font-mono tabular-nums text-slate-400">{wait}</span>}
      </Button>
      <ScanReportDialog report={report} onClose={() => setReport(null)} />
    </>
  );
}

/** Rapport de balayage : flottes en vol de la cible (composition affichée) et vaisseaux à quai. */
export function ScanReportDialog({ report, onClose }: { report: ScanReport | null; onClose: () => void }) {
  useNowTicker();
  const now = Date.now();
  return (
    <Dialog open={report !== null} onOpenChange={(o) => !o && onClose()}>
      {report && (
        <DialogContent>
          <DialogTitle>Balayage de {report.targetPseudo}</DialogTitle>
          <div className="grid grid-cols-2 gap-2">
            <StatTile size="sm" label="Flottes en vol" value={<span className="font-mono tabular-nums">{report.fleets.length}</span>} tone="ember" />
            <StatTile size="sm" label="Vaisseaux à quai" value={<span className="font-mono tabular-nums">{formatCompact(report.docked)}</span>} tone="neutral" sub="total seul" />
          </div>
          {report.fleets.length === 0 ? (
            <EmptyState size="sm" icon={<Radar />} title="Aucune flotte en vol" className="mt-2">
              Toute sa flotte est à quai.
            </EmptyState>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {report.fleets.map((f) => {
                const back = f.status === "returning";
                const at = back ? (f.returnAtMs ?? f.arriveAtMs) : f.arriveAtMs;
                return (
                  <li key={f.id} className="hud-cut-sm border border-white/5 bg-black/20 px-2.5 py-1.5 text-xs">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <HudChip size="sm" tone={f.mission === "attack" ? "danger" : "neutral"}>
                        {f.missionLabel}
                      </HudChip>
                      <span className="min-w-0 text-slate-200">{back ? `retour de ${f.targetPseudo}` : `→ ${f.targetPseudo}`}</span>
                      <span className="ml-auto font-mono tabular-nums text-slate-400">
                        {f.status === "stationed" ? "en place" : `${back ? "retour" : "arrivée"} dans ${formatClock(Math.max(0, Math.floor((at - now) / 1000)))}`}
                      </span>
                    </p>
                    <p className="mt-0.5 text-slate-500">
                      <span className="font-mono tabular-nums">{formatCompact(f.ships)}</span> vaisseaux{unitsSummary(f.units) ? ` : ${unitsSummary(f.units)}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-2 text-[11px] text-slate-500">Composition affichée par ses flottes : un leurre de sa part n'est pas percé par un balayage. Le rapport reste dans ton Journal.</p>
        </DialogContent>
      )}
    </Dialog>
  );
}

/** Ce que débloque le niveau suivant de la lune (texte court), ou null au niveau maximal. */
function nextTierText(level: number): string | null {
  const max = Math.max(1, Math.floor(Number(MOON_RULES.maxLevel) || 1));
  if (level >= max) return null;
  const next = level + 1;
  const now = phalanxFeatures(level);
  const then = phalanxFeatures(next);
  const parts: string[] = [];
  if (then.range > now.range) parts.push(`portée ${formatDecimal(then.range, 0)}`);
  if (then.scanCooldownMs < now.scanCooldownMs) parts.push(`balayage toutes les ${formatWait(then.scanCooldownMs)}`);
  if (then.revealDecoy && !now.revealDecoy) parts.push("perce-brouillard (vraie composition des flottes qui te visent)");
  if (then.revealBoosts && !now.revealBoosts) parts.push("capsules révélées (stimulant chiffré)");
  const gateNext = gateCooldownMs(next);
  const gateNow = gateCooldownMs(level);
  if (gateNext !== null && gateNow === null) parts.push(`porte de saut (recharge ${formatWait(gateNext)})`);
  else if (gateNext !== null && gateNow !== null && gateNext < gateNow) parts.push(`porte toutes les ${formatWait(gateNext)}`);
  return parts.length ? `Niveau ${next} : ${parts.join(", ")}.` : null;
}

/** Une flotte qui te vise, vue par la phalange. */
function IncomingLine({ line, now }: { line: PhalanxFleetLine; now: number }) {
  return (
    <li className="hud-callout hud-tone-danger p-2.5 text-xs">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <AlertTriangle className="h-3.5 w-3.5 text-danger-glow" />
        <span className="text-slate-200">
          <PlayerName uid={line.ownerUid} pseudo={line.ownerPseudo} /> vise {line.targetOwnerUid ? `ta colonie ${line.targetPseudo}` : "ta planète mère"}
        </span>
        <span className="ml-auto font-mono tabular-nums text-danger-glow">impact dans {formatClock(Math.max(0, Math.floor((line.arriveAtMs - now) / 1000)))}</span>
      </p>
      <p className="mt-1 text-slate-400">{unitsSummary(line.units) || "Composition inconnue"}</p>
      {line.piercedText && (
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-violet-glow">
          <HudChip size="sm" tone="violet">
            Percé
          </HudChip>
          {line.piercedText.replace(/^Percé par la phalange : /, "")}
        </p>
      )}
      <div className="mt-1.5 flex justify-end">
        <ScanButton targetUid={line.ownerUid} pseudo={line.ownerPseudo} compact />
      </div>
    </li>
  );
}

/** 6.14.49 : panneau « Lune » de l'écran Statistiques : phalange, porte de saut, flottes percées ; sans lune, la réserve de pitié. */
export function MoonPanel({ player }: { player: PlayerState }) {
  useNowTicker();
  const moon = playerMoon(player);
  const level = phalanxLevel(player);
  const data = usePhalanxStore((s) => s.data);
  usePhalanxSync(player, `moon:${Math.floor(Date.now() / 60_000)}`);
  const now = Date.now();

  if (!moon) {
    const text = moonPityText(player);
    return (
      <HudPanel icon={<Moon />} title="Lune" tone="violet">
        <EmptyState size="sm" icon={<Moon />} title="Pas encore de lune">
          Une lune peut naître d'un grand combat subi sur ta planète mère. Elle porte une phalange et, au niveau {gateMinLevel()}, une porte de saut.
        </EmptyState>
        {text && (
          <div>
            <p className="text-xs text-slate-300">{text}</p>
            <HudMeter className="mt-1.5" percent={moonPity(player) * 100} tone="var(--color-violet-glow)" />
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
              Réserve <span className="tabular-nums">{Math.round(moonPity(player) * 100)} %</span> · +<span className="tabular-nums">{Math.round((Number(MOON_RULES.pityPerDefense) || 0) * 100)} %</span> par combat subi
            </p>
          </div>
        )}
      </HudPanel>
    );
  }

  const lvl = moonLevel(moon);
  const features = phalanxFeatures(level);
  const range = phalanxRange(player);
  const scanWait = left(Number(moon.scanReadyAtMs) || 0, now);
  const gateOpen = gateUnlocked(player);
  const gateWait = left(gateReadyAtMs(player), now);
  const gateCd = gateCooldownMs(lvl, player);
  const next = nextTierText(lvl);
  const missions = jumpMissions()
    .map((m) => MISSION_PLURAL[m] ?? FLEET_MISSION_LABELS[m] ?? m)
    .join(", ");
  const incoming = data?.incoming ?? [];
  const allies = data?.allies ?? [];

  return (
    <HudPanel
      icon={<Moon />}
      title={`Lune ${moon.name}`}
      tone="violet"
      aside={
        <HudChip size="sm" tone="violet">
          <span className="font-mono tabular-nums">niv. {lvl}</span>
        </HudChip>
      }
    >
      {PHALANX_RULES.enabled && level > 0 ? (
        <p className="text-xs text-slate-300">
          Ta phalange veille : les attaques sur tes alliés à moins de <span className="font-mono tabular-nums">{formatDecimal(range, 0)}</span> de distance te sont signalées.
        </p>
      ) : (
        <p className="text-xs text-slate-500">La phalange est coupée pour l'instant.</p>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatTile size="sm" label="Portée" tone="violet" value={<span className="font-mono tabular-nums">{level > 0 ? formatDecimal(range, 0) : "—"}</span>} sub="unités de carte" icon={<Radar className="h-3.5 w-3.5" />} />
        <StatTile
          size="sm"
          label="Balayage"
          tone={scanWait ? "neutral" : "mint"}
          value={<span className="font-mono tabular-nums">{level <= 0 ? "—" : (scanWait ?? "Prêt")}</span>}
          sub={level > 0 ? `${formatCompact(scanCost(player))} énergie · recharge ${formatWait(features.scanCooldownMs)}` : undefined}
          icon={<ScanSearch className="h-3.5 w-3.5" />}
        />
        <StatTile
          size="sm"
          label="Porte de saut"
          tone={!gateOpen ? "neutral" : gateWait ? "neutral" : "mint"}
          value={<span className="font-mono tabular-nums">{!JUMP_GATE_RULES.enabled ? "—" : !gateOpen ? `niv. ${gateMinLevel()}` : (gateWait ?? "Prête")}</span>}
          sub={!JUMP_GATE_RULES.enabled ? "coupée" : gateOpen && gateCd !== null ? `recharge ${formatWait(gateCd)}` : `s'ouvre au niveau ${gateMinLevel()}`}
          icon={<DoorOpen className="h-3.5 w-3.5" />}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {features.radar && <HudChip size="sm" tone="mint">Radar d'alliance</HudChip>}
        {features.revealDecoy && <HudChip size="sm" tone="mint">Perce-brouillard</HudChip>}
        {features.revealBoosts && <HudChip size="sm" tone="mint">Capsules révélées</HudChip>}
        {gateOpen && (
          <HudChip size="sm" tone="mint" title={`La porte ramène : ${missions}.`}>
            Porte de saut
          </HudChip>
        )}
      </div>
      {gateOpen && <p className="text-[11px] text-slate-400">La porte ramène à quai, d'un coup : {missions}. Bouton « Saut » dans tes flottes.</p>}
      {next && <p className="text-[11px] text-slate-500">Prochain palier · {next}</p>}

      {level > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="hud-eyebrow text-[10px] text-slate-500">Flottes qui te visent</p>
          {incoming.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune attaque en approche.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {incoming.map((l) => (
                <IncomingLine key={l.id} line={l} now={now} />
              ))}
            </ul>
          )}
          {allies.length > 0 && (
            <HudCallout tone="ember" alert className="text-xs">
              <Link to="/game/alliance" className="hover:underline">
                <span className="font-mono tabular-nums">{allies.length}</span> allié{allies.length > 1 ? "s" : ""} menacé{allies.length > 1 ? "s" : ""} dans ta portée : voir l'Alliance →
              </Link>
            </HudCallout>
          )}
        </div>
      )}
    </HudPanel>
  );
}

/** 6.14.49 : « Alliés menacés » (radar de la phalange), page Alliance. Rien sans lune. */
export function AlliedThreatsPanel() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const data = usePhalanxStore((s) => s.data);
  const [garrison, setGarrison] = useState<{ uid: string; pseudo: string } | null>(null);
  // Les attaques sur les alliés n'arrivent pas par l'abonnement aux flottes : relecture à la minute.
  usePhalanxSync(player, `allies:${Math.floor(Date.now() / 60_000)}`);
  const level = phalanxLevel(player);
  if (!player || level <= 0 || !PHALANX_RULES.enabled) return null;
  const now = Date.now();
  const allies = (data?.allies ?? []).filter((a) => a.arriveAtMs > now);
  return (
    <HudPanel icon={<Radar />} title="Alliés menacés" tone={allies.length > 0 ? "danger" : "muted"} aside={<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">portée <span className="tabular-nums">{formatDecimal(phalanxRange(player), 0)}</span></span>}>
      {allies.length === 0 ? (
        <EmptyState size="sm" icon={<Radar />} title="Aucun allié menacé">
          Ta phalange te signale toute attaque de joueur sur un allié dans ta portée.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {allies.map((a) => {
            const home = !a.targetOwnerUid;
            const pseudo = a.allyPseudo ?? a.targetPseudo;
            return (
              <li key={a.id} className="hud-callout hud-tone-danger hud-callout-alert p-2.5 text-xs">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-slate-200">
                    <PlayerName uid={a.ownerUid} pseudo={a.ownerPseudo} /> vise {pseudo} ({home ? "planète mère" : a.targetPseudo})
                  </span>
                  <span className="ml-auto font-mono tabular-nums text-danger-glow">impact dans {formatClock(Math.max(0, Math.floor((a.arriveAtMs - now) / 1000)))}</span>
                </p>
                <p className="mt-1 text-slate-400">{unitsSummary(a.units) || "Composition inconnue"}</p>
                <div className="mt-1.5 flex flex-wrap justify-end gap-2">
                  <ScanButton targetUid={a.ownerUid} pseudo={a.ownerPseudo} compact />
                  {home && a.allyUid && (
                    <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" onClick={() => setGarrison({ uid: a.allyUid!, pseudo })}>
                      <ShieldPlus className="mr-1 h-3.5 w-3.5" /> Envoyer une garnison
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[11px] text-slate-500">Composition affichée à ton allié (un leurre n'est percé que par sa propre lune).</p>
      <GarrisonDialog target={garrison} onClose={() => setGarrison(null)} />
    </HudPanel>
  );
}
