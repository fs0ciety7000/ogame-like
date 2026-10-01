import { useState } from "react";
import { toast } from "sonner";
import { Crosshair, Skull, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, HudTag, StatTile } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormationPicker } from "@/components/game/FormationPicker";
import { computeFleetPower } from "@/game/combat";
import { formationEffects, type FormationId } from "@/game/formations";
import { isActive, LEVIATHAN_RULES, leviathanRanking, nextLeviathanStart, rewardHours, type LeviathanState } from "@/game/leviathan";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { adminLeviathan, sendLeviathanAssault, useLeviathan } from "@/services/leviathanService";
import { useAdminStatus } from "@/services/maintenanceService";
import { GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { cn, formatCompact, formatDuration, formatNumber } from "@/lib/utils";

function AssaultDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const [fleet, setFleet] = useState<Record<string, number>>({});
  const [formation, setFormation] = useState<FormationId>("balanced");
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const ids = OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage" && (player.units[id]?.count ?? 0) > 0);
  const selected = Object.fromEntries(Object.entries(fleet).filter(([, n]) => n > 0));
  const power = Math.round(computeFleetPower(player.units, player.techLevels, selected, ["attack"]) * formationEffects(formation).attackFactor);

  const send = async () => {
    setBusy(true);
    try {
      await sendLeviathanAssault(selected, formation);
      triggerWarpEffect();
      toast.success(`Flotte lancée : impact dans ${LEVIATHAN_RULES.flightMinutes} min.`);
      setFleet({});
      onClose();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Lancement impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Assaut sur le Léviathan</DialogTitle>
        <p className="text-sm text-slate-400">
          Les dégâts valent la puissance d'attaque de la flotte. {Math.round(LEVIATHAN_RULES.lossPct * 100)} % des vaisseaux sont détruits (en partie réparés par l'Atelier). Trajet de {LEVIATHAN_RULES.flightMinutes} min, puis retour.
        </p>
        <div className="mt-3 flex flex-col gap-1.5">
          {ids.map((id) => {
            const owned = player.units[id]?.count ?? 0;
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <img src={findUnit(id)?.image} alt="" className="h-7 w-7 object-contain" />
                <span className="flex-1 truncate text-slate-300">{findUnit(id)?.name}</span>
                <Input
                  type="number"
                  min={0}
                  value={fleet[id] || ""}
                  placeholder="0"
                  aria-label={`Quantité ${findUnit(id)?.name}`}
                  onChange={(e) => setFleet((f) => ({ ...f, [id]: Math.min(owned, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  className="h-8 w-24 text-right"
                />
                <button type="button" className="w-12 font-mono text-[10px] text-slate-500 hover:text-cyan-glow" onClick={() => setFleet((f) => ({ ...f, [id]: owned }))}>
                  /{formatCompact(owned)}
                </button>
              </div>
            );
          })}
        </div>
        <FormationPicker value={formation} onChange={setFormation} className="mt-3" />
        <p className="mt-2 text-xs text-slate-400">
          Dégâts estimés : <strong className="text-ember-glow">{formatNumber(power)}</strong>
        </p>
        <Button variant="danger" className="mt-3 w-full" disabled={busy || power <= 0} onClick={() => void send()}>
          <Crosshair className="mr-1.5 h-4 w-4" /> Lancer l'assaut
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Ranking({ state, uid }: { state: LeviathanState; uid: string }) {
  const ranking = leviathanRanking(state);
  if (ranking.length === 0) return <p className="text-xs text-slate-500">Personne n'a encore frappé.</p>;
  const top = ranking[0].damage;
  return (
    <ol className="flex flex-col gap-1.5">
      {ranking.map((c, i) => (
        <li key={c.uid} className={cn("grid grid-cols-[2rem_1fr_auto] items-center gap-2 text-sm", c.uid === uid && "text-cyan-glow")}>
          <span className="font-mono text-xs text-slate-500">#{i + 1}</span>
          <span className="min-w-0">
            <span className="block truncate">{c.pseudo}</span>
            <span className="mt-0.5 block h-1 bg-white/5">
              <i className="block h-full bg-ember-glow" style={{ width: `${(c.damage / top) * 100}%` }} />
            </span>
          </span>
          <span className="text-right font-mono text-xs tabular-nums">
            {formatCompact(c.damage)} <span className="text-slate-500">· {c.assaults} assaut{c.assaults > 1 ? "s" : ""}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function LeviathanPage() {
  useNowTicker();
  const now = Date.now();
  const player = usePlayerStore((s) => s.player);
  const state = useLeviathan();
  const admin = useAdminStatus();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!player) return null;

  const active = !!state && isActive(state, now);
  const mine = state?.contributions[player.uid];
  const wait = mine ? mine.lastLaunchMs + LEVIATHAN_RULES.cooldownHours * 3600_000 - now : 0;
  const next = nextLeviathanStart(now);
  const hpPct = state ? (state.hp / state.maxHp) * 100 : 0;

  const runAdmin = async (action: "start" | "stop") => {
    setBusy(true);
    try {
      await adminLeviathan(action);
      toast.success(action === "start" ? "Le Léviathan est lâché !" : "Le Léviathan s'est retiré : récompenses versées.");
    } catch (err) {
      toast.error((err as { response?: { message?: string } }).response?.message ?? "Action impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Opérations"
        title="Le Léviathan"
        description="Un monstre colossal surgit le premier week-end de chaque mois. Tout le serveur s'unit pour l'abattre ; chacun est récompensé selon ses dégâts."
      />

      {state ? (
        <Card className="relative flex flex-col gap-4 overflow-hidden p-5">
          <div className="flex flex-wrap items-center gap-3">
            <Skull className={cn("h-6 w-6", active ? "text-danger-glow" : "text-slate-500")} />
            <HudTag tone={active ? "danger" : state.status === "killed" ? "mint" : "gold"}>{active ? "En approche" : state.status === "killed" ? "Abattu" : "Retiré"}</HudTag>
            <span className="ml-auto font-mono text-xs text-slate-400">
              {active ? `repart dans ${formatDuration(Math.max(0, Math.floor((state.endMs - now) / 1000)))}` : `terminé ${new Date(state.endedAtMs || state.endMs).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`}
            </span>
          </div>
          <div>
            <div className="flex justify-between font-mono text-xs text-slate-400">
              <span>Structure</span>
              <span>
                {formatNumber(state.hp)} / {formatNumber(state.maxHp)}
              </span>
            </div>
            <div className="mt-1 h-4 overflow-hidden border border-danger-glow/40 bg-danger-glow/10">
              <i className="hud-sheen block h-full bg-gradient-to-r from-danger-glow to-ember-glow transition-[width] duration-700" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Tes dégâts" value={formatCompact(mine?.damage ?? 0)} sub={`${mine?.assaults ?? 0} assaut(s)`} tone="var(--color-ember-glow)" />
            <StatTile label="Récompense prévue" value={`${Math.round(rewardHours({ ...state, status: active ? "killed" : state.status }, player.uid) * 10) / 10} h`} sub="de ta production" tone="var(--color-mint-glow)" />
            <StatTile label="Participants" value={leviathanRanking(state).length} tone="var(--color-cyan-glow)" />
          </div>
          {active && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="danger" disabled={wait > 0} onClick={() => setOpen(true)}>
                <Crosshair className="mr-1.5 h-4 w-4" /> {wait > 0 ? `Prochain assaut dans ${formatDuration(Math.ceil(wait / 1000))}` : "Lancer un assaut"}
              </Button>
              <span className="text-xs text-slate-500">Un assaut toutes les {LEVIATHAN_RULES.cooldownHours} h.</span>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <EmptyState icon={<Skull className="h-5 w-5" />} title="Aucun Léviathan pour l'instant">
            {next ? `Prochaine apparition : ${new Date(next).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}.` : "Les apparitions mensuelles sont désactivées."}
          </EmptyState>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="hud-title flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-gold-glow" /> Classement des dégâts
          </h2>
          {state ? <Ranking state={state} uid={player.uid} /> : <p className="text-xs text-slate-500">—</p>}
        </Card>
        <Card className="flex flex-col gap-2 p-4 text-sm text-slate-300">
          <h2 className="hud-title text-sm">Règles</h2>
          <p>Structure : {LEVIATHAN_RULES.hpFactor} fois la puissance d'attaque cumulée des commandants actifs ces 7 derniers jours.</p>
          <p>
            Récompense : {LEVIATHAN_RULES.baseRewardHours} h de ta production, plus jusqu'à {LEVIATHAN_RULES.bonusRewardHours} h selon tes dégâts comparés au premier ; moitié moins s'il survit.
          </p>
          <p>Le premier en dégâts gagne le titre « {LEVIATHAN_RULES.title} » pendant {LEVIATHAN_RULES.titleDays} jours. Chaque participant à sa chute débloque le succès « Tueur de Léviathan ».</p>
          {admin === true && (
            <div className="mt-2 flex flex-wrap gap-2 border-t border-white/5 pt-3">
              <span className="w-full text-[11px] uppercase tracking-[0.15em] text-slate-500">Administration</span>
              <Button size="sm" variant="outline" disabled={busy || active} onClick={() => void runAdmin("start")}>
                Lâcher le Léviathan maintenant
              </Button>
              <Button size="sm" variant="outline" disabled={busy || !active} onClick={() => void runAdmin("stop")}>
                Le faire repartir (récompenses ×{LEVIATHAN_RULES.failedRewardFactor})
              </Button>
            </div>
          )}
        </Card>
      </div>

      <AssaultDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
