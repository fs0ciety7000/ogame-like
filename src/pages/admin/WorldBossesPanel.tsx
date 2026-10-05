import { useState } from "react";
import { toast } from "sonner";
import { Copy, RotateCcw, Save, Skull } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { currentGameContent } from "@/game/content";
import { bossWindows } from "@/game/events";
import { leviathanSchedule, worldBossForStart } from "@/game/leviathan";
import { OFFENSIVE_UNITS, findUnit } from "@/game/units";
import { validateWorldBosses, type WorldBossDef } from "@/game/worldBosses";
import { parisWhenLabel } from "@/game/events";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import { CheckboxField, Field, ImageField, NumberField, Section, TextAreaField, TextField } from "@/pages/admin/fields";

/* v5.14 : catalogue des boss mondiaux (rotation hebdomadaire) : identité,
   histoire, statistiques, phases, faiblesses, titre ; un boss retiré de la
   rotation garde ses combats passés. Calendrier : onglet Règles. */

export function WorldBossesPanel() {
  const customized = useContentStore((s) => s.customized.includes("worldBosses"));
  useContentStore((s) => s.version);
  const [list, setList] = useState<WorldBossDef[]>(() => structuredClone(currentGameContent().worldBosses));
  const [selected, setSelected] = useState(list[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const errors = validateWorldBosses(list);
  const boss = list.find((b) => b.id === selected) ?? list[0];
  const set = (patch: Partial<WorldBossDef>) => setList((l) => l.map((b) => (b.id === boss.id ? { ...b, ...patch } : b)));
  const setPhase = (i: number, patch: Partial<WorldBossDef["phases"][number]>) => set({ phases: boss.phases.map((p, j) => (j === i ? { ...p, ...patch } : p)) as WorldBossDef["phases"] });
  const upcoming = bossWindows(Date.now(), leviathanSchedule(), 6).filter((w) => w.startMs > Date.now());

  const save = async () => {
    if (errors.length) return toast.error("Corrige les erreurs avant d'enregistrer.");
    setBusy(true);
    try {
      await saveContentSection("worldBosses", list);
      toast.success("Boss mondiaux enregistrés (appliqués aussi par le serveur).");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  if (!boss) return null;
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Skull className="h-4 w-4 text-danger-glow" />
        <h2 className="hud-title text-sm text-slate-100">Boss mondiaux</h2>
        <HudChip size="sm" tone={customized ? "ember" : "neutral"}>
          {customized ? "Personnalisé" : "Valeurs du code"}
        </HudChip>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || !customized}
            onClick={async () => {
              await resetContentSection("worldBosses");
              setList(structuredClone(currentGameContent().worldBosses));
              toast.success("Boss du code restaurés.");
            }}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Valeurs par défaut
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Un boss par semaine, à tour de rôle parmi ceux de la rotation, un jour différent du précédent. Heure, durée et activation de la rotation : onglet Règles. Lancement manuel : page du boss mondial.
      </p>
      {upcoming.length > 0 && (
        <p className="text-xs text-slate-300">
          Prochaines apparitions : {upcoming.map((w) => `${worldBossForStart(w.startMs).name} (${parisWhenLabel(w.startMs)})`).join(" · ")}
        </p>
      )}
      {errors.length > 0 && <HudCallout tone="danger" className="text-xs">{errors.join(" ")}</HudCallout>}

      <div className="flex flex-wrap gap-1.5">
        {list.map((b) => (
          <HudChip key={b.id} asChild size="md" tone={b.id === boss.id ? "accent" : b.enabled === false ? "neutral" : "mint"}>
            <button type="button" onClick={() => setSelected(b.id)}>
              {b.name}
              {b.enabled === false ? " · hors rotation" : ""}
            </button>
          </HudChip>
        ))}
      </div>

      <Section title="Identité">
        <CheckboxField label="Dans la rotation" checked={boss.enabled !== false} onChange={(v) => set({ enabled: v })} hint="Décoché : il ne revient plus, mais ses combats passés gardent son nom et son titre." />
        <TextField label="Nom" value={boss.name} onChange={(name) => set({ name })} />
        <TextField label="Épithète" value={boss.epithet} onChange={(epithet) => set({ epithet })} />
        <TextField label="Titre du premier en dégâts (7 jours)" value={boss.title} onChange={(title) => set({ title })} />
        <Field label="Couleur">
          <div className="flex items-center gap-2">
            <input type="color" value={boss.accent} onChange={(e) => set({ accent: e.target.value })} className="h-10 w-14 border border-white/15 bg-transparent" />
            <span className="font-mono text-xs text-slate-400">{boss.accent}</span>
          </div>
        </Field>
        <ImageField label="Illustration 16:9 (à défaut : celle du Léviathan)" value={boss.image} onChange={(image) => set({ image })} />
      </Section>
      <TextAreaField label="Histoire (page du boss, notification d'apparition)" rows={3} value={boss.story} onChange={(story) => set({ story })} />
      <div className="hud-cut-sm flex items-start gap-2 border border-white/10 bg-white/[0.02] p-2">
        <p className="min-w-0 flex-1 break-words font-mono text-[11px] text-slate-400">{boss.prompt}</p>
        <Button
          size="icon"
          variant="ghost"
          title="Copier le prompt Midjourney"
          onClick={() => {
            void navigator.clipboard?.writeText(boss.prompt);
            toast.success("Prompt copié.");
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Section title="Statistiques (1 = Léviathan)">
        <NumberField label="Structure ×" value={boss.hpMult} step={0.05} min={0.1} onChange={(v) => set({ hpMult: v ?? 1 })} />
        <NumberField label="Pertes à chaque assaut ×" value={boss.lossMult} step={0.05} min={0.1} onChange={(v) => set({ lossMult: v ?? 1 })} />
        <NumberField label="Récompenses (heures de production) ×" value={boss.rewardMult} step={0.05} min={0.1} onChange={(v) => set({ rewardMult: v ?? 1 })} />
      </Section>

      <Section title="Phases (la mécanique est commune : riposte sous 50 %, bouclier et faiblesse sous 25 %)">
        {boss.phases.map((p, i) => (
          <div key={i} className="flex flex-col gap-2 border-l-2 border-white/10 pl-2">
            <TextField label={`Phase ${i + 1}`} value={p.name} onChange={(name) => setPhase(i, { name })} />
            <TextField label="Récit" value={p.flavor} onChange={(flavor) => setPhase(i, { flavor })} />
          </div>
        ))}
      </Section>

      <Field label="Faiblesses possibles en phase 3 (une est tirée par combat)">
        <div className="flex flex-wrap gap-1.5">
          {OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage").map((id) => {
            const on = boss.weakness.includes(id);
            return (
              <HudChip key={id} asChild size="sm" tone={on ? "violet" : "neutral"}>
                <button type="button" onClick={() => set({ weakness: on ? boss.weakness.filter((w) => w !== id) : [...boss.weakness, id] })}>
                  {findUnit(id)?.name ?? id}
                </button>
              </HudChip>
            );
          })}
        </div>
      </Field>
    </Card>
  );
}
