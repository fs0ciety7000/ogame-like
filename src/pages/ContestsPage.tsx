import { Navigate } from "react-router-dom";
import { useAdminStatus } from "@/services/adminService";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContestCard } from "@/components/game/ContestCard";
import { ServerPotCard } from "@/components/game/ServerPotCard";
import { visibleContests } from "@/game/contests";
import { useContests } from "@/services/contestService";
import { useServerPot } from "@/services/serverPotService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";

/* v5.10.5 : concours du pot commun. */

export function ContestsPage() {
  useNowTicker();
  const now = Date.now();
  const player = usePlayerStore((s) => s.player);
  const state = useContests();
  const pot = useServerPot();
  // v5.13 : page réservée aux administrateurs (les concours ne sont plus montrés aux joueurs).
  const admin = useAdminStatus();
  if (admin === false) return <Navigate to="/game" replace />;
  if (!player || admin === null) return null;
  const list = state ? visibleContests(state, now) : [];
  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Social" title="Concours" description="Le pot commun du serveur se gagne ici : progresse sur le critère du concours pendant sa durée, et les premiers se partagent la cagnotte." />
      <ServerPotCard />
      {state === null ? (
        <p className="text-sm text-slate-500">Chargement…</p>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon={<Trophy className="h-10 w-10 text-gold-glow" />} title="Aucun concours pour l'instant">
            Le pot continue de se remplir avec les taxes du marché et des cadeaux. Le prochain concours sera annoncé ici et dans tes notifications.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((c) => (
            <ContestCard key={c.id} contest={c} player={player} pot={pot} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
