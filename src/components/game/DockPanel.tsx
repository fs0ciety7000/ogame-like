import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Anchor, Lock, PackageCheck, Recycle } from "lucide-react";
import { Card, HudBrackets } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { CostPill, HudCallout, HudChip, HudMeter, HudTag, QtyStepper, StatTile } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { DOCK_TIERS, findBuilding } from "@/game/buildings";
import { COMBAT_RULES } from "@/game/combat";
import { findUnit } from "@/game/units";
import { UNIT_CLASS_LABELS } from "@/game/unitClasses";
import { DOCK_POLICY_LABELS, dockScrapValue, workshopState, type DockPolicy, type DockPriority, type WorkshopView } from "@/game/workshop";
import { assetUrl } from "@/lib/assets";
import { formatCompact, formatNumber } from "@/lib/utils";
import { dockCommission, dockScrap, dockSettings, GameActionError } from "@/services/playerService";
import type { PlayerState } from "@/types/game";

/* 5.28 : Cale sèche, dans l'onglet Atelier (docs/proposals/cale-seche.md).
   Postes occupés, vaisseaux prêts à remettre en service, paliers, Triage et
   ordre de réparation. Couleurs : accent = action à mener (prêts), mint = palier
   atteint, ember = cale pleine, danger = démanteler (perte). */

const TIERS: { level: number; name: string; effect: string }[] = [
  { level: 1, name: "Cale sèche", effect: "Les vaisseaux sauvés occupent des postes, pas le hangar." },
  { level: DOCK_TIERS.triage, name: "Triage", effect: `Démanteler en cale (${Math.round(COMBAT_RULES.dockScrapRefund * 100)} % du prix) et réglage par défaut après un combat.` },
  { level: DOCK_TIERS.auto, name: "Remise automatique", effect: `Les prêts rentrent seuls dès qu'une place se libère ; l'Atelier répare ${Math.round(COMBAT_RULES.dockAutoSpeedBonus * 100)} % plus vite.` },
  { level: DOCK_TIERS.priority, name: "Priorités", effect: "Choisir la classe réparée en premier." },
  { level: DOCK_TIERS.orbital, name: "Cale orbitale", effect: "+5 points de vaisseaux sauvés après chaque combat." },
];

const POLICY_SHORT: Record<DockPolicy, string> = { repair: "Tout réparer", scrapOverflow: "Surplus démantelé", scrapAll: "Tout démanteler" };
const PRIORITIES: DockPriority[] = ["arrival", "heavy", "medium", "light", "support"];
const priorityLabel = (p: DockPriority) => (p === "arrival" ? "Ordre d'arrivée" : `${UNIT_CLASS_LABELS[p]} d'abord`);

export function DockPanel({ player, view }: { player: PlayerState; view: WorkshopView }) {
  const dock = view.dock;
  const def = findBuilding("cale_seche");
  const st = workshopState(player);
  const [busy, setBusy] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});

  const readyIds = Object.keys(dock.ready);
  const repairingByType: Record<string, number> = {};
  for (const { job } of view.jobs) repairingByType[job.unitId] = (repairingByType[job.unitId] ?? 0) + job.count;
  const types = Array.from(new Set([...readyIds, ...Object.keys(repairingByType)]));
  const readyTotal = Object.values(dock.ready).reduce((a, b) => a + b, 0);
  const full = dock.capacity > 0 && dock.used >= dock.capacity;
  const triage = dock.level >= DOCK_TIERS.triage;
  const policy: DockPolicy = st.policy ?? "repair";
  const priority: DockPriority = st.priority ?? "arrival";

  async function commission(unitId?: string) {
    setBusy(unitId ?? "all");
    try {
      const out = await dockCommission(unitId);
      const n = Object.values(out.units).reduce((a, b) => a + b, 0);
      toast.success(`${formatNumber(n)} vaisseau${n > 1 ? "x" : ""} de retour au hangar.`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Remise en service impossible pour le moment.");
    } finally {
      setBusy(null);
    }
  }

  async function scrap(unitId: string, max: number) {
    const n = Math.min(max, qty[unitId] ?? max);
    const unit = findUnit(unitId);
    const refund = dockScrapValue(player, unitId, n, Date.now());
    const ok = await askConfirm({
      title: `Démanteler ${formatNumber(n)} × ${unit?.name ?? unitId} ?`,
      message: "Ces vaisseaux sont perdus pour de bon : leurs pièces reviennent en ressources et leur place se libère tout de suite.",
      details: (
        <span className="flex flex-wrap gap-1.5">
          <CostPill ok>
            <ResourceIcon id="scrap" /> {formatCompact(refund.scrap)}
          </CostPill>
          <CostPill ok>
            <ResourceIcon id="energy" /> {formatCompact(refund.energy)}
          </CostPill>
        </span>
      ),
      confirmLabel: "Démanteler",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(`scrap-${unitId}`);
    try {
      await dockScrap(unitId, n);
      toast.success(`${formatNumber(n)} × ${unit?.name ?? unitId} démantelé${n > 1 ? "s" : ""}.`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Démantèlement impossible pour le moment.");
    } finally {
      setBusy(null);
    }
  }

  async function save(settings: { policy?: DockPolicy; priority?: DockPriority }) {
    setBusy("settings");
    try {
      await dockSettings(settings);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réglage impossible pour le moment.");
    } finally {
      setBusy(null);
    }
  }

  if (dock.level <= 0) {
    // 5.28.1 : sans Cale sèche, des vaisseaux peuvent quand même attendre (épave d'expédition) : on les montre.
    return (
      <div className="flex flex-col gap-3">
        {readyTotal > 0 && (
          <HudCallout tone="accent" className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
            <span className="flex items-start gap-2">
              <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />
              <span>
                <strong className="text-slate-100">Prêts</strong> :{" "}
                {readyIds.map((id, i) => (
                  <span key={id}>
                    {i > 0 && ", "}
                    <span className="font-mono tabular-nums">{formatNumber(dock.ready[id])}</span> × {findUnit(id)?.name ?? id}
                  </span>
                ))}
                . Remets-les en service quand ton hangar a de la place.
              </span>
            </span>
            <Button size="sm" disabled={!!busy} onClick={() => void commission()}>
              Remettre en service
            </Button>
          </HudCallout>
        )}
        <HudCallout tone="accent" className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <span className="flex items-start gap-2">
            <Anchor className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />
            <span>
              <strong className="text-slate-100">Cale sèche</strong> : des postes pour les vaisseaux en réparation, hors du hangar. Le hangar reste libre pour
              reconstruire. {def?.requires && <>Requis : Atelier de réparation niveau <span className="font-mono">{def.requires.level}</span>.</>}
            </span>
          </span>
          <Button asChild size="sm" variant="outline">
            <Link to="/game/batiments">Voir le bâtiment</Link>
          </Button>
        </HudCallout>
      </div>
    );
  }

  return (
    <Card className="relative">
      <HudBrackets />
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Anchor className="h-5 w-5 text-cyan-glow" />
          <h2 className="hud-title text-lg text-slate-100">Cale sèche</h2>
          <HudTag tone="accent">Niveau {dock.level}</HudTag>
          {full && <HudTag tone="ember">Pleine</HudTag>}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <StatTile size="sm" tone={full ? "ember" : "neutral"} icon={<Anchor className="h-4 w-4" />} label="Postes occupés" value={<span className="font-mono">{formatNumber(dock.used)} / {formatNumber(dock.capacity)}</span>} sub="places hors hangar" />
          <StatTile size="sm" tone={readyTotal > 0 ? "accent" : "neutral"} icon={<PackageCheck className="h-4 w-4" />} label="Prêts" value={<span className="font-mono">{formatNumber(readyTotal)}</span>} sub="à remettre en service" />
          <StatTile size="sm" tone="neutral" icon={<Recycle className="h-4 w-4" />} label="Triage" value={<span className="text-sm">{triage ? POLICY_SHORT[policy] : "Niveau 5"}</span>} sub={triage ? "après chaque combat" : "pour démanteler en cale"} />
        </div>
        <HudMeter percent={dock.capacity > 0 ? (dock.used / dock.capacity) * 100 : 0} tone={full ? "var(--color-ember-glow)" : undefined} />

        {types.length > 0 && (
          <ul className="flex flex-col gap-2">
            {types.map((id) => {
              const unit = findUnit(id);
              const ready = dock.ready[id] ?? 0;
              const repairing = repairingByType[id] ?? 0;
              const all = ready + repairing;
              return (
                <li key={id} className="glass-panel hud-cut-sm flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <img src={assetUrl(unit?.image ?? "")} alt="" className="h-10 w-10 shrink-0 object-contain" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-100">{unit?.name ?? id}</p>
                      <p className="flex flex-wrap gap-1.5 pt-0.5">
                        {ready > 0 && <HudTag tone="accent">{formatNumber(ready)} prêts</HudTag>}
                        {repairing > 0 && <HudTag tone="ember">{formatNumber(repairing)} en réparation</HudTag>}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {ready > 0 && (
                      <Button size="sm" disabled={!!busy} onClick={() => void commission(id)}>
                        Remettre en service
                      </Button>
                    )}
                    {triage && (
                      <>
                        <div className="w-full sm:w-56">
                          <QtyStepper value={Math.min(all, qty[id] ?? all)} onChange={(v) => setQty((q) => ({ ...q, [id]: v }))} max={all} />
                        </div>
                        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => void scrap(id, all)}>
                          Démanteler
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {readyIds.length > 1 && (
          <Button className="self-start" disabled={!!busy} onClick={() => void commission()}>
            Tout remettre en service
          </Button>
        )}

        {triage && (
          <div className="flex flex-col gap-1.5">
            <p className="hud-eyebrow text-[11px] text-slate-400">Après un combat</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Triage après un combat">
              {(Object.keys(DOCK_POLICY_LABELS) as DockPolicy[]).map((p) => (
                <HudChip key={p} asChild tone={policy === p ? "accent" : "neutral"} size="sm">
                  <button type="button" aria-pressed={policy === p} disabled={busy === "settings"} onClick={() => void save({ policy: p })}>
                    {DOCK_POLICY_LABELS[p]}
                  </button>
                </HudChip>
              ))}
            </div>
            {st.lastScrap && (
              <p className="text-xs text-slate-500">
                Dernier démantèlement automatique :{" "}
                {Object.entries(st.lastScrap.units)
                  .map(([id, n]) => `${formatNumber(n)} × ${findUnit(id)?.name ?? id}`)
                  .join(", ")}{" "}
                → <span className="font-mono">{formatCompact(st.lastScrap.refund.scrap)}</span> ferraille, <span className="font-mono">{formatCompact(st.lastScrap.refund.energy)}</span> énergie.
              </p>
            )}
          </div>
        )}

        {dock.level >= DOCK_TIERS.priority && (
          <div className="flex flex-col gap-1.5">
            <p className="hud-eyebrow text-[11px] text-slate-400">Ordre de réparation</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ordre de réparation">
              {PRIORITIES.map((p) => (
                <HudChip key={p} asChild tone={priority === p ? "accent" : "neutral"} size="sm">
                  <button type="button" aria-pressed={priority === p} disabled={busy === "settings"} onClick={() => void save({ priority: p })}>
                    {priorityLabel(p)}
                  </button>
                </HudChip>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <p className="hud-eyebrow text-[11px] text-slate-400">Paliers</p>
          <ol className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
            {TIERS.map((t) => {
              const reached = dock.level >= t.level;
              return (
                <li key={t.level} className="glass-panel hud-cut-sm p-2.5">
                  <p className="flex items-center gap-1.5">
                    <HudChip size="sm" tone={reached ? "mint" : "neutral"}>Niv. {t.level}</HudChip>
                    {!reached && <Lock className="h-3 w-3 text-slate-500" aria-label="Pas encore atteint" />}
                  </p>
                  <p className="mt-1 text-xs text-slate-200">{t.name}</p>
                  <p className="text-[11px] leading-snug text-slate-500">{t.effect}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </Card>
  );
}
