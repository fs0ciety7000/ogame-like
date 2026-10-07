import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Copy, ImageUp, Images, Lock, LogIn, Server } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { EmptyState, HudCallout, HudChip, StatTile, type HudTone } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pocketbase";
import { useAdminStatus } from "@/services/adminService";
import { logout } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { cn, timeAgo } from "@/lib/utils";
import slotsRaw from "../../scripts/illustrations.json?raw";

/* 6.14.23 : atelier d'illustrations de la pré-prod (/img, docs/illustrations.md).
   Liste des images à produire (scripts/illustrations.json, à jour à chaque déploiement de la branche) avec leur prompt
   Midjourney ; envoi des rendus par lot dans la collection `illustration_uploads` (admins du jeu). Claude reconnaît
   chaque image (nom de fichier Midjourney, sinon à l'œil), la détoure, la convertit et la range dans le jeu. */

interface Slot {
  id: string;
  group: string;
  name: string;
  target: string;
  width: number;
  height: number;
  cutout: boolean;
  prompt: string;
  done: string | null;
}

interface Upload {
  id: string;
  fileName: string;
  uploadedAtMs: number;
  slotId: string;
  status: string;
  note: string;
}

const SLOTS: Slot[] = (JSON.parse(slotsRaw) as { slots: Slot[] }).slots;
const LABEL = (import.meta.env.VITE_SERVER_LABEL ?? "").trim();
const COLLECTION = "illustration_uploads";
/** Serveur de test où se déposent les rendus (docs/illustrations.md). */
const PREPROD_URL = "https://test.fs0ciety.org";

type SlotState = "todo" | "received" | "done";
const STATE: Record<SlotState, { label: string; tone: HudTone }> = {
  todo: { label: "À faire", tone: "neutral" },
  received: { label: "Reçue", tone: "gold" },
  done: { label: "Intégrée", tone: "mint" },
};
const UPLOAD_STATE: Record<string, { label: string; tone: HudTone }> = {
  envoyée: { label: "À trier", tone: "gold" },
  attribuée: { label: "Reconnue", tone: "accent" },
  intégrée: { label: "Intégrée", tone: "mint" },
  refusée: { label: "Écartée", tone: "danger" },
};

const fmt = (s: Slot) => (s.height ? `${s.width} × ${s.height}` : `${s.width} px de large`);

export function IllustrationsPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const admin = useAdminStatus();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number; failed: string[] } | null>(null);
  const [group, setGroup] = useState("Toutes");
  const [view, setView] = useState<SlotState | "all">("todo");
  const [copied, setCopied] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const list = await pb.collection(COLLECTION).getFullList({ sort: "-uploadedAtMs", batch: 500 }).catch(() => []);
    setUploads(list.map((r) => ({ id: r.id, fileName: String(r.fileName ?? ""), uploadedAtMs: Number(r.uploadedAtMs) || 0, slotId: String(r.slotId ?? ""), status: String(r.status ?? "envoyée"), note: String(r.note ?? "") })));
  }, []);

  useEffect(() => {
    if (admin && LABEL) void load();
  }, [admin, load]);

  const stateOf = useCallback(
    (s: Slot): SlotState => (s.done || uploads.some((u) => u.slotId === s.id && u.status === "intégrée") ? "done" : uploads.some((u) => u.slotId === s.id && u.status !== "refusée") ? "received" : "todo"),
    [uploads],
  );
  const counts = useMemo(() => {
    const c = { todo: 0, received: 0, done: 0 };
    for (const s of SLOTS) c[stateOf(s)]++;
    return c;
  }, [stateOf]);
  const groups = useMemo(() => ["Toutes", ...new Set(SLOTS.map((s) => s.group))], []);
  const shown = SLOTS.filter((s) => (group === "Toutes" || s.group === group) && (view === "all" || stateOf(s) === view));
  const pending = uploads.filter((u) => u.status === "envoyée").length;

  async function sendBatch(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files];
    const failed: string[] = [];
    setProgress({ done: 0, total: list.length, failed });
    for (const [i, file] of list.entries()) {
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("fileName", file.name);
        form.append("uploadedAtMs", String(Date.now()));
        form.append("uploaderUid", uid ?? "");
        form.append("status", "envoyée");
        await pb.collection(COLLECTION).create(form);
      } catch {
        failed.push(file.name);
      }
      setProgress({ done: i + 1, total: list.length, failed: [...failed] });
    }
    if (input.current) input.current.value = "";
    await load();
  }

  async function copy(s: Slot) {
    try {
      await navigator.clipboard.writeText(s.prompt);
      setCopied(s.id);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="min-h-screen bg-space-950 text-slate-200">
      <div className="relative mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-center gap-3">
          <Images className="h-7 w-7 shrink-0 text-cyan-glow" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="hud-eyebrow text-[10px] text-cyan-glow">Cosmic Empires · {LABEL || "Serveur de test"}</p>
            <h1 className="hud-title text-2xl text-slate-100 sm:text-3xl">Atelier d'illustrations</h1>
          </div>
          <Link to="/game" className="border border-cyan-glow/40 px-2.5 py-1 text-xs text-cyan-glow hover:border-cyan-glow">
            Retour au jeu
          </Link>
        </header>

        {admin === null ? (
          <p className="text-sm text-slate-400">Vérification de ton accès…</p>
        ) : !admin ? (
          <HudPanel icon={<Lock className="h-4 w-4" />} title="Réservé aux administrateurs">
            <EmptyState
              icon={<Lock />}
              title="Accès refusé"
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    logout();
                    window.location.assign("/");
                  }}
                >
                  <LogIn className="mr-1.5 h-3.5 w-3.5" />
                  Se reconnecter
                </Button>
              }
            >
              Cette page demande un compte administrateur du jeu. Si ton compte l'est, ta session est sans doute ancienne : reconnecte-toi.
            </EmptyState>
          </HudPanel>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <StatTile size="sm" tone="neutral" label="À faire" value={<span className="font-mono tabular-nums">{counts.todo}</span>} />
              <StatTile size="sm" tone="gold" label="Reçues" value={<span className="font-mono tabular-nums">{counts.received}</span>} sub={pending ? `${pending} à trier` : undefined} />
              <StatTile size="sm" tone="mint" label="Intégrées" value={<span className="font-mono tabular-nums">{counts.done}</span>} />
            </div>

            {/* 6.14.27 : en production, la liste suit mais les envois restent sur la pré-prod (seul serveur où Claude écrit). */}
            {!LABEL ? (
              <HudPanel icon={<Server className="h-4 w-4" />} title="Envoyer un lot" tone="accent">
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-300">
                    Les rendus se déposent sur le serveur de test : Claude les y récupère, les détoure, les convertit et les intègre au jeu. Ils arrivent ici à la mise en production suivante.
                  </p>
                  <Button asChild size="lg">
                    <a href={`${PREPROD_URL}/img`} target="_blank" rel="noreferrer">
                      <ImageUp className="mr-2 h-4 w-4" />
                      Envoyer sur la pré-prod
                    </a>
                  </Button>
                </div>
              </HudPanel>
            ) : (
            <HudPanel icon={<ImageUp className="h-4 w-4" />} title="Envoyer un lot" tone="accent">
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-300">
                    Sélectionne toutes tes images Midjourney d'un coup, dans n'importe quel ordre. Garde si possible le nom de fichier de Midjourney : il sert à reconnaître chaque image. Ensuite, dis « images envoyées » à Claude.
                  </p>
                  <input
                    ref={input}
                    id="illustrations-batch"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => void sendBatch(e.target.files)}
                  />
                  <Button asChild size="lg" disabled={!!progress && progress.done < progress.total}>
                    <label htmlFor="illustrations-batch" className="cursor-pointer">
                      <ImageUp className="mr-2 h-4 w-4" />
                      {progress && progress.done < progress.total ? `Envoi ${progress.done} / ${progress.total}…` : "Choisir les images"}
                    </label>
                  </Button>
                  {progress && progress.done === progress.total && (
                    <HudCallout tone={progress.failed.length ? "ember" : "mint"} className="px-3 py-2 text-sm">
                      <span className="font-mono tabular-nums">{progress.total - progress.failed.length}</span> image(s) reçue(s).
                      {progress.failed.length ? ` Échec : ${progress.failed.join(", ")} (20 Mo au plus, PNG, JPEG ou WebP).` : " Dis « images envoyées » à Claude."}
                    </HudCallout>
                  )}
                  {uploads.length > 0 && (
                    <ul className="flex flex-col gap-1.5">
                      {uploads.slice(0, 12).map((u) => {
                        const st = UPLOAD_STATE[u.status] ?? UPLOAD_STATE.envoyée;
                        const slot = SLOTS.find((s) => s.id === u.slotId);
                        return (
                          <li key={u.id} className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
                            <HudChip size="sm" tone={st.tone}>
                              {st.label}
                            </HudChip>
                            <span className="min-w-0 flex-1 truncate font-mono text-slate-300" title={u.fileName}>
                              {slot ? slot.name : u.fileName}
                            </span>
                            <span className="text-slate-500">{timeAgo(u.uploadedAtMs)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </HudPanel>
            )}

            {/* 6.14.27 : filtre par état, avec compteurs (l'ancien bouton « À faire seulement » ne montrait pas son effet). */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par état">
                {(
                  [
                    ["todo", "À faire", counts.todo],
                    ["received", "Reçues", counts.received],
                    ["done", "Intégrées", counts.done],
                    ["all", "Toutes", SLOTS.length],
                  ] as const
                ).map(([v, label, n]) => (
                  <HudChip key={v} asChild size="sm" tone={view === v ? "accent" : "neutral"}>
                    <button type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                      {label} <span className="ml-1 font-mono tabular-nums">{n}</span>
                    </button>
                  </HudChip>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par groupe">
                {groups.map((g) => (
                  <HudChip key={g} asChild size="sm" tone={g === group ? "accent" : "neutral"}>
                    <button type="button" aria-pressed={g === group} onClick={() => setGroup(g)}>
                      {g}
                    </button>
                  </HudChip>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                <span className="font-mono tabular-nums">{shown.length}</span> image{shown.length > 1 ? "s" : ""} affichée{shown.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {shown.length === 0 && (
                <EmptyState icon={<CheckCircle2 />} title="Aucune image ici" size="sm">
                  {view === "todo" ? "Toutes les images de ce groupe sont reçues ou intégrées." : "Aucune image de ce groupe dans cet état."}
                </EmptyState>
              )}
              {shown.map((s) => {
                const st = STATE[stateOf(s)];
                return (
                  <HudPanel
                    key={s.id}
                    title={s.name}
                    tone={st.tone === "neutral" ? "muted" : st.tone}
                    aside={
                      <HudChip size="sm" tone={st.tone}>
                        {st.label}
                      </HudChip>
                    }
                  >
                    <div className="flex min-w-0 flex-col gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        <HudChip size="sm" tone="neutral">
                          {s.group}
                        </HudChip>
                        <HudChip size="sm" tone="neutral">
                          <span className="font-mono tabular-nums">{fmt(s)}</span>
                        </HudChip>
                        <HudChip size="sm" tone={s.cutout ? "violet" : "neutral"}>
                          {s.cutout ? "détourée" : "opaque"}
                        </HudChip>
                      </div>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words border border-cyan-glow/15 bg-space-900 p-2 font-mono text-xs text-slate-300">{s.prompt}</pre>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => void copy(s)}>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          {copied === s.id ? "Copié" : "Copier le prompt"}
                        </Button>
                        <span className={cn("min-w-0 break-all font-mono text-[11px] text-slate-500")}>{s.target}</span>
                      </div>
                    </div>
                  </HudPanel>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
