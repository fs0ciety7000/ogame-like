import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AmberAmount } from "@/components/ui/amber";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { bountyState } from "@/game/bounties";
import { freeRushWorkshop, GameActionError, rushWorkshop } from "@/services/playerService";
import { BuildingTiers, tierViewOf } from "@/components/game/BuildingTiers";
import { formatMinutes } from "@/game/buildingTiers";
import { Clock, Gauge, LifeBuoy, ShieldAlert, Wrench } from "lucide-react";
import { Card, HudBrackets } from "@/components/ui/card";
import { EmptyState, HUD_TONE, HudCallout, HudChip, HudMeter, HudTag, StatTile, type HudTone } from "@/components/ui/hud";
import { BUILDINGS, getRepairPercent } from "@/game/buildings";
import { COMBAT_RULES } from "@/game/combat";
import { withRepairBonus } from "@/game/modifiers";
import { findUnit } from "@/game/units";
import { WORKSHOP_SOURCE_LABELS, workshopFreeRushLeft, workshopRushCost, workshopSpeedBonus, workshopView } from "@/game/workshop";
import { assetUrl } from "@/lib/assets";
import { formatCompact, formatDuration, formatNumber } from "@/lib/utils";
import type { PlayerState } from "@/types/game";
import { DockPanel } from "@/components/game/DockPanel";

/* 5.20 : onglet « Atelier de réparation » de la page Bâtiments. File des
   unités immobilisées, coques abîmées, cadence de l'Atelier. Animations :
   étincelles de soudure quand l'Atelier travaille, jauges qui se remplissent,
   unités qui sortent de la file une fois réparées (prefers-reduced-motion
   respecté par MotionConfig). */

const SPARKS = Array.from({ length: 9 }, (_, i) => ({ i, x: Math.cos((i / 9) * Math.PI * 2) * 34, y: Math.sin((i / 9) * Math.PI * 2) * 22 - 10 }));

function WeldingSparks() {
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-[58%]">
      {SPARKS.map((s) => (
        <motion.span
          key={s.i}
          className="absolute block h-1 w-1 bg-gold-glow"
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: [0, s.x], y: [0, s.y, s.y + 18], opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: s.i * 0.11, ease: "easeOut" }}
        />
      ))}
      <motion.span
        className="absolute -left-3 -top-3 block h-6 w-6 rounded-full bg-gold-glow/40 blur-md"
        animate={{ opacity: [0.2, 0.9, 0.3, 0.8, 0.2] }}
        transition={{ duration: 1.1, repeat: Infinity }}
      />
    </div>
  );
}

const hullTone = (p: number): HudTone => (p >= 0.8 ? "mint" : p >= 0.4 ? "ember" : "danger");

export function WorkshopPanel({ player, now }: { player: PlayerState; now: number }) {
  const view = workshopView(player, now);
  const busy = view.jobs.length > 0 || view.hulls.length > 0;
  const saved = withRepairBonus(getRepairPercent(player.buildings), player);
  const inRepair = view.jobs.reduce((s, j) => s + j.job.count, 0);
  const left = (ms: number | null) => (ms ? formatDuration(Math.max(0, Math.ceil((ms - now) / 1000))) : "—");
  const amber = bountyState(player).amber;
  const speed = workshopSpeedBonus(player);
  const [busyRush, setBusyRush] = useState<string | null>(null);
  // 6.14.142 à 6.14.144 (PB-L1, PB-L3) : paliers de l'Atelier (Cale sèche, premiers soins, classe, réparation d'urgence).
  const atelierDef = BUILDINGS.find((b) => b.effect?.type === "repair");
  const tiers = atelierDef && view.level > 0 ? tierViewOf(atelierDef, player) : null;
  const free = workshopFreeRushLeft(player, now);

  // 6.14.144 (PB-L3, palier 20) : réparation d'urgence gratuite, une fois par jour.
  async function freeRush() {
    setBusyRush("free");
    try {
      const out = await freeRushWorkshop();
      const back = Object.values(out.units).reduce((a, b) => a + b, 0) + Object.values(out.ready).reduce((a, b) => a + b, 0);
      toast.success(`Réparation d'urgence : ${formatMinutes(out.seconds)} de réparation offertes${back > 0 ? `, ${formatNumber(back)} unité${back > 1 ? "s" : ""} réparée${back > 1 ? "s" : ""}` : ""}.`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réparation d'urgence impossible pour le moment.");
    } finally {
      setBusyRush(null);
    }
  }

  // 5.21 : terminer un lot (ou toute la file) contre de l'Ambre.
  async function rush(jobId?: string) {
    const cost = workshopRushCost(player, jobId);
    if (!cost.jobs.length) return;
    const count = cost.jobs.reduce((s, j) => s + j.count, 0);
    const ok = await askConfirm({
      title: jobId ? "Terminer cette réparation ?" : "Terminer toute la file ?",
      message: `${formatNumber(count)} unité${count > 1 ? "s" : ""} réparée${count > 1 ? "s" : ""} tout de suite, au lieu de ${formatDuration(cost.seconds)}. Celles en Cale sèche y attendent une place au hangar.`,
      details: (
        <span className="flex items-center gap-2 text-sm text-slate-300">
          Coût : <AmberAmount value={cost.amber} className="font-mono text-slate-100" /> <span className="text-slate-500">(tu en as <span className="font-mono">{formatNumber(amber)}</span>)</span>
        </span>
      ),
      confirmLabel: "Payer et terminer",
      tone: "gold",
    });
    if (!ok) return;
    setBusyRush(jobId ?? "all");
    try {
      await rushWorkshop(jobId);
      toast.success("Réparations terminées.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Impossible de terminer ces réparations pour le moment.");
    } finally {
      setBusyRush(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="relative overflow-hidden">
        <HudBrackets />
        <div className="grid gap-4 p-4 sm:grid-cols-[12rem_1fr] sm:p-5">
          <div className="hud-stage relative grid h-40 place-items-center">
            <motion.img
              src={assetUrl("/assets/buildings/atelier_reparation.webp")}
              alt="Atelier de réparation"
              className="relative max-h-36 object-contain"
              animate={busy ? { y: [0, -3, 0] } : undefined}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            {busy && <WeldingSparks />}
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="hud-title text-lg text-slate-100">Atelier de réparation</h2>
              {view.level > 0 ? <HudTag tone="accent">Niveau {view.level}</HudTag> : <HudTag tone="ember">Non construit</HudTag>}
              {busy && (
                <HudChip tone="ember" size="sm" alert>
                  En réparation
                </HudChip>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <StatTile size="sm" tone="accent" icon={<Gauge className="h-4 w-4" />} label="Cadence" value={<span className="font-mono">{formatNumber(Math.round(view.rate))} PV/s</span>} sub={speed > 0 ? `bonus de cadence +${Math.round(speed * 100)} %` : `+${Math.round(COMBAT_RULES.workshopLevelGain * 100)} % par niveau`} />
              <StatTile size="sm" tone="mint" icon={<LifeBuoy className="h-4 w-4" />} label="Unités sauvées" value={<span className="font-mono">{Math.round(saved * 100)} %</span>} sub="des unités détruites" />
              <StatTile size="sm" tone={inRepair > 0 ? "ember" : "neutral"} icon={<Wrench className="h-4 w-4" />} label="Immobilisées" value={<span className="font-mono">{formatNumber(inRepair)}</span>} sub={`${view.jobs.length} lot${view.jobs.length > 1 ? "s" : ""} en file`} />
              <StatTile size="sm" tone="neutral" icon={<Clock className="h-4 w-4" />} label="Tout réparé dans" value={<span className="font-mono">{left(view.doneAtMs)}</span>} />
            </div>
          </div>
        </div>
      </Card>

      <HudCallout tone="accent" className="text-xs text-slate-300">
        Après un combat, tes unités gardent leurs dégâts : une flotte abîmée tire moins et encaisse moins. Les unités détruites que l'Atelier sauve
        restent <strong className="text-slate-100">immobilisées</strong> jusqu'à ce que l'Atelier leur ait rendu tous leurs points de vie : elles gardent leur place de hangar, sauf
        celles posées en <strong className="text-slate-100">Cale sèche</strong>.
        Il répare d'abord la file, dans l'ordre, puis les coques abîmées. Pour aller plus vite : la techno{" "}
        <Link to="/game/labo" className="text-cyan-glow hover:underline">
          Nanoréparation
        </Link>
        , le{" "}
        <Link to="/game/etat-major" className="text-cyan-glow hover:underline">
          Mécanicien
        </Link>{" "}
        en poste, la relique Clé de soudure, des Vaisseaux-ateliers à quai, ou l'Ambre pour terminer un lot.{" "}
        {view.level <= 0 && (
          <>
            Sans Atelier, tes équipages réparent seulement à {Math.round(COMBAT_RULES.workshopBaseFactor * 100)} % de la cadence de base.{" "}
            <Link to="/game/labo" className="text-cyan-glow hover:underline">
              Débloquer l'Atelier au Labo
            </Link>
          </>
        )}
      </HudCallout>

      {tiers && (
        <Card className="p-4">
          <BuildingTiers view={tiers} player={player} now={now} />
        </Card>
      )}

      <DockPanel player={player} view={view} />

      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="hud-eyebrow text-[11px] text-slate-400">File de réparation</h3>
          {view.jobs.length > 0 && free.left > 0 && (
            <Button size="sm" variant="secondary" disabled={!!busyRush} onClick={() => void freeRush()} title="Palier Signature de l'Atelier : une fois par jour, sans Ambre.">
              <LifeBuoy className="h-3.5 w-3.5" /> Urgence · {formatMinutes(free.seconds)} offertes
            </Button>
          )}
          {view.jobs.length > 1 && (
            <Button size="sm" variant="outline" disabled={!!busyRush || amber < workshopRushCost(player).amber} onClick={() => rush()}>
              <Wrench className="h-3.5 w-3.5" /> Tout terminer · <AmberAmount value={workshopRushCost(player).amber} className="font-mono" />
            </Button>
          )}
        </div>
        {view.jobs.length === 0 ? (
          <Card>
            <EmptyState icon={<Wrench className="h-5 w-5" />} title="Aucune unité immobilisée">
              Les unités sauvées après un combat arriveront ici.
            </EmptyState>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {view.jobs.map(({ job, endsAtMs, progress }, i) => {
                const unit = findUnit(job.unitId);
                return (
                  <motion.li
                    key={job.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.35 } }}
                    className="glass-panel hud-cut-sm relative flex flex-wrap items-center gap-3 overflow-hidden p-3"
                  >
                    {i === 0 && (
                      <motion.span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-glow/10 to-transparent"
                        animate={{ x: ["-100%", "320%"] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    <img src={assetUrl(unit?.image ?? "")} alt="" className="relative h-12 w-12 shrink-0 object-contain" />
                    <div className="relative min-w-[11rem] flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm text-slate-100">
                          <span className="font-mono">{formatNumber(job.count)}</span> × {unit?.name ?? job.unitId}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{WORKSHOP_SOURCE_LABELS[job.source] ?? job.source}</span>
                        {(view.dock.jobs[job.id] ?? 0) > 0 && <HudChip size="sm" tone="neutral">{(view.dock.jobs[job.id] ?? 0) >= job.count ? "En cale" : `${formatNumber(view.dock.jobs[job.id] ?? 0)} en cale`}</HudChip>}
                        {i === 0 ? (
                          <HudChip tone="accent" size="sm" alert>
                            En cours
                          </HudChip>
                        ) : (
                          <HudTag tone="accent">En attente</HudTag>
                        )}
                      </div>
                      <HudMeter percent={progress * 100} className="mt-2 h-1.5" />
                      <p className="mt-1 flex justify-between font-mono text-[11px] text-slate-500">
                        <span>
                          {formatCompact(job.hpTotal - job.hpLeft)} / {formatCompact(job.hpTotal)} PV
                        </span>
                        <span>prêtes dans {left(endsAtMs)}</span>
                      </p>
                    </div>
                    <div className="relative w-full shrink-0 sm:w-auto">
                      <Button size="sm" variant="outline" disabled={!!busyRush || amber < workshopRushCost(player, job.id).amber} onClick={() => rush(job.id)} title="Terminer ce lot tout de suite contre de l'Ambre">
                        Terminer · <AmberAmount value={workshopRushCost(player, job.id).amber} className="font-mono" />
                      </Button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="hud-eyebrow text-[11px] text-slate-400">Coques abîmées</h3>
        {view.hulls.length === 0 ? (
          <Card>
            <EmptyState icon={<ShieldAlert className="h-5 w-5" />} title="Flotte intacte">
              Aucune unité abîmée : toutes se battent à pleine puissance.
            </EmptyState>
          </Card>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-2">
            {view.hulls.map((h) => {
              const unit = findUnit(h.unitId);
              const tone = hullTone(h.percent);
              return (
                <div key={h.unitId} className="glass-panel hud-cut-sm flex items-center gap-3 p-3">
                  <img src={assetUrl(unit?.image ?? "")} alt="" className="h-10 w-10 shrink-0 object-contain" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm text-slate-200">{unit?.name ?? h.unitId}</span>
                      <span className="font-mono text-xs" style={{ color: HUD_TONE[tone] }}>
                        {Math.round(h.percent * 100)} %
                      </span>
                    </div>
                    <div className="relative mt-1.5 h-1.5 overflow-hidden bg-white/[0.06]">
                      <motion.i
                        className="absolute inset-y-0 left-0 block"
                        style={{ background: HUD_TONE[tone] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${h.percent * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-slate-500">
                      {formatNumber(h.count)} unités · {formatCompact(h.missing)} PV à rendre
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {view.hulls.length > 0 && (
          <p className="text-[11px] text-slate-500">
            Coques réparées dans <span className="font-mono">{left(view.hullDoneAtMs)}</span>, après la file. Une unité ne descend jamais sous {Math.round((1 - COMBAT_RULES.hullMaxDamage) * 100)} % de ses PV : au-delà, elle est détruite.
          </p>
        )}
      </section>
    </div>
  );
}
