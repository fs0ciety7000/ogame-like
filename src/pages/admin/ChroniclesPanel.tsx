import { useState } from "react";
import { toast } from "sonner";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currentGameContent } from "@/game/content";
import { chronicleMonthId, normalizeChronicleBonus, normalizeCodexRewards, OBJECTIVE_LABELS, type ChronicleBonus, type CodexRewardTable, type ChronicleMonth, type ChronicleObjective, type ChroniclesConfig } from "@/game/chronicles";
import { ChronicleTimeline } from "@/components/game/ChronicleTimeline";
import { CODEX_CATEGORIES } from "@/game/codex";
import { STORY_SPEAKERS, type Speaker, type StoryLine } from "@/game/story";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import { ImageField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";
import { askConfirm } from "@/components/ui/confirm-dialog";

/* v4.3 : arcs mensuels des Chroniques (épisodes, objectifs, boss, teinte). */

const SPEAKER_IDS = Object.keys(STORY_SPEAKERS) as Speaker[];

/** Une réplique par ligne : « vashka: texte ». */
// v5.4 : « voix: texte » garde l'orateur ponctuel (antagoniste généré sans portrait de la liste).
function linesToText(lines: StoryLine[]): string {
  return lines.map((l) => `${l.as ? "voix" : l.speaker}: ${l.text}`).join("\n");
}

function textToLines(text: string, previous: StoryLine[] = []): StoryLine[] {
  const guest = previous.find((l) => l.as);
  return text
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const m = /^([a-z]+)\s*:\s*(.*)$/.exec(row);
      if (m?.[1] === "voix" && guest) return { speaker: guest.speaker, as: guest.as, text: m[2] };
      const speaker = m && SPEAKER_IDS.includes(m[1] as Speaker) ? (m[1] as Speaker) : "vashka";
      return { speaker, text: m ? m[2] : row };
    });
}

function nextMonthId(id: string): string {
  const [y, m] = id.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function ChroniclesPanel() {
  const customized = useContentStore((s) => s.customized.includes("chronicles"));
  const [cfg, setCfg] = useState<ChroniclesConfig>(() => structuredClone(currentGameContent().chronicles));
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const month = cfg.months[selected];
  const setMonth = (patch: Partial<ChronicleMonth>) => setCfg((c) => ({ ...c, months: c.months.map((m, i) => (i === selected ? { ...m, ...patch } : m)) }));

  const save = async () => {
    setBusy(true);
    try {
      await saveContentSection("chronicles", cfg);
      toast.success("Chroniques enregistrées.");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const addMonth = () => {
    const last = cfg.months[cfg.months.length - 1];
    const id = nextMonthId(last.id);
    const copy: ChronicleMonth = { ...structuredClone(last), id, title: "Nouvel arc", boss: { ...last.boss, image: `/assets/chronicles/${id}-boss.webp`, emblem: `/assets/chronicles/${id}-sceau.webp` } };
    setCfg((c) => ({ ...c, months: [...c.months, copy] }));
    setSelected(cfg.months.length);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base text-white">Chroniques</h2>
        <Badge variant={customized ? "warning" : "default"}>{customized ? "Personnalisé" : "Valeurs du code"}</Badge>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || !customized}
            onClick={async () => {
              await resetContentSection("chronicles");
              setCfg(structuredClone(currentGameContent().chronicles));
              setSelected(0);
              toast.success("Chroniques par défaut restaurées.");
            }}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Valeurs par défaut
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>

      <ChronicleBonusSection bonus={normalizeChronicleBonus(cfg.bonus)} onChange={(bonus) => setCfg((c) => ({ ...c, bonus }))} />
      <CodexRewardsSection table={normalizeCodexRewards(cfg.codexRewards)} onChange={(codexRewards) => setCfg((c) => ({ ...c, codexRewards }))} />
      <NextMonthPreview cfg={cfg} onCreate={addMonth} />

      <div className="flex flex-wrap gap-1.5">
        {cfg.months.map((m, i) => (
          <Button key={m.id} size="sm" variant={i === selected ? "primary" : "secondary"} onClick={() => setSelected(i)}>
            {m.id} · {m.title}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={addMonth}>
          <Plus className="mr-1 h-3.5 w-3.5" /> Mois suivant
        </Button>
      </div>

      {month && (
        <>
          <Card className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
            <TextField label="Mois (AAAA-MM)" value={month.id} onChange={(v) => setMonth({ id: v.trim() })} />
            <TextField label="Titre de l'arc" value={month.title} onChange={(v) => setMonth({ title: v })} />
            <TextField label="Teinte (couleur)" value={month.theme.accent} onChange={(v) => setMonth({ theme: { ...month.theme, accent: v } })} />
            <TextField label="Nom de la teinte" value={month.theme.label} onChange={(v) => setMonth({ theme: { ...month.theme, label: v } })} />
            <TextField label="Boss" value={month.boss.name} onChange={(v) => setMonth({ boss: { ...month.boss, name: v } })} />
            <TextField label="Titre des participants à sa chute" value={month.boss.title} onChange={(v) => setMonth({ boss: { ...month.boss, title: v } })} />
            <ImageField label="Image du boss (21:9)" value={month.boss.image} onChange={(v) => setMonth({ boss: { ...month.boss, image: v } })} />
            <ImageField label="Sceau du mois" value={month.boss.emblem} onChange={(v) => setMonth({ boss: { ...month.boss, emblem: v } })} />
            <div className="sm:col-span-2">
              <TextAreaField label="Présentation du boss" rows={2} value={month.boss.lore} onChange={(v) => setMonth({ boss: { ...month.boss, lore: v } })} />
            </div>
            <div className="sm:col-span-2">
              <TextAreaField label="Prologue (facultatif)" rows={2} value={month.synopsis ?? ""} onChange={(v) => setMonth({ synopsis: v || undefined })} />
            </div>
            {month.completion && (
              <TextField label="Titre de fin de chapitre" value={month.completion.title} onChange={(v) => setMonth({ completion: { ...month.completion!, title: v } })} />
            )}
            {month.auto && (
              <div className="border border-cyan-glow/20 bg-cyan-glow/5 p-3 text-xs text-slate-300 sm:col-span-2">
                <p className="mb-1 font-medium text-cyan-glow">
                  Chapitre généré le {new Date(month.auto.generatedAtMs).toLocaleString("fr-FR")} à partir de {month.auto.sourceMonth} ({month.auto.activePlayers} joueurs actifs, difficulté ×{month.auto.difficulty})
                </p>
                <ul className="list-disc space-y-0.5 pl-4">
                  {month.auto.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="sm:col-span-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={cfg.months.length <= 1}
                onClick={async () => {
                  if (!(await askConfirm({ title: `Supprimer la chronique ${month.id} ?`, confirmLabel: "Supprimer", tone: "danger" }))) return;
                  setCfg((c) => ({ ...c, months: c.months.filter((_, i) => i !== selected) }));
                  setSelected(0);
                }}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer ce mois
              </Button>
            </div>
          </Card>
          {month.episodes.map((e, i) => (
            <Card key={i} className="p-4">
              <Section title={`Épisode ${i + 1} (ouvert le ${[1, 8, 15, 22][i]} du mois)`}>
                <TextField label="Titre" value={e.title} onChange={(v) => setMonth({ episodes: month.episodes.map((x, j) => (j === i ? { ...x, title: v } : x)) })} />
                <SelectField<ChronicleObjective>
                  label="Objectif"
                  value={e.objective.type}
                  options={Object.entries(OBJECTIVE_LABELS).map(([value, label]) => ({ value: value as ChronicleObjective, label }))}
                  onChange={(v) => setMonth({ episodes: month.episodes.map((x, j) => (j === i ? { ...x, objective: { ...x.objective, type: v } } : x)) })}
                />
                <NumberField label="Nombre" value={e.objective.count} min={1} onChange={(v) => setMonth({ episodes: month.episodes.map((x, j) => (j === i ? { ...x, objective: { ...x.objective, count: Math.max(1, v ?? 1) } } : x)) })} />
                <div className="sm:col-span-2">
                  <TextAreaField
                    label={`Répliques, une par ligne « personnage: texte » (${SPEAKER_IDS.join(", ")} ; {pseudo} = joueur)`}
                    rows={4}
                    value={linesToText(e.lines)}
                    onChange={(v) => setMonth({ episodes: month.episodes.map((x, j) => (j === i ? { ...x, lines: textToLines(v, x.lines) } : x)) })}
                  />
                </div>
              </Section>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

/** 5.15.11 : bonus versé à chaque épisode et à la fin de chaque chapitre (tous les mois). */
function ChronicleBonusSection({ bonus, onChange }: { bonus: ChronicleBonus; onChange: (b: ChronicleBonus) => void }) {
  const set = (k: keyof ChronicleBonus, f: "tokens" | "amber", v: number | undefined) => onChange({ ...bonus, [k]: { ...bonus[k], [f]: Math.max(0, Math.floor(v ?? 0)) } });
  return (
    <Section title="Récompenses des Chroniques (tous les mois)">
      <NumberField label="Épisode terminé : jetons du casino" value={bonus.episode.tokens} min={0} step={1} onChange={(v) => set("episode", "tokens", v)} />
      <NumberField label="Épisode terminé : Ambre" value={bonus.episode.amber} min={0} step={5} onChange={(v) => set("episode", "amber", v)} />
      <NumberField label="Chapitre terminé : jetons du casino" value={bonus.chapter.tokens} min={0} step={1} onChange={(v) => set("chapter", "tokens", v)} />
      <NumberField label="Chapitre terminé : Ambre" value={bonus.chapter.amber} min={0} step={5} onChange={(v) => set("chapter", "amber", v)} />
      <p className="text-[11px] text-slate-500 sm:col-span-2">
        En plus des points de passe et de la récompense propre à chaque épisode. Sur un mois complet : {bonus.episode.tokens * 4 + bonus.chapter.tokens} jetons et {bonus.episode.amber * 4 + bonus.chapter.amber} Ambre par joueur.
      </p>
    </Section>
  );
}

/** 5.15.11 : le mois suivant tel que les joueurs le verront (ou l'alerte s'il manque). */
function NextMonthPreview({ cfg, onCreate }: { cfg: ChroniclesConfig; onCreate: () => void }) {
  const now = Date.now();
  const id = nextMonthId(chronicleMonthId(now));
  const month = cfg.months.find((m) => m.id === id);
  return (
    <Section title={`Aperçu du mois suivant · ${id}`}>
      <div className="sm:col-span-2">
        {month ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-slate-200">
              <span className="font-display text-white">{month.title}</span> · boss : {month.boss.name}
              {month.auto ? " · chapitre généré" : ""}
            </p>
            <ChronicleTimeline month={month} bonus={normalizeChronicleBonus(cfg.bonus)} now={now} open={0} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 border border-ember-glow/30 bg-ember-glow/[0.05] p-3 text-xs text-slate-300">
            <span className="flex-1">Aucun chapitre pour {id} : sans chapitre, la page Chroniques sera vide ce mois-là. Le générateur procédural peut l'écrire, ou crée-le ici.</span>
            <Button size="sm" variant="outline" onClick={onCreate}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Créer {id}
            </Button>
          </div>
        )}
      </div>
    </Section>
  );
}

/** 5.15.12 : récompense de chaque catégorie du Codex complète (une fois par joueur). */
function CodexRewardsSection({ table, onChange }: { table: CodexRewardTable; onChange: (t: CodexRewardTable) => void }) {
  const set = (k: string, f: "tokens" | "amber", v: number | undefined) => onChange({ ...table, [k]: { ...table[k], [f]: Math.max(0, Math.floor(v ?? 0)) } });
  return (
    <Section title="Récompenses du Codex (catégorie complète)">
      {CODEX_CATEGORIES.map((c) => (
        <div key={c.id} className="grid grid-cols-[minmax(0,7rem)_1fr_1fr] items-end gap-2">
          <span className="pb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">{c.label}</span>
          <NumberField label="Jetons" value={table[c.id]?.tokens ?? 0} min={0} step={1} onChange={(v) => set(c.id, "tokens", v)} />
          <NumberField label="Ambre" value={table[c.id]?.amber ?? 0} min={0} step={5} onChange={(v) => set(c.id, "amber", v)} />
        </div>
      ))}
      <p className="text-[11px] text-slate-500 sm:col-span-2">0 et 0 : la catégorie ne rapporte rien (cas des Chroniques, toujours ouvertes).</p>
    </Section>
  );
}
