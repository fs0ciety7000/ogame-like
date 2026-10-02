import { useState } from "react";
import { toast } from "sonner";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currentGameContent } from "@/game/content";
import { OBJECTIVE_LABELS, type ChronicleMonth, type ChronicleObjective, type ChroniclesConfig } from "@/game/chronicles";
import { STORY_SPEAKERS, type Speaker, type StoryLine } from "@/game/story";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import { ImageField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";

/* v4.3 : arcs mensuels des Chroniques (épisodes, objectifs, boss, teinte). */

const SPEAKER_IDS = Object.keys(STORY_SPEAKERS) as Speaker[];

/** Une réplique par ligne : « vashka: texte ». */
function linesToText(lines: StoryLine[]): string {
  return lines.map((l) => `${l.speaker}: ${l.text}`).join("\n");
}

function textToLines(text: string): StoryLine[] {
  return text
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const m = /^([a-z]+)\s*:\s*(.*)$/.exec(row);
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
  const setMonth = (patch: Partial<ChronicleMonth>) => setCfg((c) => ({ months: c.months.map((m, i) => (i === selected ? { ...m, ...patch } : m)) }));

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
    setCfg((c) => ({ months: [...c.months, copy] }));
    setSelected(cfg.months.length);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base text-white">Chroniques</h2>
        <Badge variant={customized ? "warning" : "default"}>{customized ? "Personnalisé" : "Valeurs du code"}</Badge>
        <div className="ml-auto flex gap-2">
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
          <Card className="grid gap-3 p-4 sm:grid-cols-2">
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
              <Button
                size="sm"
                variant="ghost"
                disabled={cfg.months.length <= 1}
                onClick={() => {
                  if (!confirm(`Supprimer la chronique ${month.id} ?`)) return;
                  setCfg((c) => ({ months: c.months.filter((_, i) => i !== selected) }));
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
                    onChange={(v) => setMonth({ episodes: month.episodes.map((x, j) => (j === i ? { ...x, lines: textToLines(v) } : x)) })}
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
