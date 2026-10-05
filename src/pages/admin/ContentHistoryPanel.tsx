import { useEffect, useMemo, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { pb } from "@/lib/pocketbase";
import { cn, timeAgo } from "@/lib/utils";

/* 5.23 : journal du contenu : chaque enregistrement d'une section (unités,
   reliques, règles…) garde l'état d'avant ; un clic y revient (et ce retour
   arrière est lui-même consigné, donc annulable). 30 versions par section. */

interface ContentVersion {
  id: string;
  section: string;
  existed: boolean;
  action: string;
  actorName: string;
  note: string;
  createdAtMs: number;
  data: unknown;
}

const SECTION_LABELS: Record<string, string> = {
  buildings: "Bâtiments",
  units: "Unités",
  technologies: "Technologies",
  missions: "Missions",
  factions: "Factions",
  ranks: "Rangs",
  achievements: "Succès",
  rules: "Règles",
  warlords: "Seigneurs",
  seasonPass: "Passe de saison",
  chronicles: "Chroniques",
  passSeasons: "Saisons du passe",
  relics: "Reliques",
  relicSettings: "Réglages des reliques",
  titles: "Titres",
  worldBosses: "Boss mondiaux",
  officers: "Officiers",
};

const ACTION_LABELS: Record<string, string> = { update: "avant modification", delete: "avant remise à zéro", create: "avant personnalisation", rollback: "avant retour arrière" };

function sizeOf(v: unknown): string {
  const n = JSON.stringify(v ?? null).length;
  return n > 1024 ? `${Math.round(n / 1024)} Ko` : `${n} o`;
}

export function ContentHistoryPanel() {
  const [items, setItems] = useState<ContentVersion[]>([]);
  const [section, setSection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await pb.collection("content_versions").getList<ContentVersion>(1, 100, { sort: "-createdAtMs", ...(section ? { filter: pb.filter("section = {:s}", { s: section }) } : {}) });
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(`Journal de contenu indisponible : ${(err as Error).message} (hooks à jour ?)`);
    }
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  const sections = useMemo(() => [...new Set(items.map((v) => v.section))], [items]);

  const rollback = async (v: ContentVersion) => {
    const ok = await askConfirm({
      title: `Revenir à cette version de « ${SECTION_LABELS[v.section] ?? v.section} » ?`,
      message: v.existed ? `Le contenu reprend l'état du ${new Date(v.createdAtMs).toLocaleString("fr-FR")}. L'état actuel est gardé dans le journal.` : "La section revient aux valeurs du code. L'état actuel est gardé dans le journal.",
      confirmLabel: "Revenir",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await pb.send("/api/cosmic/admin/content/rollback", { method: "POST", body: { versionId: v.id } });
      toast.success("Version restaurée (appliquée aussi par le serveur).");
      await load();
    } catch (err) {
      toast.error(`Retour impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <History className="h-4 w-4 text-cyan-glow" />
        <h2 className="hud-title text-sm text-slate-100">Journal de contenu</h2>
        <span className="text-xs text-slate-500">30 versions par section · un retour arrière se défait</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {["", ...Object.keys(SECTION_LABELS).filter((k) => sections.includes(k) || k === section)].map((k) => (
          <button
            key={k || "all"}
            type="button"
            onClick={() => setSection(k)}
            className={cn("hud-cut-sm border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors", section === k ? "border-cyan-glow/50 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 text-slate-400 hover:text-slate-200")}
          >
            {k ? SECTION_LABELS[k] : "Tout"}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-ember-glow">{error}</p>}
      {!error && items.length === 0 && <EmptyState size="sm" icon="🗂️" title="Aucune version">Les prochains enregistrements de contenu apparaîtront ici.</EmptyState>}
      <ul className="flex flex-col divide-y divide-white/5">
        {items.map((v) => (
          <li key={v.id} className="flex flex-wrap items-center gap-2 py-2 text-xs">
            <HudChip size="sm" tone="accent">
              {SECTION_LABELS[v.section] ?? v.section}
            </HudChip>
            <span className="text-slate-300">{ACTION_LABELS[v.action] ?? v.action}</span>
            <span className="text-slate-500">
              · {v.actorName || "?"} · {timeAgo(v.createdAtMs)} · <span className="font-mono">{v.existed ? sizeOf(v.data) : "valeurs du code"}</span>
            </span>
            {v.note && <span className="text-slate-500">· {v.note}</span>}
            <Button size="sm" variant="outline" className="ml-auto" disabled={busy} onClick={() => void rollback(v)}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Revenir à cette version
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
