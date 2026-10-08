import { COMMANDER_ROLES, COMMANDERS, type CommanderId } from "@/game/commanders";
import { currentGameContent } from "@/game/content";
import { DEFAULT_PASS_THEMES, type PassTheme } from "@/game/passSeasons";
import { illustrationPrompt, portraitPrompt, type SeasonCatalogEntry } from "@/game/seasonCatalog";
import { STORY_SPEAKERS, type Speaker } from "@/game/story";
import { BASE_OBJECTIVES, objectiveLabel } from "@/game/trackedActions";
import type { ChronicleObjective } from "@/game/chronicles";
import { CheckboxField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";

/* =====================================================
   6.14.128 (AU27, lot AA9, constat AA-23) : thèmes du passe et catalogue des
   saisons en sections de contenu (Admin → Catalogue du passe). L'ordre des
   thèmes est celui de la rotation mensuelle ; chaque thème en rotation a une
   saison par année du catalogue. Les passes déjà écrits gardent leur copie.
===================================================== */

const ID_HINT_NEW = "Lettres, chiffres, _ — non modifiable une fois enregistré.";
const ID_HINT_LOCKED = "Repris par les passes déjà écrits : non modifiable.";

const roleOptions = () => COMMANDER_ROLES.map((r) => ({ value: r, label: COMMANDERS.find((c) => c.id === r)?.title ?? r }));
const speakerOptions = () => (Object.keys(STORY_SPEAKERS) as Speaker[]).map((s) => ({ value: s, label: `${STORY_SPEAKERS[s].name} (${STORY_SPEAKERS[s].role})` }));
const lines = (v: string[] | undefined) => (v ?? []).join("\n");
const toLines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
const STEPS = ["Prologue", "Palier 10", "Palier 20", "Palier 30"];

export function newPassTheme(): PassTheme {
  return { ...structuredClone(DEFAULT_PASS_THEMES[0]), id: "nouveau_theme", image: "/assets/pass/theme-nouveau_theme.webp" };
}

export function PassThemeForm({ value: t, onChange, isNew }: { value: PassTheme; onChange: (next: PassTheme) => void; isNew: boolean }) {
  const set = (patch: Partial<PassTheme>) => onChange({ ...t, ...patch });
  const setStep = (key: "beats" | "rivalLines", i: number, v: string) => {
    const next = [...(t[key] ?? [[], [], [], []])] as PassTheme["beats"];
    next[i] = toLines(v);
    set({ [key]: next } as Partial<PassTheme>);
  };
  return (
    <div className="flex flex-col gap-3">
      <Section title="Thème du passe">
        <TextField label="Identifiant" value={t.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(id) => set({ id })} />
        <TextField label="Couleur (#rrggbb)" value={t.accent} onChange={(accent) => set({ accent })} />
        <TextField label="Image (en-tête de la page du passe)" value={t.image} onChange={(image) => set({ image })} />
        <SelectField<CommanderId> label="Rôle principal du commandant" value={t.primary} options={roleOptions()} onChange={(primary) => set({ primary })} />
        <SelectField<Speaker> label="Mentor" value={t.mentor} options={speakerOptions()} onChange={(mentor) => set({ mentor })} />
        <SelectField<Speaker> label="Rival" value={t.rival} options={speakerOptions()} onChange={(rival) => set({ rival })} />
        <CheckboxField label="Retiré de la rotation" checked={!!t.retired} onChange={(v) => set({ retired: v || undefined })} hint="Les mois suivants prennent les autres thèmes ; les passes déjà écrits gardent le leur." />
      </Section>
      <Section title="Actions mises en avant (défis)">
        {BASE_OBJECTIVES.map((k) => (
          <CheckboxField
            key={k}
            label={objectiveLabel(k)}
            checked={(t.focus ?? []).includes(k as ChronicleObjective)}
            onChange={(on) => set({ focus: on ? [...(t.focus ?? []), k as ChronicleObjective] : (t.focus ?? []).filter((x) => x !== k) })}
          />
        ))}
      </Section>
      <Section title="Répliques (une par ligne ; {commander} : nom du commandant)">
        {STEPS.map((step, i) => (
          <div key={step} className="grid min-w-0 grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2">
            <TextAreaField label={`${step} : mentor`} value={lines(t.beats?.[i])} rows={2} onChange={(v) => setStep("beats", i, v)} />
            <TextAreaField label={`${step} : rival`} value={lines(t.rivalLines?.[i])} rows={2} onChange={(v) => setStep("rivalLines", i, v)} />
          </div>
        ))}
      </Section>
    </div>
  );
}

export function newCatalogEntry(): SeasonCatalogEntry {
  const theme = currentGameContent().passThemes[0]?.id ?? "vide";
  return { id: `${theme}_4`, theme, year: 4, name: "Nouvelle saison", tagline: "", synopsis: "{mentor} … ; {rival} …", commander: { name: "Nouveau commandant", title: "", secondary: "spy", lore: "{commander} …", look: "" }, scene: "" };
}

export function CatalogEntryForm({ value: e, onChange, isNew }: { value: SeasonCatalogEntry; onChange: (next: SeasonCatalogEntry) => void; isNew: boolean }) {
  const set = (patch: Partial<SeasonCatalogEntry>) => onChange({ ...e, ...patch });
  const setCmd = (patch: Partial<SeasonCatalogEntry["commander"]>) => set({ commander: { ...e.commander, ...patch } });
  const themes = currentGameContent().passThemes;
  const accent = themes.find((t) => t.id === e.theme)?.accent ?? DEFAULT_PASS_THEMES[0].accent;
  return (
    <div className="flex flex-col gap-3">
      <Section title="Saison du catalogue">
        <TextField label="Identifiant" value={e.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : "Repère de la fiche : non modifiable."} onChange={(id) => set({ id })} />
        <TextField label="Nom de la saison" value={e.name} onChange={(name) => set({ name })} />
        <SelectField label="Thème" value={e.theme} options={themes.map((t) => ({ value: t.id, label: t.id }))} onChange={(theme) => set({ theme })} />
        <NumberField label="Année du catalogue" value={e.year} min={1} step={1} hint="Une saison par thème et par année ; le cycle dure thèmes × années mois." onChange={(v) => set({ year: Math.max(1, Math.round(v ?? 1)) })} />
        <TextField label="Accroche" value={e.tagline} onChange={(tagline) => set({ tagline })} />
        <div className="sm:col-span-2">
          <TextAreaField label="Scénario ({mentor}, {rival}, {commander})" value={e.synopsis} rows={3} onChange={(synopsis) => set({ synopsis })} />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField label="Scène de l'illustration (anglais, prompt Midjourney)" value={e.scene} rows={2} onChange={(scene) => set({ scene })} />
          <p className="mt-1 min-w-0 break-words font-mono text-[10px] text-slate-500">{illustrationPrompt(e, accent)}</p>
        </div>
      </Section>
      <Section title="Commandant de saison">
        <TextField label="Nom" value={e.commander?.name ?? ""} onChange={(name) => setCmd({ name })} />
        <TextField label="Titre" value={e.commander?.title ?? ""} onChange={(title) => setCmd({ title })} />
        <SelectField<CommanderId> label="Second rôle" value={e.commander?.secondary ?? "spy"} options={roleOptions()} onChange={(secondary) => setCmd({ secondary })} hint="Le rôle principal vient du thème." />
        <div className="sm:col-span-2">
          <TextAreaField label="Histoire ({commander})" value={e.commander?.lore ?? ""} rows={2} onChange={(lore) => setCmd({ lore })} />
        </div>
        <div className="sm:col-span-2">
          <TextAreaField label="Apparence (anglais, prompt du portrait)" value={e.commander?.look ?? ""} rows={2} onChange={(look) => setCmd({ look })} />
          <p className="mt-1 min-w-0 break-words font-mono text-[10px] text-slate-500">{portraitPrompt(e, accent)}</p>
        </div>
      </Section>
    </div>
  );
}
