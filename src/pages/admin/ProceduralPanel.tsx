import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { BookOpen, Dices, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudTag } from "@/components/ui/hud";
import { adminProcedural, adminProceduralAchievements, adminProceduralGenerate, adminProceduralSettings, type ProceduralOverview, type ProceduralResult } from "@/services/adminService";
import { OBJECTIVE_LABELS, type ChronicleMonth } from "@/game/chronicles";
import { describePassReward } from "@/game/seasonPass";
import { ACTIVITY_KEYS, type ProceduralSettings } from "@/game/procedural";
import { STORY_SPEAKERS } from "@/game/story";
import { seasonLabel } from "@/game/seasons";
import { timeAgo } from "@/lib/utils";

/* v5.4 : générateur procédural. Ce que le serveur sait du mois en cours,
   l'aperçu du prochain chapitre, les réglages et le journal des écritures. */

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="hud-title text-sm text-white">{title}</h3>
        <div className="ml-auto flex flex-wrap gap-2">{aside}</div>
      </div>
      {children}
    </Card>
  );
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-200">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  );
}

function ChapterPreview({ m }: { m: ChronicleMonth }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: m.theme.accent }} />
        <p className="text-base text-white">
          {seasonLabel(m.id)} · « {m.title} »
        </p>
        <HudTag tone="accent">{m.theme.label}</HudTag>
        {m.auto && <HudTag tone="gold">Difficulté ×{m.auto.difficulty}</HudTag>}
      </div>
      {m.synopsis && <p className="text-sm italic text-slate-300">{m.synopsis}</p>}
      <p className="text-xs text-slate-400">
        Boss : <span className="text-slate-200">{m.boss.name}</span> · titre des participants : « {m.boss.title} »
      </p>
      <div className="grid gap-2 md:grid-cols-2">
        {m.episodes.map((e, i) => (
          <div key={i} className="flex flex-col gap-1.5 border border-white/10 p-3">
            <p className="text-sm text-white">
              <span className="mr-1 font-mono text-[10px] text-slate-500">Ép. {i + 1}</span> {e.title}
            </p>
            <p className="text-xs text-slate-400">
              {OBJECTIVE_LABELS[e.objective.type]} : <span className="font-mono text-slate-200">{e.objective.count}</span>
              {e.reward && e.reward.length > 0 && <> · récompense : {e.reward.map((r) => describePassReward(r)).join(", ")}</>}
            </p>
            {e.lines.map((l, k) => (
              <p key={k} className="text-xs text-slate-300">
                <span className="font-medium" style={{ color: (l.as ?? STORY_SPEAKERS[l.speaker]).color }}>
                  {(l.as ?? STORY_SPEAKERS[l.speaker]).name} :
                </span>{" "}
                {l.text}
              </p>
            ))}
          </div>
        ))}
      </div>
      {m.completion && (
        <div className="flex flex-wrap items-center gap-3 border border-white/10 p-3 text-xs text-slate-300">
          <span className="h-8 w-24 shrink-0" style={{ background: m.completion.banner }} />
          <span>
            Chapitre terminé : titre « <span className="text-white">{m.completion.title}</span> », bannière de profil, {m.completion.rewards.map((r) => describePassReward(r)).join(", ")}.
          </span>
        </div>
      )}
      {m.codex && m.codex.length > 0 && (
        <div className="flex flex-col gap-1 text-xs text-slate-400">
          {m.codex.map((c) => (
            <p key={c.id}>
              <BookOpen className="mr-1 inline h-3 w-3" /> Codex · <span className="text-slate-200">{c.name}</span> : {c.text}
            </p>
          ))}
        </div>
      )}
      {m.pass && (
        <p className="text-xs text-slate-400">
          Passe du mois : {m.pass.tiers.length} paliers de {m.pass.pointsPerTier} points.
        </p>
      )}
      {m.auto && (
        <ul className="list-disc space-y-0.5 pl-4 text-xs text-slate-400">
          {m.auto.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProceduralPanel() {
  const [data, setData] = useState<ProceduralOverview | null>(null);
  const [busy, setBusy] = useState(false);
  const [variant, setVariant] = useState(0);

  const load = async () => {
    setBusy(true);
    try {
      setData(await adminProcedural());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chargement impossible.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const saveSettings = async (patch: Partial<ProceduralSettings>) => {
    try {
      const out = await adminProceduralSettings(patch);
      setData((d) => (d ? { ...d, settings: out.settings } : d));
      toast.success("Réglages enregistrés.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Enregistrement impossible.");
    }
  };

  const report = (out: ProceduralResult) => {
    const parts = [...out.chapters.map((c) => `Chapitre ${c.id} : « ${c.title} »`), ...out.achievements.map((a) => a.name)];
    toast.success(parts.length ? parts.join(" · ") : "Rien de nouveau à écrire.");
    void load();
  };

  const generate = async (monthId: string, started: boolean) => {
    if (started && !confirm(`Le chapitre ${monthId} a déjà commencé : la progression des joueurs sur ses épisodes sera perdue. Réécrire quand même ?`)) return;
    setBusy(true);
    try {
      report(await adminProceduralGenerate(monthId, variant, started));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Génération impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <Card className="p-6 text-sm text-slate-400">{busy ? "Lecture des joueurs…" : "Aucune donnée."}</Card>;
  const { settings, digest, preview } = data;
  const autoMonths = data.months.filter((m) => m.auto);

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <Sparkles className="h-5 w-5 text-cyan-glow" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white">
            {settings.enabled ? "Génération automatique active" : "Génération automatique en pause"} · {data.pending.length ? `à écrire : ${data.pending.join(", ")}` : "aucun mois en attente"}
          </p>
          <p className="text-xs text-slate-500">
            Chaque jour à 4 h 29, le serveur écrit le chapitre du mois s'il manque, puis celui du mois suivant à partir du {settings.leadDay}. Les mois écrits à la main ne sont jamais remplacés. Tout reste modifiable dans l'onglet Chroniques.
          </p>
        </div>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => void load()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Actualiser
        </Button>
      </Card>

      <Section title="Réglages">
        <div className="grid gap-3 sm:grid-cols-2">
          <Toggle label="Génération automatique" hint="Désactivée : rien n'est écrit seul, les boutons ci-dessous restent utilisables." checked={settings.enabled} onChange={(v) => void saveSettings({ enabled: v })} />
          <Toggle label="Chapitres des Chroniques" hint="Scénario, objectifs, boss, récompenses, titre, bannière, Codex." checked={settings.chapters} onChange={(v) => void saveSettings({ chapters: v })} />
          <Toggle label="Passe propre à chaque chapitre" hint="Points par palier ajustés selon la réussite du mois, paliers variés." checked={settings.pass} onChange={(v) => void saveSettings({ pass: v })} />
          <Toggle label="Paliers de succès" hint="Ajoute le palier suivant quand un joueur a atteint le dernier." checked={settings.achievements} onChange={(v) => void saveSettings({ achievements: v })} />
          <label className="flex items-center gap-2 text-sm text-slate-200">
            Écrire le mois suivant à partir du
            <input type="number" min={1} max={28} defaultValue={settings.leadDay} className="w-16 border border-white/15 bg-space-950 px-2 py-1 font-mono" onBlur={(e) => Number(e.target.value) !== settings.leadDay && void saveSettings({ leadDay: Number(e.target.value) })} />
          </label>
        </div>
      </Section>

      <Section title={`Ce que le serveur voit · ${seasonLabel(digest.monthId)} (${digest.observedDays} j)`}>
        <p className="text-sm text-slate-300">
          {digest.activePlayers} joueurs actifs · chapitre terminé par {pct(digest.chapterShare)} · passe fini par {pct(digest.passFinishedShare)} (palier médian {digest.passMedianTier} / {digest.passTiers})
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="text-slate-500">
              <tr>
                <th className="py-1 font-normal">Action</th>
                <th className="py-1 font-normal">Médiane / semaine</th>
                <th className="py-1 font-normal">Total du mois</th>
                <th className="py-1 font-normal">Le plus actif</th>
              </tr>
            </thead>
            <tbody className="font-mono text-slate-200">
              {ACTIVITY_KEYS.map((k) => (
                <tr key={k} className="border-t border-white/5">
                  <td className="py-1 font-sans">{OBJECTIVE_LABELS[k]}</td>
                  <td>{digest.weeklyMedian[k] ?? 0}</td>
                  <td>{digest.totals[k] ?? 0}</td>
                  <td className="font-sans">{digest.heroes[k] ? `${digest.heroes[k]!.pseudo} (${digest.heroes[k]!.count})` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {digest.episodes.length > 0 && (
          <p className="text-xs text-slate-400">
            Épisodes du mois : {digest.episodes.map((e, i) => `${i + 1}. ${OBJECTIVE_LABELS[e.type].toLowerCase()} × ${e.count} → ${e.open ? pct(e.completion) : "pas encore ouvert"}`).join(" · ")}
          </p>
        )}
        <ul className="list-disc pl-4 text-xs text-slate-400">
          {data.difficulty.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </Section>

      <Section
        title={preview ? `Aperçu du prochain chapitre (${preview.id})` : "Prochain chapitre"}
        aside={
          preview && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setVariant((v) => v + 1)} title="Le tirage change à l'écriture">
                <Dices className="mr-1 h-3.5 w-3.5" /> Variante {variant}
              </Button>
              <Button size="sm" disabled={busy} onClick={() => void generate(preview.id, false)}>
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Écrire ce chapitre
              </Button>
            </>
          )
        }
      >
        {preview ? <ChapterPreview m={preview} /> : <p className="text-sm text-slate-400">Le mois en cours et le suivant ont déjà leur chapitre.</p>}
      </Section>

      {autoMonths.length > 0 && (
        <Section title="Chapitres générés">
          {autoMonths.map((m) => {
            const started = m.id <= digest.monthId;
            return (
              <div key={m.id} className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-2 text-sm">
                <span className="font-mono text-slate-400">{m.id}</span>
                <span className="text-white">« {m.title} »</span>
                <span className="text-xs text-slate-500">
                  {m.boss} · ×{m.auto!.difficulty} · {timeAgo(m.auto!.generatedAtMs)}
                </span>
                <Button size="sm" variant="ghost" className="ml-auto" disabled={busy} onClick={() => void generate(m.id, started)}>
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Réécrire (variante {variant})
                </Button>
              </div>
            );
          })}
        </Section>
      )}

      <Section
        title="Paliers de succès à ajouter"
        aside={
          <Button size="sm" variant="secondary" disabled={busy || data.achievements.length === 0} onClick={() => void adminProceduralAchievements().then(report, (err) => toast.error(err instanceof Error ? err.message : "Impossible."))}>
            <Trophy className="mr-1 h-3.5 w-3.5" /> Ajouter maintenant
          </Button>
        }
      >
        {data.achievements.length === 0 ? (
          <p className="text-sm text-slate-400">Personne n'a encore atteint le dernier palier d'une série.</p>
        ) : (
          data.achievements.map((a) => (
            <p key={a.def.id} className="text-sm text-slate-300">
              {a.def.emoji} <span className="text-white">{a.def.name}</span> ({a.def.tier}) — {a.reason}
            </p>
          ))
        )}
      </Section>

      {settings.log.length > 0 && (
        <Section title="Journal du générateur">
          {[...settings.log].reverse().map((l, i) => (
            <p key={i} className="text-xs text-slate-400">
              <span className="font-mono text-slate-500">{new Date(l.atMs).toLocaleString("fr-FR")}</span> · {l.text}
            </p>
          ))}
        </Section>
      )}
    </div>
  );
}
