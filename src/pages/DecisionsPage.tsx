import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ClipboardCheck, Lock, LogIn, PenLine } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { EmptyState, HudChip, StatTile, type HudTone } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { pb } from "@/lib/pocketbase";
import { useAdminStatus } from "@/services/adminService";
import { logout } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";
import { parseAdvice, parseQuestions, plainText, questionNumber } from "@/lib/decisions";
import questionsRaw from "../../docs/QUESTIONS.md?raw";
import adviceRaw from "../../docs/decisions-a-valider.md?raw";

/* 6.14.32 : décisions prises seules par Claude (règle n° 3), à valider par l'administrateur (/decisions, pré-prod et production).
   Les questions viennent de docs/QUESTIONS.md au build (à jour à chaque déploiement) ; les réponses vont dans la collection
   `decision_answers`, que Claude relit (scripts/decisions.mjs) pour mettre à jour les instructions et ouvrir les lots. */

const QUESTIONS = parseQuestions(questionsRaw)
  .filter((q) => q.open)
  .sort((a, b) => questionNumber(a.id) - questionNumber(b.id));
const ADVICE = parseAdvice(adviceRaw);
const GROUP_ORDER = ["Bloquante", "Joueurs et équilibre", "Récit", "Outillage et méthode", "Autres"];
const COLLECTION = "decision_answers";

interface Answer {
  id: string;
  qid: string;
  choice: "valide" | "changer" | "";
  note: string;
  answeredAtMs: number;
}

type View = "todo" | "answered" | "all";
const STATE: Record<"todo" | "valide" | "changer", { label: string; tone: HudTone }> = {
  todo: { label: "À voir", tone: "neutral" },
  valide: { label: "Validée", tone: "mint" },
  changer: { label: "À changer", tone: "ember" },
};

export function DecisionsPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const admin = useAdminStatus();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [view, setView] = useState<View>("todo");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const list = await pb.collection(COLLECTION).getFullList({ sort: "answeredAtMs", batch: 500 }).catch(() => []);
    const map: Record<string, Answer> = {};
    // La dernière réponse d'une question l'emporte.
    for (const r of list) map[String(r.qid)] = { id: r.id, qid: String(r.qid), choice: (r.choice as Answer["choice"]) || "", note: String(r.note ?? ""), answeredAtMs: Number(r.answeredAtMs) || 0 };
    setAnswers(map);
  }, []);

  useEffect(() => {
    if (admin) void load();
  }, [admin, load]);

  async function answer(qid: string, patch: Partial<Pick<Answer, "choice" | "note">>) {
    setBusy(qid);
    setError(null);
    try {
      const cur = answers[qid];
      const data = { qid, choice: patch.choice ?? cur?.choice ?? "", note: (patch.note ?? cur?.note ?? "").slice(0, 2000), answeredAtMs: Date.now(), answeredBy: uid ?? "" };
      if (cur) await pb.collection(COLLECTION).update(cur.id, data);
      else await pb.collection(COLLECTION).create(data);
      await load();
    } catch {
      setError(`${qid} : réponse non enregistrée. Recharge la page et recommence.`);
    } finally {
      setBusy(null);
    }
  }

  async function validateRemaining() {
    for (const q of QUESTIONS.filter((x) => !answers[x.id]?.choice)) await answer(q.id, { choice: "valide" });
  }

  const counts = useMemo(() => {
    const c = { todo: 0, valide: 0, changer: 0 };
    for (const q of QUESTIONS) c[answers[q.id]?.choice || "todo"]++;
    return c;
  }, [answers]);
  const shown = QUESTIONS.filter((q) => view === "all" || (view === "todo" ? !answers[q.id]?.choice : !!answers[q.id]?.choice));
  const groups = GROUP_ORDER.map((g) => ({ g, list: shown.filter((q) => (ADVICE[q.id]?.group ?? "Autres") === g) })).filter((x) => x.list.length);

  return (
    <div className="min-h-screen bg-space-950 text-slate-200">
      <div className="relative mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-center gap-3">
          <ClipboardCheck className="h-7 w-7 shrink-0 text-cyan-glow" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="hud-eyebrow text-[10px] text-cyan-glow">Cosmic Empires · administration</p>
            <h1 className="hud-title text-2xl text-slate-100 sm:text-3xl">Décisions à valider</h1>
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
            <p className="text-sm text-slate-300">
              Les choix que Claude a faits seul pour avancer. Valide-les, ou marque « À changer » avec ce que tu veux à la place. Claude relit tes réponses, met à jour ses instructions et ouvre les lots ; une question traitée quitte cette page au déploiement suivant.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <StatTile size="sm" tone="neutral" label="À voir" value={<span className="font-mono tabular-nums">{counts.todo}</span>} />
              <StatTile size="sm" tone="mint" label="Validées" value={<span className="font-mono tabular-nums">{counts.valide}</span>} />
              <StatTile size="sm" tone="ember" label="À changer" value={<span className="font-mono tabular-nums">{counts.changer}</span>} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer">
              {(
                [
                  ["todo", "À voir", counts.todo],
                  ["answered", "Répondues", counts.valide + counts.changer],
                  ["all", "Toutes", QUESTIONS.length],
                ] as const
              ).map(([v, label, n]) => (
                <HudChip key={v} asChild size="sm" tone={view === v ? "accent" : "neutral"}>
                  <button type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                    {label} <span className="ml-1 font-mono tabular-nums">{n}</span>
                  </button>
                </HudChip>
              ))}
              {counts.todo > 0 && (
                <Button size="sm" variant="outline" className="ml-auto" disabled={!!busy} onClick={() => void validateRemaining()}>
                  Valider celles à voir
                </Button>
              )}
            </div>
            {error && <p className="text-sm text-danger-glow">{error}</p>}

            {groups.length === 0 && (
              <EmptyState icon={<CheckCircle2 />} title="Rien ici" size="sm">
                {view === "todo" ? "Tu as répondu à toutes les questions ouvertes." : "Aucune question dans ce filtre."}
              </EmptyState>
            )}
            {groups.map(({ g, list }) => (
              <section key={g} className="flex flex-col gap-3">
                <h2 className="hud-eyebrow text-[11px] text-slate-400">{g}</h2>
                {list.map((q) => {
                  const a = answers[q.id];
                  const st = STATE[a?.choice || "todo"];
                  const adv = ADVICE[q.id];
                  const note = drafts[q.id] ?? a?.note ?? "";
                  return (
                    <HudPanel
                      key={q.id}
                      title={
                        <span>
                          <span className="font-mono text-gold-glow">{q.id}</span> · {plainText(q.question)}
                        </span>
                      }
                      tone={st.tone === "neutral" ? "muted" : st.tone}
                      aside={
                        <HudChip size="sm" tone={st.tone}>
                          {st.label}
                        </HudChip>
                      }
                    >
                      <div className="flex min-w-0 flex-col gap-2 text-sm">
                        <p className="text-slate-200">
                          <span className="hud-eyebrow mr-1.5 text-[10px] text-slate-500">Choix appliqué</span>
                          {plainText(q.choice)}
                        </p>
                        {adv?.effect && <p className="text-slate-400">{plainText(adv.effect)}</p>}
                        {adv?.reco && (
                          <p className="text-slate-300">
                            <span className="hud-eyebrow mr-1.5 text-[10px] text-cyan-glow">Conseil</span>
                            {plainText(adv.reco)}
                          </p>
                        )}
                        <p className="text-xs text-slate-500">
                          Revenir en arrière : {plainText(q.revert)} · lot {plainText(q.lot)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant={a?.choice === "valide" ? "primary" : "secondary"} aria-pressed={a?.choice === "valide"} disabled={busy === q.id} onClick={() => void answer(q.id, { choice: "valide" })}>
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                            Je valide
                          </Button>
                          <Button size="sm" variant={a?.choice === "changer" ? "warn" : "secondary"} aria-pressed={a?.choice === "changer"} disabled={busy === q.id} onClick={() => void answer(q.id, { choice: "changer" })}>
                            <PenLine className="mr-1.5 h-3.5 w-3.5" />
                            À changer
                          </Button>
                        </div>
                        {(a?.choice === "changer" || a?.note) && (
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor={`note-${q.id}`} className="text-xs text-slate-400">
                              Ce que tu veux à la place
                            </label>
                            <textarea
                              id={`note-${q.id}`}
                              value={note}
                              onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                              rows={3}
                              className="w-full border border-cyan-glow/20 bg-space-900 p-2 text-sm text-slate-200"
                            />
                            <Button size="sm" variant="outline" className="self-start" disabled={busy === q.id || note === (a?.note ?? "")} onClick={() => void answer(q.id, { note })}>
                              Enregistrer la note
                            </Button>
                          </div>
                        )}
                      </div>
                    </HudPanel>
                  );
                })}
              </section>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
