import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { BOUNTY_RULES, bountyRank, KESH, rankName, viewBounties } from "@/game/bounties";
import { usePlayerStore } from "@/store/playerStore";
import { assetUrl } from "@/lib/assets";
import { formatNumber } from "@/lib/utils";

/* Encart des primes Kesh'Vaar (page Missions, v3.9). */
export function BountiesTeaser() {
  const player = usePlayerStore((s) => s.player);
  if (!player) return null;
  const st = viewBounties(player, Date.now());
  const left = BOUNTY_RULES.dailyLimit - st.doneToday;
  return (
    <Link
      to="/game/primes"
      className="hud-cut group relative flex items-center gap-4 overflow-hidden border border-gold-glow/30 bg-space-950/70 p-3 transition-colors hover:border-gold-glow/60"
    >
      <img src={assetUrl(KESH.banner)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 transition-opacity group-hover:opacity-30" />
      <img src={assetUrl(KESH.art)} alt="" className="relative h-16 w-12 border border-gold-glow/40 object-cover object-top" />
      <div className="relative min-w-0 flex-1">
        <p className="hud-title text-sm text-slate-100">Primes de l'Essaim Kesh'Vaar</p>
        <p className="text-xs text-slate-300">
          {left > 0 ? `${left} prime${left > 1 ? "s" : ""} possible${left > 1 ? "s" : ""} aujourd'hui` : "Plus de prime aujourd'hui"} · rang {rankName(bountyRank(st.reputation))} ·{" "}
          <img src={assetUrl(KESH.amberIcon)} alt="Ambre" className="inline-block h-4 w-4 align-[-0.25em]" /> {formatNumber(st.amber)}
        </p>
      </div>
      <ArrowRight className="relative h-4 w-4 text-gold-glow transition-transform group-hover:translate-x-1" />
    </Link>
  );
}
