import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminListLogs, type AdminLogEntry } from "@/services/adminService";
import { pb } from "@/lib/pocketbase";

const ACTION_LABEL: Record<AdminLogEntry["action"], { label: string; variant: "success" | "warning" | "alert" }> = {
  create: { label: "Création", variant: "success" },
  update: { label: "Modification", variant: "warning" },
  delete: { label: "Suppression", variant: "alert" },
};

const COLLECTION_LABEL: Record<string, string> = {
  players: "Joueur",
  queues: "Files d'attente",
  game_config: "Contenu du jeu",
  game_assets: "Image",
  admins: "Administrateurs",
};

const FILTERS = [
  { value: "", label: "Tout" },
  { value: "players", label: "Joueurs" },
  { value: "game_config", label: "Contenu" },
  { value: "admins", label: "Administrateurs" },
];

function Value({ value }: { value: unknown }) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return <span className="break-all font-mono text-[11px]">{text && text.length > 400 ? `${text.slice(0, 400)}…` : text}</span>;
}

function LogRow({ log }: { log: AdminLogEntry }) {
  const [open, setOpen] = useState(false);
  const action = ACTION_LABEL[log.action] ?? { label: log.action, variant: "warning" as const };
  const fields = Object.keys(log.changes ?? {});
  return (
    <div className="border-b border-white/5 py-2 last:border-0">
      <button type="button" className="flex w-full flex-wrap items-center gap-2 text-left text-xs" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown className="h-3.5 w-3.5 text-slate-500" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-500" />}
        <span className="tabular-mono w-36 shrink-0 text-slate-500">{new Date(log.createdAtMs).toLocaleString("fr-FR")}</span>
        <span className="font-medium text-slate-200">{log.actorName}</span>
        <Badge variant={action.variant}>{action.label}</Badge>
        <span className="text-slate-400">
          {COLLECTION_LABEL[log.targetCollection] ?? log.targetCollection} {log.recordLabel && <strong className="text-slate-200">{log.recordLabel}</strong>}
        </span>
        {log.action === "update" && <span className="text-slate-500">— {fields.join(", ")}</span>}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 pl-6">
          {log.action === "update"
            ? fields.map((f) => {
                const change = log.changes[f] as { avant?: unknown; après?: unknown };
                return (
                  <div key={f} className="grid gap-1 rounded-md bg-black/20 p-2 text-xs md:grid-cols-[8rem_1fr_1fr]">
                    <span className="font-semibold text-slate-300">{f}</span>
                    <span className="text-danger-glow/90">
                      − <Value value={change?.avant} />
                    </span>
                    <span className="text-mint-glow">
                      + <Value value={change?.après} />
                    </span>
                  </div>
                );
              })
            : (
              <div className="rounded-md bg-black/20 p-2 text-xs text-slate-300">
                <Value value={log.changes?.enregistrement} />
              </div>
            )}
        </div>
      )}
    </div>
  );
}

/** Journal des actions d'administration : qui a modifié quoi, quand, avant/après. */
export function LogsPanel() {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [collection, setCollection] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async (p = page) => {
    try {
      const res = await adminListLogs(p, collection ? pb.filter("targetCollection = {:c}", { c: collection }) : "");
      setLogs(res.items);
      setTotalPages(Math.max(1, res.totalPages));
      setError(null);
    } catch (err) {
      setError(`Journal indisponible : ${(err as Error).message} (schéma à jour ?)`);
    }
  };

  useEffect(() => {
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, collection]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base text-white">Journal d'administration</h2>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={collection === f.value ? "primary" : "ghost"}
              onClick={() => {
                setCollection(f.value);
                setPage(1);
              }}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => void load()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualiser
        </Button>
      </div>
      {error && <p className="text-xs text-danger-glow">{error}</p>}
      <Card className="p-3">
        {logs.length === 0 ? <p className="text-sm text-slate-500">Aucune action enregistrée.</p> : logs.map((l) => <LogRow key={l.id} log={l} />)}
      </Card>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Précédent
          </Button>
          Page {page} / {totalPages}
          <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
