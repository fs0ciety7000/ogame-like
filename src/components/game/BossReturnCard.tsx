import { Link } from "react-router-dom";
import { Skull } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { HudChip } from "@/components/ui/hud";
import { BOSS_TONE, bossNavText, useBossNavInfo, type BossNavInfo } from "@/hooks/useBossStatus";
import { useHiddenRoutes } from "@/components/layout/NavBar";

/* 5.26.2 : accueil. État du boss mondial et du boss de saison, avec le temps
   avant leur retour (même calcul que le menu). Le bandeau d'attaque du boss
   mondial reste affiché au-dessus pendant son passage. */

function Row({ to, label, info }: { to: string; label: string; info: BossNavInfo | null }) {
  if (!info) return null;
  const text = bossNavText(info);
  return (
    <Link to={to} className="flex items-center gap-2 border border-white/5 bg-white/[0.02] px-2.5 py-2 text-sm transition-colors hover:border-cyan-glow/40">
      <span className="min-w-0 flex-1 truncate text-slate-200">{label}</span>
      <span className="hidden text-xs text-slate-500 sm:inline">{text.full}</span>
      <HudChip size="sm" tone={BOSS_TONE[info.phase]} className="font-mono tabular-nums">
        {text.chip}
      </HudChip>
    </Link>
  );
}

export function BossReturnCard() {
  const hidden = useHiddenRoutes();
  const world = useBossNavInfo("/game/uber");
  const season = useBossNavInfo("/game/boss");
  return (
    <HudPanel icon={<Skull />} title="Boss">
      <div className="flex flex-col gap-1.5">
        {!hidden.has("/game/uber") && <Row to="/game/uber" label="Boss mondial" info={world} />}
        {!hidden.has("/game/boss") && <Row to="/game/boss" label="Boss de saison" info={season} />}
      </div>
    </HudPanel>
  );
}
