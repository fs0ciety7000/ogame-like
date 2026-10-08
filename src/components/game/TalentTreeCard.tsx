import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TALENT_BRANCHES, TALENT_RULES, TALENTS, talentDescription, talentPoints, talentState, type TalentDef } from "@/game/talents";
import { EFFECT_STATS } from "@/game/effects";
import { currentSeasonId } from "@/game/seasons";
import { GameActionError, learnTalent, resetTalents } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";
import { askConfirm } from "@/components/ui/confirm-dialog";

/* v5.1 : arbre de talents d'Ascension — 3 points par ascension, 3 branches de 5 talents, 3 rangs. */

/** 6.14.127 (AA9) : valeur du premier effet du talent (fiche de contenu) au rang donné. */
function fmt(t: TalentDef, rank: number): string {
  const e = t.effects?.[0];
  const v = (Number(e?.value) || 0) * rank;
  const unit = e ? EFFECT_STATS[e.stat]?.unit : "pct";
  if (unit === "level") return `+${v.toFixed(1).replace(".", ",")} niv.`;
  if (unit === "points") return `+${Math.round(v)} pt${Math.round(v) > 1 ? "s" : ""}`;
  return `+${Math.round(v * 100)} %`;
}

export function TalentTreeCard() {
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState<string | null>(null);
  if (!player) return null;
  const pts = talentPoints(player);
  if (pts.total === 0) return null;
  const st = talentState(player);
  const resetDone = st.resetSeasonId === currentSeasonId(Date.now());

  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-4 w-4 text-gold-glow" />
        <h2 className="hud-title text-sm">Talents d'Ascension</h2>
        <span className={cn("ml-2 border px-2 py-0.5 font-mono text-xs", pts.free > 0 ? "animate-pulse border-gold-glow/60 text-gold-glow" : "border-white/10 text-slate-400")}>
          {pts.free} point{pts.free > 1 ? "s" : ""} libre{pts.free > 1 ? "s" : ""} · {pts.spent}/{pts.total}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          disabled={busy !== null || resetDone || pts.spent === 0}
          title={resetDone ? "Déjà redistribué cette saison" : "Rendre tous les points (une fois par saison)"}
          onClick={() => void askConfirm({ title: "Redistribuer tous tes talents ?", message: "Possible une seule fois par saison.", confirmLabel: "Redistribuer", tone: "ember" }).then((ok) => { if (ok) void run("reset", resetTalents, "Talents redistribués : tous tes points sont libres."); })}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Redistribuer
        </Button>
      </div>
      <p className="-mt-2 text-xs text-slate-400">
        Chaque Ascension rapporte {TALENT_RULES.pointsPerAscension} points. Les talents sont permanents et se cumulent aux officiers et aux reliques ; redistribution possible une fois par saison.
      </p>
      <div className="grid gap-3 lg:grid-cols-3">
        {TALENT_BRANCHES.map((b) => (
          <div key={b.id} className="flex flex-col gap-2 border border-white/[0.06] bg-white/[0.015] p-3" style={{ "--branch": b.color } as React.CSSProperties}>
            <p className="hud-eyebrow text-[11px] text-[var(--branch)]">{b.name}</p>
            {TALENTS.filter((t) => t.branch === b.id && (!t.retired || (st.ranks[t.id] ?? 0) > 0)).map((t) => {
              const rank = st.ranks[t.id] ?? 0;
              // 6.14.127 (AA9) : un talent retiré reste affiché pour qui y a des rangs (effet gardé), sans nouveau rang.
              const max = rank >= TALENT_RULES.maxRank || !!t.retired;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={busy !== null || max || pts.free <= 0}
                  onClick={() => void run(t.id, () => learnTalent(t.id), `${t.name} : rang ${rank + 1}.`)}
                  className={cn(
                    "hud-cut-sm group flex flex-col gap-1 border p-2 text-left transition-colors",
                    rank > 0 ? "border-[color-mix(in_srgb,var(--branch)_50%,transparent)] bg-[color-mix(in_srgb,var(--branch)_8%,transparent)]" : "border-white/[0.07]",
                    !max && pts.free > 0 && "hover:border-[var(--branch)]",
                    (max || pts.free <= 0) && "cursor-default",
                  )}
                  title={t.retired ? "Talent retiré : tes rangs gardent leur effet" : max ? "Rang maximum" : pts.free <= 0 ? "Aucun point libre" : `Rang ${rank + 1} : ${fmt(t, rank + 1)}`}
                >
                  <span className="flex items-center gap-2">
                    <span className="flex-1 text-sm font-semibold text-slate-100">{t.name}</span>
                    <span className="font-mono text-[11px] text-[var(--branch)]">{rank > 0 ? fmt(t, rank) : "—"}</span>
                  </span>
                  <span className="text-[11px] text-slate-500">{talentDescription(t)}</span>
                  <span className="flex gap-1">
                    {Array.from({ length: TALENT_RULES.maxRank }, (_, i) => (
                      <span key={i} className={cn("h-1.5 flex-1", i < rank ? "bg-[var(--branch)] shadow-[0_0_6px_var(--branch)]" : "bg-white/[0.07]")} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}
