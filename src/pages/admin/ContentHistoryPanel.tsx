import { useEffect, useMemo, useState } from "react";
import { ChevronDown, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { RULE_GROUP_LABELS } from "@/game/content";
import { changedRuleGroups, diffValues, isSettingsHistoryKey, SETTINGS_HISTORY, settingsSnapshot, type DiffLine } from "@/game/contentHistory";
import { pb } from "@/lib/pocketbase";
import { cn, formatDateTime, timeAgo } from "@/lib/utils";

/* 5.23 : journal du contenu : chaque enregistrement d'une section (unités,
   reliques, règles…) garde l'état d'avant ; un clic y revient (et ce retour
   arrière est lui-même consigné, donc annulable). 30 versions par section.
   6.14.126 (AU27, lot AA8, AA-27) : « Ce qui a changé » (différence champ par
   champ avec l'état suivant), retour arrière d'un seul groupe de règles, et
   réglages serveur suivis (casino, générateurs, annonces, bandeaux, émojis,
   équipe). Le serveur valide chaque retour (garde de contenu). */

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
  // 6.14.126 (AA8) : réglages serveur suivis.
  ...Object.fromEntries(Object.entries(SETTINGS_HISTORY).map(([k, d]) => [k, d.label])),
};

const ACTION_LABELS: Record<string, string> = { update: "avant modification", delete: "avant remise à zéro", create: "avant personnalisation", rollback: "avant retour arrière", regenerate: "avant régénération par le générateur" };

function sizeOf(v: unknown): string {
  const n = JSON.stringify(v ?? null).length;
  return n > 1024 ? `${Math.round(n / 1024)} Ko` : `${n} o`;
}

const KIND_TONE: Record<DiffLine["kind"], string> = { added: "text-mint-glow", removed: "text-danger-glow", changed: "text-gold-glow" };
const KIND_LABEL: Record<DiffLine["kind"], string> = { added: "ajouté", removed: "retiré", changed: "changé" };

/** Différence d'une version avec l'état qui l'a suivie (version plus récente, ou contenu actuel). */
function VersionDiff({ lines, groups, busy, onGroup }: { lines: DiffLine[] | null; groups: string[]; busy: boolean; onGroup: ((g: string) => void) | null }) {
  if (!lines) return <p className="text-[11px] text-slate-500">Chargement…</p>;
  return (
    <div className="flex w-full min-w-0 flex-col gap-2 border-l border-cyan-glow/20 pl-2">
      {onGroup && groups.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] text-slate-400">Revenir pour un seul groupe :</span>
          {groups.map((g) => (
            <Button key={g} size="sm" variant="ghost" className="h-auto min-h-7 whitespace-normal py-1 text-left" disabled={busy} onClick={() => onGroup(g)}>
              <RotateCcw className="mr-1 h-3 w-3 shrink-0" /> {RULE_GROUP_LABELS[g] ?? g}
            </Button>
          ))}
        </div>
      )}
      {lines.length === 0 ? (
        <p className="text-[11px] text-slate-500">Aucune différence avec l'état suivant.</p>
      ) : (
        <ul className="flex flex-col gap-0.5 text-[11px]">
          {lines.map((l) => (
            <li key={`${l.kind}-${l.path}`} className="min-w-0 break-all">
              <span className={cn("font-mono uppercase", KIND_TONE[l.kind])}>{KIND_LABEL[l.kind]}</span> <span className="font-mono text-slate-200">{l.path}</span>{" "}
              <span className="text-slate-500">
                {l.kind === "changed" ? (
                  <>
                    {l.before} → {l.after}
                  </>
                ) : (
                  (l.after ?? l.before)
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
      {lines.length >= 200 && <p className="text-[11px] text-slate-500">200 premières différences seulement.</p>}
    </div>
  );
}

export function ContentHistoryPanel() {
  const [items, setItems] = useState<ContentVersion[]>([]);
  const [section, setSection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 6.14.126 (AA8) : version dépliée et sa différence avec l'état suivant.
  const [open, setOpen] = useState<string | null>(null);
  const [diff, setDiff] = useState<{ lines: DiffLine[]; groups: string[] } | null>(null);

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

  /** État d'avant (la version) et état d'après (version suivante de la même section, ou contenu actuel). */
  const toggle = async (v: ContentVersion) => {
    if (open === v.id) {
      setOpen(null);
      return;
    }
    setOpen(v.id);
    setDiff(null);
    const same = items.filter((x) => x.section === v.section);
    const newer = same[same.indexOf(v) - 1];
    let after: unknown = null;
    if (newer) after = newer.existed ? newer.data : null;
    else {
      try {
        const rec = await pb.collection("game_config").getFirstListItem<{ data: unknown }>(pb.filter("key = {:k}", { k: v.section }));
        after = isSettingsHistoryKey(v.section) ? settingsSnapshot(v.section, rec.data) : rec.data;
      } catch {
        after = null;
      }
    }
    const empty = v.section === "rules" ? {} : null;
    const before = v.existed ? v.data : empty;
    const next = after ?? empty;
    setDiff({ lines: diffValues(before, next), groups: v.section === "rules" ? changedRuleGroups(before, next) : [] });
  };

  const rollback = async (v: ContentVersion, group?: string) => {
    const name = SECTION_LABELS[v.section] ?? v.section;
    const ok = await askConfirm({
      title: group ? `Revenir pour « ${RULE_GROUP_LABELS[group] ?? group} » seulement ?` : `Revenir à cette version de « ${name} » ?`,
      message: group
        ? `Ce groupe de règles reprend l'état du ${formatDateTime(v.createdAtMs)} ; les autres groupes ne bougent pas. L'état actuel est gardé dans le journal.`
        : v.existed
          ? `Le contenu reprend l'état du ${formatDateTime(v.createdAtMs)}. L'état actuel est gardé dans le journal.`
          : "La section revient aux valeurs du code. L'état actuel est gardé dans le journal.",
      confirmLabel: "Revenir",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await pb.send("/api/cosmic/admin/content/rollback", { method: "POST", body: { versionId: v.id, ...(group ? { group } : {}) } });
      toast.success(group ? "Groupe restauré (appliqué aussi par le serveur)." : "Version restaurée (appliquée aussi par le serveur).");
      setOpen(null);
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
        <span className="text-xs text-slate-500">30 versions par section · un retour arrière se défait · contenu et réglages du serveur</span>
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
            <span className="min-w-0 text-slate-500">
              · {v.actorName || "?"} · {timeAgo(v.createdAtMs)} · <span className="font-mono">{v.existed ? sizeOf(v.data) : "valeurs du code"}</span>
            </span>
            {v.note && <span className="min-w-0 break-words text-slate-500">· {v.note}</span>}
            <div className="ml-auto flex flex-wrap gap-1">
              <Button size="sm" variant="ghost" aria-expanded={open === v.id} onClick={() => void toggle(v)}>
                <ChevronDown className={cn("mr-1 h-3.5 w-3.5 transition-transform", open === v.id && "rotate-180")} /> Ce qui a changé
              </Button>
              {SETTINGS_HISTORY[v.section]?.rollback === false ? (
                <span className="self-center text-[11px] text-slate-500" title={SETTINGS_HISTORY[v.section].why}>
                  Historique seul
                </span>
              ) : (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void rollback(v)}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Revenir à cette version
                </Button>
              )}
            </div>
            {open === v.id && <VersionDiff lines={diff?.lines ?? null} groups={diff?.groups ?? []} busy={busy} onGroup={v.section === "rules" ? (g) => void rollback(v, g) : null} />}
          </li>
        ))}
      </ul>
    </Card>
  );
}
