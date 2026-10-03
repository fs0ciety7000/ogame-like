import { useMemo, useState } from "react";
import { FileDown, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ShareCardDialog, type ShareCardSpec } from "@/components/game/ShareCardDialog";
import { empireStats, type EmpireStats } from "@/game/empireStats";
import { useFleetStore } from "@/store/fleetStore";
import { drawEmpireCard } from "@/lib/empireCard";
import { empireCardFromPlayer } from "@/lib/empireCardFromPlayer";
import { downloadText, empireStatsCsv, empireStatsJson, printEmpireReport } from "@/lib/empireExport";
import { avatarUrl, useAvatar } from "@/services/avatarService";
import { useAllianceTag } from "@/store/directoryStore";
import type { PlayerState } from "@/types/game";

/** v5.7 : carte partageable (image + lien avec aperçu) et export des statistiques. */
export function EmpireShareActions({ player, stats: given, kind }: { player: PlayerState; stats?: EmpireStats; kind: "empire" | "profile" }) {
  const fleets = useFleetStore((s) => s.fleets);
  // Page Profil : statistiques calculées ici (la page Statistiques passe les siennes).
  const computed = useMemo(() => (given ? null : empireStats(player, fleets, Date.now())), [given, player, fleets]);
  const stats = (given ?? computed)!;
  const [file] = useAvatar(player.uid);
  const tag = useAllianceTag(player.uid, player.allianceId) || undefined;
  const [spec, setSpec] = useState<ShareCardSpec | null>(null);
  const base = useMemo(() => `cosmic-empires-${player.pseudo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, [player.pseudo]);

  const openCard = () => {
    const now = Date.now();
    const input = empireCardFromPlayer(player, stats, { kind, tag, avatar: avatarUrl(player.uid, file), now });
    const o = stats.overview;
    setSpec({
      title: kind === "empire" ? "Carte de l'empire" : "Carte de profil",
      draw: (canvas) => drawEmpireCard(canvas, input),
      fileName: `${base}-${kind === "empire" ? "empire" : "profil"}.jpg`,
      shareTitle: `${tag ? `[${tag}] ` : ""}${player.pseudo} · ${o.rank}`,
      shareDescription: input.stats.map((s) => `${s.label} ${s.value}`).join(" · "),
      target: "/",
    });
  };

  const exportAs = (format: "csv" | "json") => {
    const day = new Date().toISOString().slice(0, 10);
    if (format === "csv") downloadText(`${base}-statistiques-${day}.csv`, empireStatsCsv(stats), "text/csv;charset=utf-8");
    else downloadText(`${base}-statistiques-${day}.json`, empireStatsJson(stats, Date.now()), "application/json");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={openCard}>
        <Share2 className="h-4 w-4" /> Carte à partager
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="secondary">
            <FileDown className="h-4 w-4" /> Exporter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => exportAs("csv")}>Tableur (CSV)</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => exportAs("json")}>Données (JSON)</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => printEmpireReport(stats, Date.now())}>Imprimer ou PDF</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ShareCardDialog spec={spec} onClose={() => setSpec(null)} />
    </div>
  );
}
