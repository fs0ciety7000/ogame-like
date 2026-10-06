import { useState } from "react";
import { toast } from "sonner";
import { Eye, Plus, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { allAnnouncements } from "@/components/game/Announcement";
import { announcementStatus, type AnnouncementSettings, type CustomAnnouncement } from "@/game/announcements";
import { previewAnnouncement, saveAnnouncementSettings, useAnnouncementSettings } from "@/services/announcementService";
import { ImageField, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";
import { cn } from "@/lib/utils";
import { POLL_RULES, type PollResults } from "@/game/polls";
import { fetchPollResults } from "@/services/pollService";
import { askConfirm } from "@/components/ui/confirm-dialog";

/* =====================================================
   v4.5 : annonces plein écran. Chaque annonce s'affiche une fois par
   joueur et par appareil, la plus récente d'abord. Ici : créer une
   annonce sans toucher au code, et programmer (début, fin) ou couper
   n'importe quelle annonce.
===================================================== */

function toLocalInput(ms: number | null | undefined): string {
  if (!ms) return "";
  return new Date(ms - new Date(ms).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function fromLocalInput(value: string): number | null {
  const ms = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ms) ? ms : null;
}

const STATUS: Record<ReturnType<typeof announcementStatus>, { label: string; variant: "success" | "warning" | "default" }> = {
  live: { label: "Diffusée", variant: "success" },
  scheduled: { label: "Programmée", variant: "warning" },
  ended: { label: "Terminée", variant: "default" },
  disabled: { label: "Coupée", variant: "default" },
};

function newCustom(now: number): CustomAnnouncement {
  return {
    id: `a${now.toString(36)}`,
    eyebrow: "Annonce",
    title: "Nouvelle annonce",
    text: "",
    tone: "gold",
    features: [],
    cta: { label: "Voir", to: "/game" },
    createdAtMs: now,
  };
}

export function AnnouncementsPanel() {
  const stored = useAnnouncementSettings();
  const [cfg, setCfg] = useState<AnnouncementSettings>(() => structuredClone(stored));
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const list = allAnnouncements(cfg);

  const setSchedule = (id: string, patch: Partial<AnnouncementSettings["schedule"][string]>) =>
    setCfg((c) => ({ ...c, schedule: { ...c.schedule, [id]: { ...(c.schedule[id] ?? {}), ...patch } } }));
  const setCustom = (id: string, patch: Partial<CustomAnnouncement>) => setCfg((c) => ({ ...c, custom: c.custom.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));

  const save = async () => {
    setBusy(true);
    try {
      await saveAnnouncementSettings(cfg);
      setCfg(structuredClone(useAnnouncementSettings.getState()));
      toast.success("Annonces enregistrées.");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base text-slate-100">Annonces plein écran</h2>
        <span className="text-xs text-slate-500">Une fois par joueur et par appareil, la plus récente d'abord.</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const a = newCustom(Date.now());
              // Brouillon coupé tant qu'il n'est pas prêt.
              setCfg((c) => ({ custom: [a, ...c.custom], schedule: { ...c.schedule, [a.id]: { disabled: true } } }));
              setOpenId(a.id);
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Nouvelle annonce
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>

      {list.map((a) => {
        const custom = cfg.custom.find((c) => c.id === a.id);
        const sched = cfg.schedule[a.id] ?? {};
        const status = STATUS[announcementStatus(a.id, cfg, now)];
        const open = openId === a.id;
        return (
          <Card key={a.id} className={cn("flex flex-col gap-3 p-3", open && "border-cyan-glow/40")}>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpenId(open ? null : a.id)}>
                <p className="truncate text-sm text-slate-100">{a.title || "(sans titre)"}</p>
                <p className="truncate font-mono text-[10px] text-slate-500">
                  {a.id} · {custom ? "créée dans l'admin" : "fournie avec le jeu"} · {a.eyebrow}
                </p>
              </button>
              <Badge variant={status.variant}>{status.label}</Badge>
              <Button size="sm" variant="ghost" title="Aperçu (sans la marquer vue)" onClick={() => previewAnnouncement(a.id)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </div>

            {open && (
              <div className="flex flex-col gap-3 border-t border-white/5 pt-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <label className="flex flex-col gap-1 text-xs text-slate-400">
                    Début
                    <Input type="datetime-local" value={toLocalInput(sched.startsAtMs)} onChange={(e) => setSchedule(a.id, { startsAtMs: fromLocalInput(e.target.value) })} />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-slate-400">
                    Fin
                    <Input type="datetime-local" value={toLocalInput(sched.endsAtMs)} onChange={(e) => setSchedule(a.id, { endsAtMs: fromLocalInput(e.target.value) })} />
                  </label>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-300">
                    <input type="checkbox" className="accent-cyan-glow" checked={!sched.disabled} onChange={(e) => setSchedule(a.id, { disabled: !e.target.checked })} />
                    Diffuser
                  </label>
                </div>

                {custom && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <TextField label="Surtitre" value={custom.eyebrow} onChange={(v) => setCustom(a.id, { eyebrow: v })} />
                    <TextField label="Titre" value={custom.title} onChange={(v) => setCustom(a.id, { title: v })} />
                    <TextAreaField label="Texte" rows={3} value={custom.text} onChange={(v) => setCustom(a.id, { text: v })} />
                    <ImageField label="Illustration (bureau, large)" value={custom.art ?? ""} onChange={(v) => setCustom(a.id, { art: v || undefined })} />
                    <ImageField label="Illustration (mobile, portrait)" value={custom.artMobile ?? ""} onChange={(v) => setCustom(a.id, { artMobile: v || undefined })} />
                    <SelectField<"gold" | "danger">
                      label="Teinte"
                      value={custom.tone ?? "gold"}
                      options={[
                        { value: "gold", label: "Ambre (bonne nouvelle)" },
                        { value: "danger", label: "Rouge (menace)" },
                      ]}
                      onChange={(v) => setCustom(a.id, { tone: v })}
                    />
                    <TextField label="Bouton : libellé" value={custom.cta.label} onChange={(v) => setCustom(a.id, { cta: { ...custom.cta, label: v } })} />
                    <TextField label="Bouton : page (/game/…)" value={custom.cta.to} onChange={(v) => setCustom(a.id, { cta: { ...custom.cta, to: v } })} />
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <p className="text-xs text-slate-400">Cartes de nouveautés (4 au plus)</p>
                      {(custom.features ?? []).map((f, i) => (
                        <div key={i} className="grid grid-cols-1 gap-2 border border-white/5 p-2 sm:grid-cols-[1fr_2fr_1fr_auto]">
                          <Input placeholder="Titre" value={f.title} onChange={(e) => setCustom(a.id, { features: custom.features!.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                          <Input placeholder="Texte" value={f.text} onChange={(e) => setCustom(a.id, { features: custom.features!.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
                          <Input placeholder="/game/…" value={f.to} onChange={(e) => setCustom(a.id, { features: custom.features!.map((x, j) => (j === i ? { ...x, to: e.target.value } : x)) })} />
                          <Button size="sm" variant="ghost" title="Retirer" onClick={() => setCustom(a.id, { features: custom.features!.filter((_, j) => j !== i) })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      {(custom.features?.length ?? 0) < 4 && (
                        <Button size="sm" variant="ghost" className="self-start" onClick={() => setCustom(a.id, { features: [...(custom.features ?? []), { title: "", text: "", to: "/game" }] })}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter une carte
                        </Button>
                      )}
                    </div>
                    {/* 5.26 : sondage communautaire joint à l'annonce */}
                    <div className="flex flex-col gap-2 border border-cyan-glow/15 p-2 sm:col-span-2">
                      <label className="flex items-center gap-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          className="accent-cyan-glow"
                          checked={!!custom.poll}
                          onChange={(e) => setCustom(a.id, { poll: e.target.checked ? { question: "", options: ["", ""], closesAtMs: null, showResults: "after_vote" } : null })}
                        />
                        Sondage (2 à {POLL_RULES.maxOptions} choix, un vote par joueur)
                      </label>
                      {custom.poll && (
                        <>
                          <Input placeholder="Question" maxLength={POLL_RULES.maxQuestion} value={custom.poll.question} onChange={(e) => setCustom(a.id, { poll: { ...custom.poll!, question: e.target.value } })} />
                          {custom.poll.options.map((o, i) => (
                            <div key={i} className="flex gap-2">
                              <Input placeholder={`Choix ${i + 1}`} maxLength={POLL_RULES.maxOption} value={o} onChange={(e) => setCustom(a.id, { poll: { ...custom.poll!, options: custom.poll!.options.map((x, j) => (j === i ? e.target.value : x)) } })} />
                              <Button size="sm" variant="ghost" title="Retirer" disabled={custom.poll!.options.length <= POLL_RULES.minOptions} onClick={() => setCustom(a.id, { poll: { ...custom.poll!, options: custom.poll!.options.filter((_, j) => j !== i) } })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex flex-wrap items-center gap-2">
                            {custom.poll.options.length < POLL_RULES.maxOptions && (
                              <Button size="sm" variant="ghost" onClick={() => setCustom(a.id, { poll: { ...custom.poll!, options: [...custom.poll!.options, ""] } })}>
                                <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un choix
                              </Button>
                            )}
                            <label className="flex items-center gap-2 text-xs text-slate-400">
                              Clôture
                              <Input type="datetime-local" className="h-8 w-52" value={toLocalInput(custom.poll.closesAtMs)} onChange={(e) => setCustom(a.id, { poll: { ...custom.poll!, closesAtMs: fromLocalInput(e.target.value) } })} />
                            </label>
                            <PollAdminResults id={a.id} options={custom.poll.options} />
                            <label className="flex items-center gap-2 text-xs text-slate-400">
                              <input type="checkbox" className="accent-cyan-glow" checked={custom.poll.showResults === "always"} onChange={(e) => setCustom(a.id, { poll: { ...custom.poll!, showResults: e.target.checked ? "always" : "after_vote" } })} />
                              Résultats visibles avant de voter
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (!(await askConfirm({ title: `Supprimer l'annonce « ${custom.title} » ?`, confirmLabel: "Supprimer", tone: "danger" }))) return;
                          setCfg((c) => {
                            const schedule = { ...c.schedule };
                            delete schedule[a.id];
                            return { custom: c.custom.filter((x) => x.id !== a.id), schedule };
                          });
                        }}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer cette annonce
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
      <p className="text-[11px] text-slate-500">L'aperçu ouvre l'annonce telle qu'enregistrée : enregistre d'abord pour voir tes modifications.</p>
    </div>
  );
}

/** 5.26 : résultats d'un sondage, lus à la demande (sans voter). */
function PollAdminResults({ id, options }: { id: string; options: string[] }) {
  const [res, setRes] = useState<PollResults | null>(null);
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
      <Button size="sm" variant="ghost" onClick={() => void fetchPollResults(id).then(setRes).catch(() => toast.error("Sondage pas encore enregistré."))}>
        Résultats
      </Button>
      {res && (
        <span className="font-mono">
          {options.map((o, i) => `${o || `#${i + 1}`} ${res.counts[i] ?? 0}`).join(" · ")} · {res.total} vote{res.total > 1 ? "s" : ""}
        </span>
      )}
    </span>
  );
}
