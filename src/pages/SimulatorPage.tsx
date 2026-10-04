import { useEffect, useMemo, useState } from "react";
import { assetUrl } from "@/lib/assets";
import { useSearchParams } from "react-router-dom";
import { Calculator, Shield, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, HudTag } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormationPicker, PosturePicker } from "@/components/game/FormationPicker";
import type { FormationId, PostureId } from "@/game/formations";
import { SPY_TIER_LABELS } from "@/game/espionage";
import { FACTIONS, pirateState } from "@/game/pirates";
import { lootFactor } from "@/game/events";
import { simulateAgainstReport, simulateLair, simulateRaid, simulateSandbox, type SimOutcome, type SimSide } from "@/game/simulator";
import { DEFENSIVE_UNITS, findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { subscribeSpyLog } from "@/services/playerService";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { cn, formatCompact, formatNumber, timeAgo } from "@/lib/utils";
import type { SpyReport, Units } from "@/types/game";

type TargetKind = "player" | "lair" | "raid" | "sandbox";

/* ---------- saisie d'unités ---------- */

function UnitRows({
  ids,
  value,
  onChange,
  max,
  withLevel,
}: {
  ids: string[];
  value: Units;
  onChange: (next: Units) => void;
  /** Quantités disponibles (flotte réelle) ; absent = libre. */
  max?: Record<string, number>;
  withLevel?: boolean;
}) {
  const set = (id: string, patch: Partial<{ count: number; level: number }>) => {
    const cur = value[id] ?? { count: 0, level: 1 };
    onChange({ ...value, [id]: { ...cur, ...patch } });
  };
  return (
    <div className="flex flex-col gap-1.5">
      {ids.map((id) => {
        const def = findUnit(id);
        if (!def) return null;
        const cur = value[id] ?? { count: 0, level: 1 };
        const cap = max?.[id];
        return (
          <div key={id} className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
            <img src={assetUrl(def.image)} alt="" className="h-8 w-8 shrink-0 object-contain" loading="lazy" />
            <span className="min-w-[7rem] flex-1 truncate text-sm text-slate-300">{def.name}</span>
            {withLevel && (
              <label className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                niv.
                <NumberInput size="sm" meter={false} min={1} max={def.maxLevel} value={cur.level} onChange={(v) => set(id, { level: v })} className="w-28" aria-label={`Niveau ${def.name}`} />
              </label>
            )}
            <NumberInput size="sm" value={cur.count} max={cap} onChange={(v) => set(id, { count: v })} className="w-44 shrink-0" aria-label={`Quantité ${def.name}`} />
            {cap !== undefined && <span className="w-10 shrink-0 text-right font-mono text-[10px] text-slate-500">/{formatCompact(cap)}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- résultat ---------- */

function LossList({ title, losses, recovered }: { title: string; losses: Record<string, number>; recovered?: Record<string, number> }) {
  const rows = Object.entries(losses).filter(([id, n]) => n > 0 || (recovered?.[id] ?? 0) > 0);
  return (
    <div>
      <p className="hud-eyebrow mb-1 text-[10px] text-slate-500">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500">Aucune perte</p>
      ) : (
        <ul className="space-y-0.5 text-xs">
          {rows.map(([id, n]) => (
            <li key={id} className="flex justify-between gap-2 text-slate-300">
              <span className="truncate">{findUnit(id)?.name ?? id}</span>
              <span className="font-mono tabular-nums">
                −{formatNumber(n)}
                {recovered?.[id] ? <span className="text-mint-glow"> (+{formatNumber(recovered[id])} réparés)</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultPanel({ result, defending }: { result: SimOutcome | null; defending?: boolean }) {
  if (!result) return <EmptyState icon={<Calculator className="h-5 w-5" />} title="Pas encore de simulation">Choisis une flotte et une cible.</EmptyState>;
  const { combat } = result;
  const myWin = defending ? combat.outcome !== "attacker_win" : combat.outcome === "attacker_win";
  const label = combat.outcome === "draw" ? "Match nul" : myWin ? "Victoire" : "Défaite";
  const tone = combat.outcome === "draw" ? "gold" : myWin ? "mint" : "danger";
  const total = combat.attackerPower + combat.defenderPower || 1;
  const factor = result.winFactor;
  const loot = Object.entries(combat.loot ?? {}).filter(([, n]) => (n ?? 0) > 0);
  const myXp = defending ? result.defenderXp : result.attackerXp;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <HudTag tone={tone}>{label}</HudTag>
        <span className="font-mono text-xs text-slate-400">
          XP {myXp >= 0 ? "+" : ""}
          {myXp}
        </span>
        {Number.isFinite(factor) && !defending && (
          <span className="text-xs text-slate-400">
            {factor < 1 ? `Marge : ta flotte pourrait être ${Math.round((1 - factor) * 100)} % plus petite.` : `Il faudrait ×${(Math.ceil(factor * 100 + 1) / 100).toLocaleString("fr-FR")} de puissance pour gagner.`}
          </span>
        )}
        {Number.isFinite(factor) && defending && (
          <span className="text-xs text-slate-400">
            {factor < 1 ? `Ta défense tient avec ${Math.round((1 - factor) * 100)} % de marge.` : `Il te manque ${Math.round((factor - 1) * 100)} % de puissance défensive.`}
          </span>
        )}
      </div>

      <div>
        <div className="flex justify-between font-mono text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Swords className="h-3 w-3" /> {formatCompact(combat.attackerPower)}
          </span>
          <span className="flex items-center gap-1">
            {formatCompact(combat.defenderPower)} <Shield className="h-3 w-3" />
          </span>
        </div>
        <div className="mt-1 flex h-2 overflow-hidden bg-white/5">
          <i className="block bg-ember-glow" style={{ width: `${(combat.attackerPower / total) * 100}%` }} />
          <i className="block flex-1 bg-cyan-glow" />
        </div>
        {(combat.shieldPercent ?? 0) > 0 && <p className="mt-1 text-[11px] text-slate-500">Bouclier : {Math.round((combat.shieldPercent ?? 0) * 100)} % de l'attaque absorbée.</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <LossList title={`Attaquant · ${Math.round(combat.attackerLossPercent * 100)} %`} losses={combat.attackerLosses} recovered={combat.attackerRecovered} />
        <LossList title={`Défenseur · ${Math.round(combat.defenderLossPercent * 100)} %`} losses={combat.defenderLosses} recovered={combat.defenderRecovered} />
      </div>

      {loot.length > 0 && (
        <div>
          <p className="hud-eyebrow mb-1 text-[10px] text-slate-500">Butin estimé (cale : {formatCompact(combat.cargoCapacity)})</p>
          <div className="flex flex-wrap gap-3">
            {loot.map(([res, n]) => (
              <span key={res} className="flex items-center gap-1 font-mono text-xs text-slate-200">
                <ResourceIcon id={res} className="h-4 w-4" /> {formatCompact(n ?? 0)}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.notes.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-slate-500">
          {result.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export function SimulatorPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const player = usePlayerStore((s) => s.player);
  const [params, setParams] = useSearchParams();
  const [kind, setKind] = useState<TargetKind>((params.get("mode") as TargetKind) || "player");
  const [freeFleet, setFreeFleet] = useState(false);
  const [fleet, setFleet] = useState<Units>({});
  const [reports, setReports] = useState<SpyReport[]>([]);
  const [reportId, setReportId] = useState<string>(params.get("rapport") ?? "");
  const [factionId, setFactionId] = useState<string>(FACTIONS[0]?.id ?? "");
  const [notoriety, setNotoriety] = useState<number | null>(null);
  const [defUnits, setDefUnits] = useState<Units>({});
  const [shield, setShield] = useState(0);
  const [defScrap, setDefScrap] = useState(0);
  const [formation, setFormation] = useState<FormationId>("balanced");
  const [defPosture, setDefPosture] = useState<PostureId>("standard");

  useEffect(() => {
    if (!uid) return;
    return subscribeSpyLog(uid, setReports);
  }, [uid]);

  // Dernier rapport exploitable (palier « Flotte et défenses » au moins) par cible.
  const targets = useMemo(() => {
    const seen = new Set<string>();
    return reports.filter((r) => {
      if (r.spyUid !== uid || (r.tier ?? 0) < 2 || seen.has(r.targetUid)) return false;
      seen.add(r.targetUid);
      return true;
    });
  }, [reports, uid]);
  const report = targets.find((r) => r.id === reportId) ?? targets[0] ?? null;
  const faction = FACTIONS.find((f) => f.id === factionId) ?? FACTIONS[0];

  const owned = useMemo(() => Object.fromEntries(OFFENSIVE_UNITS.map((id) => [id, player?.units[id]?.count ?? 0])), [player]);
  const ownedIds = OFFENSIVE_UNITS.filter((id) => freeFleet || (player?.units[id]?.level ?? 0) > 0);

  const result = useMemo<SimOutcome | null>(() => {
    if (!player) return null;
    const attackerUnits: Units = freeFleet ? Object.fromEntries(Object.entries(fleet).map(([id, s]) => [id, { level: s.level, count: s.count }])) : player.units;
    const sent = Object.fromEntries(Object.entries(fleet).map(([id, s]) => [id, s.count]));
    const attacker = { ...player, units: attackerUnits };
    const hasFleet = Object.values(sent).some((n) => n > 0);
    if (kind === "raid") {
      if (!faction) return null;
      return simulateRaid(player, faction, notoriety ?? pirateState(player, faction.id).notoriety);
    }
    if (!hasFleet) return null;
    if (kind === "player") return report ? simulateAgainstReport(attacker, sent, report, lootFactor(Date.now()), formation) : null;
    if (kind === "lair") return faction ? simulateLair(attacker, sent, faction, formation) : null;
    const atk: SimSide = { units: attackerUnits, techLevels: freeFleet ? {} : player.techLevels };
    return simulateSandbox(atk, sent, { units: defUnits, techLevels: {}, shieldPct: shield / 100, resources: { scrap: defScrap } }, 1, { formation, posture: defPosture });
  }, [player, freeFleet, fleet, kind, faction, notoriety, report, defUnits, shield, defScrap, formation, defPosture]);

  if (!player) return null;

  const changeKind = (k: string) => {
    setKind(k as TargetKind);
    const next = new URLSearchParams(params);
    next.set("mode", k);
    setParams(next, { replace: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Opérations"
        title="Simulateur de combat"
        description="La formule exacte des vrais combats, sans risque : vérifie l'issue, les pertes et le butin avant d'envoyer ta flotte."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className={cn("flex flex-col gap-3 p-4", kind === "raid" && "opacity-50")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="hud-title text-sm">Ta flotte</h2>
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={freeFleet}
                onChange={(e) => {
                  setFreeFleet(e.target.checked);
                  setFleet({});
                }}
              />
              Flotte libre (niveaux et quantités au choix)
            </label>
          </div>
          {kind === "raid" ? (
            <p className="text-xs text-slate-500">Lors d'un raid, c'est ta base qui défend avec toutes ses unités.</p>
          ) : ownedIds.length === 0 ? (
            <p className="text-xs text-slate-500">Aucune unité d'attaque débloquée : coche « Flotte libre » pour tester.</p>
          ) : (
            <UnitRows
              ids={ownedIds}
              value={freeFleet ? fleet : Object.fromEntries(ownedIds.map((id) => [id, { level: player.units[id]?.level ?? 1, count: fleet[id]?.count ?? 0 }]))}
              onChange={setFleet}
              max={freeFleet ? undefined : owned}
              withLevel={freeFleet}
            />
          )}
          {kind !== "raid" && <FormationPicker value={formation} onChange={setFormation} />}
        </Card>

        <Card className="flex flex-col gap-3 p-4">
          <h2 className="hud-title text-sm">Cible</h2>
          <Tabs value={kind} onValueChange={changeKind}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="player">Joueur</TabsTrigger>
              <TabsTrigger value="lair">Repaire</TabsTrigger>
              <TabsTrigger value="raid">Raid subi</TabsTrigger>
              <TabsTrigger value="sandbox">Bac à sable</TabsTrigger>
            </TabsList>

            <TabsContent value="player" className="mt-3">
              {targets.length === 0 ? (
                <p className="text-xs text-slate-500">Espionne d'abord un joueur (palier « Flotte et défenses » au moins) : ses forces serviront de base à la simulation.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <select value={report?.id ?? ""} onChange={(e) => setReportId(e.target.value)} className="h-9 border border-cyan-glow/20 bg-space-900 px-2 text-sm text-slate-200">
                    {targets.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.targetPseudo ?? r.targetUid} · {SPY_TIER_LABELS[r.tier ?? 0]} · {timeAgo(r.timestamp)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </TabsContent>

            {(["lair", "raid"] as const).map((k) => (
              <TabsContent key={k} value={k} className="mt-3 flex flex-col gap-2">
                <select value={faction?.id ?? ""} onChange={(e) => setFactionId(e.target.value)} className="h-9 border border-cyan-glow/20 bg-space-900 px-2 text-sm text-slate-200">
                  {FACTIONS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {k === "lair" ? f.lair.name : f.name}
                    </option>
                  ))}
                </select>
                {k === "raid" && faction && (
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    Notoriété
                    <input
                      type="range"
                      min={0}
                      max={faction.raid.maxNotoriety}
                      value={notoriety ?? pirateState(player, faction.id).notoriety}
                      onChange={(e) => setNotoriety(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="w-6 font-mono">{notoriety ?? pirateState(player, faction.id).notoriety}</span>
                  </label>
                )}
                {k === "lair" && <p className="text-xs text-slate-500">Puissance du repaire calculée comme sur le serveur, d'après ta propre base.</p>}
              </TabsContent>
            ))}

            <TabsContent value="sandbox" className="mt-3 flex flex-col gap-3">
              <UnitRows ids={[...DEFENSIVE_UNITS, ...OFFENSIVE_UNITS]} value={defUnits} onChange={setDefUnits} withLevel />
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-400">
                  Bouclier (%)
                  <NumberInput size="sm" max={95} value={shield} onChange={setShield} suffix="%" aria-label="Bouclier" className="mt-1 w-full" />
                </label>
                <label className="text-xs text-slate-400">
                  Ferraille exposée
                  <NumberInput size="sm" step={1000} value={defScrap} onChange={setDefScrap} aria-label="Ferraille exposée" className="mt-1 w-full" />
                </label>
              </div>
              <div>
                <p className="hud-eyebrow mb-1.5 text-[10px] text-slate-500">Posture du défenseur</p>
                <PosturePicker value={defPosture} onChange={setDefPosture} />
              </div>
              <p className="text-[11px] text-slate-500">Le défenseur du bac à sable n'a ni technologie ni réparation.</p>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="hud-title mb-3 text-sm">Résultat</h2>
        <ResultPanel result={result} defending={kind === "raid"} />
      </Card>
    </div>
  );
}
