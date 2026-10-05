import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gem, Map as MapIcon, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pocketbase";
import { findTemplate, mythicFor } from "@/game/relics";
import { sectorLabel, TERRITORY_RULES } from "@/game/territories";
import { allianceHue, useTerritories } from "@/services/territoryService";
import { cn, timeAgo } from "@/lib/utils";

/* v5.3 : suivi de la fin de partie dans Outils — reliques mythiques remises et contrôle des secteurs. */

/** Reliques mythiques remises (game_config « mythic_relics » : saison → joueur). */
export function MythicRelicsCard() {
  const [rows, setRows] = useState<{ seasonId: string; uid: string; pseudo: string }[] | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      let given: Record<string, string> = {};
      try {
        const rec = await pb.collection("game_config").getFirstListItem<{ data: Record<string, string> }>(pb.filter("key = {:k}", { k: "mythic_relics" }));
        given = rec.data ?? {};
      } catch {
        given = {};
      }
      const out = await Promise.all(
        Object.entries(given).map(async ([seasonId, uid]) => {
          const p = await pb.collection("profiles").getOne<{ pseudo: string }>(uid, { fields: "pseudo" }).catch(() => null);
          return { seasonId, uid, pseudo: p?.pseudo ?? "Joueur supprimé" };
        }),
      );
      if (active) setRows(out.sort((a, b) => b.seasonId.localeCompare(a.seasonId)));
    })();
    return () => {
      active = false;
    };
  }, []);
  const now = new Date();
  const seasonId = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const current = mythicFor(seasonId);
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h3 className="hud-title flex items-center gap-2 text-sm">
        <Gem className="h-4 w-4" style={{ color: "var(--th-rarity-mythic)" }} /> Reliques mythiques
      </h3>
      <p className="text-xs text-slate-400">
        Ce mois-ci ({seasonId}) : <span style={{ color: "var(--th-rarity-mythic)" }}>{current.template.name}</span>, portée par{" "}
        {current.source === "leviathan" ? "un boss mondial" : "le boss de saison"}.
      </p>
      {rows === null ? (
        <p className="text-xs text-slate-500">Chargement…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500">Aucune relique mythique remise pour l'instant.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-xs">
          {rows.map((r) => (
            <li key={r.seasonId} className="flex justify-between gap-3 border-b border-white/5 pb-1">
              <span className="font-mono text-slate-400">{r.seasonId}</span>
              <span className="text-slate-300">{findTemplate(mythicFor(r.seasonId).template.id)?.name}</span>
              <span className="font-semibold text-slate-100">{r.pseudo}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Contrôle des 24 secteurs, avec recalcul immédiat (sinon toutes les heures). */
export function TerritoriesAdminCard() {
  const map = useTerritories();
  const [busy, setBusy] = useState(false);
  const recompute = async () => {
    setBusy(true);
    try {
      await pb.send("/api/cosmic/admin/territories", { method: "POST" });
      toast.success("Territoires recalculés.");
    } catch {
      toast.error("Recalcul impossible.");
    } finally {
      setBusy(false);
    }
  };
  const held = (map?.sectors ?? []).filter((s) => s.allianceId);
  const byAlliance = new Map<string, { tag: string; count: number }>();
  for (const s of held) byAlliance.set(s.allianceId, { tag: s.tag, count: (byAlliance.get(s.allianceId)?.count ?? 0) + 1 });
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <h3 className="hud-title flex items-center gap-2 text-sm">
          <MapIcon className="h-4 w-4 text-cyan-glow" /> Territoires d'alliance
        </h3>
        <span className="ml-auto text-[11px] text-slate-500">{map ? `calculés ${timeAgo(map.atMs)}` : "jamais calculés"}</span>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => void recompute()}>
          <RefreshCw className={cn("h-3.5 w-3.5", busy && "animate-spin")} /> Recalculer
        </Button>
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${TERRITORY_RULES.cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: TERRITORY_RULES.cols * TERRITORY_RULES.rows }, (_, id) => {
          const s = map?.sectors.find((x) => x.id === id);
          const hue = s?.allianceId ? allianceHue(s.allianceId) : null;
          return (
            <div
              key={id}
              title={s?.contenders?.length ? (s.contenders as { tag?: string; levels: number }[]).map((c) => `${c.tag || "?"} : ${c.levels} niv.`).join(" · ") : "Aucun prétendant"}
              className="flex flex-col items-center border px-1 py-1.5 text-center"
              style={hue !== null ? { borderColor: `hsl(${hue} 70% 55% / 0.6)`, background: `hsl(${hue} 70% 45% / 0.15)` } : { borderColor: "color-mix(in srgb,var(--color-slate-100) 8%,transparent)" }}
            >
              <span className="font-mono text-[9px] text-slate-500">{sectorLabel(id)}</span>
              <span className="text-[11px] font-semibold text-slate-100">{s?.tag || "—"}</span>
              {s?.levels ? <span className="font-mono text-[9px] text-slate-400">{s.levels} niv.</span> : null}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400">
        {held.length} secteur{held.length > 1 ? "s" : ""} tenu{held.length > 1 ? "s" : ""}
        {byAlliance.size > 0 ? " : " + [...byAlliance.values()].map((a) => `${a.tag} ${a.count}`).join(", ") : ""}. Seuil : {TERRITORY_RULES.minLevels} niveaux.
      </p>
    </Card>
  );
}
