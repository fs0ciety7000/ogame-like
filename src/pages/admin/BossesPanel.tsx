import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { HudChip } from "@/components/ui/hud";
import { WorldBossesPanel } from "@/pages/admin/WorldBossesPanel";
import { WorldBossRulesCard } from "@/pages/admin/WorldBossRulesCard";
import { SeasonBossPanel } from "@/pages/admin/SeasonBossPanel";
import { AllianceBossPanel } from "@/pages/admin/AllianceBossPanel";

/* 5.15 : tous les boss dans un seul onglet de l'administration, avec un
   sous-onglet par famille (mondiaux, de saison, d'alliance). */

const KINDS = [
  { id: "mondiaux", label: "Boss mondiaux", live: "/game/uber" },
  { id: "saison", label: "Boss de saison", live: "/game/boss" },
  { id: "alliance", label: "Boss d'alliance", live: null },
] as const;

export function BossesPanel() {
  const [params, setParams] = useSearchParams();
  const legacy = params.get("onglet") === "seasonBoss" ? "saison" : null;
  const kind = KINDS.find((k) => k.id === (params.get("boss") ?? legacy)) ?? KINDS[0];
  const pick = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("boss", id);
    setParams(next, { replace: true });
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Familles de boss">
        {KINDS.map((k) => (
          <HudChip key={k.id} asChild size="md" tone={k.id === kind.id ? "accent" : "neutral"}>
            <button type="button" role="tab" aria-selected={k.id === kind.id} onClick={() => pick(k.id)}>
              {k.label}
            </button>
          </HudChip>
        ))}
        {kind.live && (
          <Link to={kind.live} className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-glow">
            Suivi en direct et distribution des récompenses <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
      {kind.id === "mondiaux" && (
        <>
          <WorldBossesPanel />
          <WorldBossRulesCard />
        </>
      )}
      {kind.id === "saison" && <SeasonBossPanel />}
      {kind.id === "alliance" && <AllianceBossPanel />}
    </div>
  );
}
