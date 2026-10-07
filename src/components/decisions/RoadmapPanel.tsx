import { useState } from "react";
import { CheckCircle2, ListPlus, Map as MapIcon, PenLine, ScrollText, Send } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { EmptyState, HudChip, type HudTone } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { additionQid, isAdditionQid, isHandled, lotDone, plainText, roadmapQid, type Plan, type Roadmap } from "@/lib/decisions";

/* 6.14.41 : onglet « Feuille de route » de /decisions. Les lots de la feuille de route en cours se valident ou se modifient (réponse
   `R:<lot>`), une action s'ajoute (réponse `A<horodatage>`) ; Claude les relit (scripts/decisions.mjs, veille de 2 min) et les reporte
   dans la feuille de route, ce qui les marque traitées. Les plans (propositions) et les feuilles de route passées sont en lien. */

export interface RoadmapAnswer {
  id: string;
  qid: string;
  choice: string;
  note: string;
  answeredAtMs: number;
}

interface Props {
  current: Roadmap | null;
  past: Roadmap[];
  plans: Plan[];
  answers: Record<string, RoadmapAnswer>;
  busy: string | null;
  docUrl: (file: string) => string;
  answer: (qid: string, patch: { choice?: string; note?: string }) => Promise<void>;
}

function stateTone(state: string): HudTone {
  const s = state.toLowerCase();
  if (/^livr/.test(s)) return "mint";
  if (/^(écart|close|abandon)/.test(s)) return "neutral";
  if (/^en cours/.test(s)) return "accent";
  if (/^attend/.test(s)) return "gold";
  return "violet";
}

const ANSWER: Record<string, { label: string; tone: HudTone }> = {
  valide: { label: "Validé", tone: "mint" },
  changer: { label: "À modifier", tone: "ember" },
};

function planTone(status: string): { label: string; tone: HudTone } {
  const s = status.toLowerCase();
  if (/livrée|close|clos/.test(s)) return { label: "livré", tone: "mint" };
  if (/en cours|choix fait|validé/.test(s)) return { label: "en cours", tone: "accent" };
  if (/attente|attend/.test(s)) return { label: "en attente", tone: "gold" };
  return { label: "plan", tone: "neutral" };
}

export function RoadmapPanel({ current, past, plans, answers, busy, docUrl, answer }: Props) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [addition, setAddition] = useState("");
  const texts = [current, ...past].filter((r): r is Roadmap => !!r).map((r) => JSON.stringify(r));
  const additions = Object.values(answers)
    .filter((a) => isAdditionQid(a.qid))
    .sort((a, b) => b.answeredAtMs - a.answeredAtMs);

  async function addAction() {
    const note = addition.trim();
    if (!note) return;
    await answer(additionQid(Date.now()), { choice: "ajout", note });
    setAddition("");
  }

  return (
    <div className="flex flex-col gap-4">
      {current ? (
        <HudPanel
          icon={<MapIcon className="h-4 w-4" />}
          title={plainText(current.title)}
          aside={
            <a href={docUrl(current.file)} target="_blank" rel="noreferrer" className="font-mono text-xs text-cyan-glow underline-offset-2 hover:underline">
              document
            </a>
          }
        >
          <div className="flex min-w-0 flex-col gap-3 text-sm">
            <p className="text-slate-400">{plainText(current.status)}</p>
            {current.lots.map((lot) => {
              const qid = roadmapQid(lot.id);
              const a = answers[qid];
              const st = a?.choice ? ANSWER[a.choice] : undefined;
              const done = lotDone(lot.state);
              const note = drafts[qid] ?? a?.note ?? "";
              return (
                <div key={`${lot.n}-${lot.id}`} className="flex min-w-0 flex-col gap-2 border border-cyan-glow/15 bg-space-900/40 p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-gold-glow">{lot.id}</span>
                    <HudChip size="sm" tone={stateTone(lot.state)}>
                      {plainText(lot.state)}
                    </HudChip>
                    {lot.size && lot.size !== "—" && (
                      <HudChip size="sm" tone="neutral">
                        taille <span className="ml-1 font-mono">{lot.size}</span>
                      </HudChip>
                    )}
                    {st && (
                      <HudChip size="sm" tone={st.tone}>
                        {st.label}
                        {isHandled(qid, texts) ? " · pris en compte" : ""}
                      </HudChip>
                    )}
                  </div>
                  <p className="text-slate-200">{plainText(lot.content)}</p>
                  {!done && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={a?.choice === "valide" ? "primary" : "secondary"} aria-pressed={a?.choice === "valide"} disabled={busy === qid} onClick={() => void answer(qid, { choice: "valide" })}>
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Je valide
                      </Button>
                      <Button size="sm" variant={a?.choice === "changer" ? "warn" : "secondary"} aria-pressed={a?.choice === "changer"} disabled={busy === qid} onClick={() => void answer(qid, { choice: "changer" })}>
                        <PenLine className="mr-1.5 h-3.5 w-3.5" />
                        À modifier
                      </Button>
                    </div>
                  )}
                  {(a?.choice === "changer" || a?.note) && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={`note-${qid}`} className="text-xs text-slate-400">
                        Ce que tu veux changer
                      </label>
                      <textarea
                        id={`note-${qid}`}
                        value={note}
                        onChange={(e) => setDrafts((d) => ({ ...d, [qid]: e.target.value }))}
                        rows={3}
                        className="w-full border border-cyan-glow/20 bg-space-900 p-2 text-sm text-slate-200"
                      />
                      <Button size="sm" variant="outline" className="self-start" disabled={busy === qid || note === (a?.note ?? "")} onClick={() => void answer(qid, { note })}>
                        Enregistrer la note
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </HudPanel>
      ) : (
        <EmptyState icon={<MapIcon />} title="Pas de feuille de route en cours" size="sm">
          La prochaine s'ouvre à la fin de la revue en cours.
        </EmptyState>
      )}

      <HudPanel icon={<ListPlus className="h-4 w-4" />} title="Ajouter une action">
        <div className="flex min-w-0 flex-col gap-2 text-sm">
          <p className="text-slate-400">Une idée, un système, un correctif : Claude la chiffre et l'ajoute à la feuille de route comme un lot.</p>
          <label htmlFor="roadmap-add" className="sr-only">
            Action à ajouter
          </label>
          <textarea
            id="roadmap-add"
            value={addition}
            onChange={(e) => setAddition(e.target.value.slice(0, 2000))}
            rows={3}
            placeholder="Ex. : un marché noir le week-end, des quêtes d'alliance…"
            className="w-full border border-cyan-glow/20 bg-space-900 p-2 text-sm text-slate-200"
          />
          <Button size="sm" className="self-start" disabled={!addition.trim() || !!busy} onClick={() => void addAction()}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Envoyer
          </Button>
          {additions.length > 0 && (
            <ul className="mt-1 flex flex-col gap-1.5">
              {additions.map((a) => (
                <li key={a.qid} className="flex min-w-0 flex-wrap items-start gap-2 border-l-2 border-cyan-glow/30 pl-2">
                  <HudChip size="sm" tone={isHandled(a.qid, texts) ? "mint" : "gold"}>
                    {isHandled(a.qid, texts) ? "Ajoutée" : "Envoyée"}
                  </HudChip>
                  <span className="min-w-0 flex-1 break-words text-slate-300">{a.note}</span>
                  <span className="font-mono text-[10px] text-slate-500">{a.qid}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </HudPanel>

      <HudPanel icon={<ScrollText className="h-4 w-4" />} title="Plans (propositions)">
        <ul className="flex min-w-0 flex-col gap-2 text-sm">
          {plans.map((p) => {
            const t = planTone(p.status);
            return (
              <li key={p.file} className="flex min-w-0 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <HudChip size="sm" tone={t.tone}>
                    {t.label}
                  </HudChip>
                  <a href={docUrl(p.file)} target="_blank" rel="noreferrer" className="text-cyan-glow underline-offset-2 hover:underline">
                    {plainText(p.title) || p.file}
                  </a>
                </div>
                <p className="text-xs text-slate-500">{plainText(p.status)}</p>
              </li>
            );
          })}
        </ul>
      </HudPanel>

      {past.length > 0 && (
        <details className="border border-cyan-glow/15 p-3 text-sm">
          <summary className="cursor-pointer text-slate-300">
            Feuilles de route passées <span className="font-mono tabular-nums text-slate-500">{past.length}</span>
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {past.map((r) => (
              <li key={r.file} className="flex flex-wrap items-center gap-2">
                <a href={docUrl(r.file)} target="_blank" rel="noreferrer" className="text-cyan-glow underline-offset-2 hover:underline">
                  {plainText(r.title)}
                </a>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {r.lots.filter((l) => /^livr/i.test(l.state)).length}/{r.lots.length} lots livrés
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
