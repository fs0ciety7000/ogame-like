import { METRICS, type AchievementMetric } from "@/game/achievements";
import { ALLIANCE_CHALLENGES, allianceChallengeRotation, challengeOfWeek, DEFAULT_ALLIANCE_CHALLENGES, type AllianceChallengeDef } from "@/game/allianceChallenge";
import { allianceWeekId } from "@/game/allianceBoss";
import { DAILY_POOL_COUNT, DAILY_RULES, type DailyPoolEntry } from "@/game/dailyMissions";
import { DEFAULT_ARCHETYPES, type Archetype } from "@/game/procedural";
import { STORY_SPEAKERS, type Speaker } from "@/game/story";
import { staticObjectiveLabels } from "@/game/trackedActions";
import type { ChronicleObjective } from "@/game/chronicles";
import { CheckboxField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";

/* =====================================================
   6.14.154 (AU27, lot R6, reste du constat AA-23) : listes du jeu en
   sections de contenu (Admin → Listes du jeu) : défis d'alliance (ordre =
   rotation hebdomadaire), réserve des missions du jour, archétypes des
   Chroniques générées. À contenu par défaut, mêmes listes qu'avant.
===================================================== */

const ID_HINT_NEW = "Lettres, chiffres, _ — non modifiable une fois enregistré.";
const ID_HINT_LOCKED = "Repris par les données du serveur : non modifiable.";
const lines = (v: string[] | undefined) => (v ?? []).join("\n");
const toLines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);
/** JSON pur : la case décochée retire le champ (jamais `undefined` enregistré). */
function withRetired<T extends { retired?: boolean }>(item: T, on: boolean): T {
  const next: T = { ...item, retired: on };
  if (!on) delete next.retired;
  return next;
}

/* ---------- défis d'alliance ---------- */

/** Un défi enregistré ne se supprime pas (I43) : la semaine en cours ou un podium passé peut le citer. */
export const CHALLENGE_LOCK_HINT = "Enregistré : la semaine en cours ou un podium passé peut le citer. Coche « Retiré de la rotation » pour le sortir du jeu.";

const metricOptions = () => (Object.keys(METRICS) as AchievementMetric[]).map((m) => ({ value: m, label: METRICS[m].label }));

export function newAllianceChallenge(): AllianceChallengeDef {
  return { ...structuredClone(DEFAULT_ALLIANCE_CHALLENGES[0]), id: "nouveau_defi", name: "Nouveau défi" };
}

export function AllianceChallengeForm({ value: c, onChange, isNew }: { value: AllianceChallengeDef; onChange: (next: AllianceChallengeDef) => void; isNew: boolean }) {
  const set = (patch: Partial<AllianceChallengeDef>) => onChange({ ...c, ...patch });
  // Défi de la semaine en cours (liste en vigueur, enregistrée) : repère pour l'admin avant de retirer.
  const thisWeek = challengeOfWeek(allianceWeekId(Date.now()));
  const position = allianceChallengeRotation().findIndex((x) => x.id === c.id);
  return (
    <div className="flex flex-col gap-3">
      <Section title="Défi d'alliance de la semaine">
        <TextField label="Identifiant" value={c.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(id) => set({ id })} />
        <TextField label="Nom" value={c.name} onChange={(name) => set({ name })} />
        <TextField label="Emoji" value={c.emoji} onChange={(emoji) => set({ emoji })} />
        <SelectField<AchievementMetric> label="Mesure (progression des membres pendant la semaine)" value={c.metric} options={metricOptions()} onChange={(metric) => set({ metric })} />
        <div className="sm:col-span-2">
          <TextAreaField label="Texte affiché aux joueurs" value={c.hint} onChange={(hint) => set({ hint })} />
        </div>
        <CheckboxField
          label="Retiré de la rotation"
          checked={!!c.retired}
          onChange={(v) => onChange(withRetired(c, v))}
          hint="Les semaines suivantes prennent les autres défis ; la semaine en cours et le podium passé gardent son nom."
        />
      </Section>
      <p className="text-[11px] text-slate-500">
        L'ordre de la liste est la rotation hebdomadaire ({ALLIANCE_CHALLENGES.filter((x) => !x.retired).length} défis en vigueur) : ajouter ou retirer un défi décale les
        semaines suivantes. Semaine en cours : « {thisWeek.name} ».{position >= 0 ? ` Ce défi est le n° ${position + 1} de la rotation enregistrée.` : ""}
      </p>
    </div>
  );
}

/* ---------- réserve des missions du jour ---------- */

export function newDailyPoolEntry(): DailyPoolEntry {
  return { id: "collect" as ChronicleObjective, count: 1 };
}

export function DailyPoolForm({ value: e, onChange, isNew }: { value: DailyPoolEntry; onChange: (next: DailyPoolEntry) => void; isNew: boolean }) {
  const labels = staticObjectiveLabels();
  const options = (Object.keys(labels) as ChronicleObjective[]).map((k) => ({ value: k, label: labels[k as keyof typeof labels] }));
  return (
    <div className="flex flex-col gap-3">
      <Section title="Tâche de la réserve">
        <SelectField<ChronicleObjective> label="Action à faire" value={e.id} options={options} disabled={!isNew} onChange={(id) => onChange({ ...e, id })} />
        <NumberField
          label="Quantité demandée"
          value={e.count}
          min={DAILY_POOL_COUNT.min}
          step={1}
          onChange={(v) => onChange({ ...e, count: Math.min(DAILY_POOL_COUNT.max, Math.max(DAILY_POOL_COUNT.min, Math.round(v ?? 1))) })}
        />
      </Section>
      <p className="text-[11px] text-slate-500">
        Tirage du jour : <span className="font-mono tabular-nums">{DAILY_RULES.tasks}</span> tâche(s) dans cette réserve, les mêmes pour tous (Règles → Missions du jour). À 0, les
        missions du jour sont fondues dans les objectifs du jour depuis 6.2 : la réserve ne sert qu'à payer les journées d'avant.
      </p>
    </div>
  );
}

/* ---------- archétypes des Chroniques ---------- */

const speakerOptions = () => (Object.keys(STORY_SPEAKERS) as Speaker[]).map((s) => ({ value: s, label: `${STORY_SPEAKERS[s].name} (${STORY_SPEAKERS[s].role})` }));

export function newArchetype(): Archetype {
  return { ...structuredClone(DEFAULT_ARCHETYPES[0]), id: "nouvel_archetype", factionId: undefined, faction: "la nouvelle faction" };
}

export function ArchetypeForm({ value: a, onChange, isNew }: { value: Archetype; onChange: (next: Archetype) => void; isNew: boolean }) {
  const set = (patch: Partial<Archetype>) => onChange({ ...a, ...patch });
  const custom = "as" in a.villain;
  const as = "as" in a.villain ? a.villain.as : null;
  return (
    <div className="flex flex-col gap-3">
      <Section title="Archétype (faction des chapitres générés)">
        <TextField label="Identifiant" value={a.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : "Repris par les chapitres écrits et les thèmes du générateur : non modifiable."} onChange={(id) => set({ id })} />
        <TextField label="Faction (avec l'article : « le Cartel Néon »)" value={a.faction} onChange={(faction) => set({ faction })} />
        <TextField
          label="Faction liée (onglet Factions, facultatif)"
          value={a.factionId ?? ""}
          hint="Une faction liée n'a pas d'archétype de repli."
          onChange={(v) => {
            const next: Archetype = { ...a, factionId: v.trim() };
            if (!v.trim()) delete next.factionId;
            onChange(next);
          }}
        />
        <TextField label="Couleur du chapitre (#rrggbb)" value={a.accent} onChange={(accent) => set({ accent })} />
        <SelectField<Speaker> label="Allié (répliques du joueur)" value={a.ally} options={speakerOptions()} onChange={(ally) => set({ ally })} />
        <CheckboxField label="Retiré du tirage" checked={!!a.retired} onChange={(v) => onChange(withRetired(a, v))} hint="Plus tiré pour les chapitres ni les sagas ; les chapitres déjà écrits gardent leur copie." />
      </Section>
      <Section title="Méchant">
        <CheckboxField
          label="Personnage propre (sinon un personnage de l'histoire)"
          checked={custom}
          onChange={(on) => set({ villain: on ? { as: { name: "Nouveau chef", role: a.faction, image: a.fallbackImage, color: a.accent } } : { speaker: "varan" } })}
        />
        {as ? (
          <>
            <TextField label="Nom" value={as.name} onChange={(name) => set({ villain: { as: { ...as, name } } })} />
            <TextField label="Rôle" value={as.role} onChange={(role) => set({ villain: { as: { ...as, role } } })} />
            <TextField label="Portrait" value={as.image} onChange={(image) => set({ villain: { as: { ...as, image } } })} />
            <TextField label="Couleur (#rrggbb)" value={as.color} onChange={(color) => set({ villain: { as: { ...as, color } } })} />
          </>
        ) : (
          <SelectField<Speaker> label="Personnage" value={"speaker" in a.villain ? a.villain.speaker : "varan"} options={speakerOptions()} onChange={(speaker) => set({ villain: { speaker } })} />
        )}
      </Section>
      <Section title="Images">
        <TextField label="Boss (image du chapitre)" value={a.image} onChange={(image) => set({ image })} />
        <TextField label="Sceau" value={a.emblem} onChange={(emblem) => set({ emblem })} />
        <TextField label="Image de repli" value={a.fallbackImage} onChange={(fallbackImage) => set({ fallbackImage })} />
      </Section>
      <Section title="Textes (une ligne par entrée)">
        <TextAreaField label="Noms de teinte" value={lines(a.themeLabels)} onChange={(v) => set({ themeLabels: toLines(v) })} />
        <TextAreaField label="Noms de boss" rows={3} value={lines(a.bossNames)} onChange={(v) => set({ bossNames: toLines(v) })} />
        <TextAreaField label="Titres de chapitre" rows={3} value={lines(a.titles)} onChange={(v) => set({ titles: toLines(v) })} />
        <TextAreaField label="Titres gagnés à la fin" rows={3} value={lines(a.completionTitles)} onChange={(v) => set({ completionTitles: toLines(v) })} />
        <div className="sm:col-span-2">
          <TextAreaField label="Récit (un paragraphe par ligne)" rows={4} value={lines(a.lore)} onChange={(v) => set({ lore: toLines(v) })} />
        </div>
      </Section>
    </div>
  );
}
