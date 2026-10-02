import { DEFAULT_FACTIONS, type FactionDef } from "@/game/pirates";
import { CheckboxField, ImageField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";

const ID_HINT_NEW = "Minuscules, chiffres, _ — non modifiable une fois enregistré.";
const ID_HINT_LOCKED = "Identifiant utilisé dans les données des joueurs : non modifiable.";

const COLORS = [
  { value: "ember", label: "Braise" },
  { value: "gold", label: "Or" },
  { value: "cyan", label: "Cyan" },
  { value: "mint", label: "Menthe" },
  { value: "danger", label: "Rouge" },
];

export function newFaction(): FactionDef {
  return { ...structuredClone(DEFAULT_FACTIONS[0]), id: "nouvelle_faction", name: "Nouvelle faction", enabled: false };
}

/** Fiche d'une faction hostile : textes, déclencheur, tribut, raid, repaire. */
export function FactionForm({ value: f, onChange, isNew }: { value: FactionDef; onChange: (next: FactionDef) => void; isNew: boolean }) {
  const set = (patch: Partial<FactionDef>) => onChange({ ...f, ...patch });
  const ult = (patch: Partial<FactionDef["ultimatum"]>) => set({ ultimatum: { ...f.ultimatum, ...patch } });
  const trig = (patch: Partial<FactionDef["trigger"]>) => set({ trigger: { ...f.trigger, ...patch } });
  const trib = (patch: Partial<FactionDef["tribute"]>) => set({ tribute: { ...f.tribute, ...patch } });
  const raid = (patch: Partial<FactionDef["raid"]>) => set({ raid: { ...f.raid, ...patch } });
  const bounty = (patch: Partial<FactionDef["bounty"]>) => set({ bounty: { ...f.bounty, ...patch } });
  const lair = (patch: Partial<FactionDef["lair"]>) => set({ lair: { ...f.lair, ...patch } });
  const num = (v: number | undefined) => v ?? 0;

  return (
    <div className="flex flex-col gap-3">
      <Section title="Identité">
        <TextField label="Identifiant" value={f.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(v) => set({ id: v })} />
        <CheckboxField label="Faction active" checked={f.enabled} onChange={(v) => set({ enabled: v })} hint="Inactive : plus de nouveaux ultimatums (les menaces en cours vont à leur terme)." />
        <TextField label="Nom" value={f.name} onChange={(v) => set({ name: v })} />
        <SelectField label="Couleur d'accent" value={f.color} options={COLORS} onChange={(v) => set({ color: v })} />
        <TextField label="Chef" value={f.leader} onChange={(v) => set({ leader: v })} />
        <TextField label="Exécuteur (mène les raids)" value={f.enforcer} onChange={(v) => set({ enforcer: v })} />
        <div className="sm:col-span-2">
          <ImageField label="Illustration" value={f.art} onChange={(v) => set({ art: v })} />
        </div>
        <div className="sm:col-span-2">
          <ImageField label="Scène large (repaire, en tête de la page Menaces ; facultatif)" value={f.banner ?? ""} onChange={(v) => set({ banner: v || undefined })} />
        </div>
        <div className="sm:col-span-2">
          <ImageField label="Emblème (facultatif)" value={f.emblem ?? ""} onChange={(v) => set({ emblem: v || undefined })} />
        </div>
        <TextAreaField label="Récit (paragraphes séparés par une ligne vide)" rows={6} value={f.story} onChange={(v) => set({ story: v })} />
      </Section>

      <Section title="Ultimatum">
        <TextField label="Titre" value={f.ultimatum.title} onChange={(v) => ult({ title: v })} />
        <TextField label="Signature" value={f.ultimatum.signature} onChange={(v) => ult({ signature: v })} />
        <TextAreaField label="Réplique ({pseudo} = pseudo du joueur)" rows={3} value={f.ultimatum.quote} onChange={(v) => ult({ quote: v })} />
        <TextField label="Bouton « payer »" value={f.ultimatum.payLabel} onChange={(v) => ult({ payLabel: v })} />
        <NumberField label="Délai de réponse (h)" value={f.answerHours} min={0} step={1} onChange={(v) => set({ answerHours: num(v) })} />
      </Section>

      <Section title="Déclencheur">
        <SelectField
          label="Qui est visé"
          value={f.trigger.type}
          options={[
            { value: "wealth", label: "Richesse : empires actifs, au hasard" },
            { value: "aggression", label: "Agression : joueurs qui gagnent des attaques" },
            { value: "research", label: "Savoir : niveaux de technos + recherche récente" },
            { value: "hoard", label: "Thésaurisation : entrepôts remplis" },
            { value: "expansion", label: "Expansion : niveaux de bâtiments gagnés" },
            { value: "singularity", label: "Singularité : niveaux des technologies de fin de partie" },
          ]}
          onChange={(v) => trig({ type: v })}
        />
        <NumberField label="Joueurs actifs dans les dernières (h)" value={f.trigger.activeWithinHours} min={0} step={1} onChange={(v) => trig({ activeWithinHours: num(v) })} />
        <NumberField label="Délai minimal entre deux inscriptions (h)" value={f.trigger.minIntervalHours} min={0} step={1} onChange={(v) => trig({ minIntervalHours: num(v) })} />
        <NumberField label="Délai maximal (h)" value={f.trigger.maxIntervalHours} min={0} step={1} onChange={(v) => trig({ maxIntervalHours: num(v) })} />
        <NumberField label="Agression : victoires contre des joueurs" value={f.trigger.minVictories} min={0} step={1} onChange={(v) => trig({ minVictories: num(v) })} />
        <NumberField label="Période (jours) : agression, savoir, expansion" value={f.trigger.windowDays} min={0} step={1} onChange={(v) => trig({ windowDays: num(v) })} />
        <NumberField
          label="Seuil : niveaux de technos (savoir), % d'entrepôt (thésaurisation), niveaux gagnés (expansion)"
          value={f.trigger.threshold ?? 0}
          min={0}
          step={1}
          onChange={(v) => trig({ threshold: num(v) })}
        />
      </Section>

      <Section title="Tribut">
        <SelectField
          label="Base du tribut"
          value={f.tribute.basis}
          options={[
            { value: "production", label: "Heures de production" },
            { value: "plunder", label: "Part du butin récent" },
            { value: "stock", label: "Part du stock (hors bunker)" },
          ]}
          onChange={(v) => trib({ basis: v })}
        />
        <NumberField label="Heures de production" value={f.tribute.hours} min={0} step={1} onChange={(v) => trib({ hours: num(v) })} />
        <NumberField label="Part du butin (0,5 = 50 %)" value={f.tribute.plunderPct} min={0} step={0.05} onChange={(v) => trib({ plunderPct: num(v) })} />
        <NumberField label="Part du stock (0,15 = 15 %)" value={f.tribute.stockPct ?? 0} min={0} step={0.05} onChange={(v) => trib({ stockPct: num(v) })} />
        <NumberField label="Plancher (heures de production)" value={f.tribute.minHours} min={0} step={1} onChange={(v) => trib({ minHours: num(v) })} />
      </Section>

      <Section title="Raid">
        <SelectField
          label="Cible"
          value={f.raid.target}
          options={[
            { value: "base", label: "La base (défenses + flotte à quai)" },
            { value: "fleet", label: "La flotte à quai seule (100 %)" },
          ]}
          onChange={(v) => raid({ target: v })}
        />
        <NumberField label="Trajet après refus (h)" value={f.raidTravelHours} min={0} step={0.25} onChange={(v) => set({ raidTravelHours: num(v) })} />
        <NumberField label="Force : part de la cible (0,7 = 70 %)" value={f.raid.basePct} min={0} step={0.05} onChange={(v) => raid({ basePct: num(v) })} />
        <NumberField label="Force : + par point de Notoriété" value={f.raid.perNotorietyPct} min={0} step={0.05} onChange={(v) => raid({ perNotorietyPct: num(v) })} />
        <NumberField label="Notoriété maximale" value={f.raid.maxNotoriety} min={0} step={1} onChange={(v) => raid({ maxNotoriety: num(v) })} />
        <NumberField label="Force minimale : fixe" value={f.raid.floorPower} min={0} step={50} onChange={(v) => raid({ floorPower: num(v) })} />
        <NumberField label="Force minimale : par niveau de bâtiment" value={f.raid.floorPerBuildingLevel} min={0} step={5} onChange={(v) => raid({ floorPerBuildingLevel: num(v) })} />
        <NumberField label="Pillage en cas de défaite (0,1 = 10 %)" value={f.raid.lootPct} min={0} step={0.05} onChange={(v) => raid({ lootPct: num(v) })} />
        <SelectField
          label="Ressources pillées"
          value={f.raid.lootKind}
          options={[
            { value: "common", label: "Communes" },
            { value: "rare", label: "Rares" },
          ]}
          onChange={(v) => raid({ lootKind: v })}
        />
      </Section>

      <Section title="Raid repoussé (prime)">
        <NumberField label="Heures de production" value={f.bounty.hours} min={0} step={1} onChange={(v) => bounty({ hours: num(v) })} />
        <NumberField label="Bonus de chaque ressource rare" value={f.bounty.rare} min={0} step={50} onChange={(v) => bounty({ rare: num(v) })} />
        <NumberField label="XP" value={f.bounty.xp} min={0} step={5} onChange={(v) => bounty({ xp: num(v) })} />
        <NumberField label="Débris par point de puissance détruite" value={f.bounty.debrisPerPower} min={0} step={0.1} onChange={(v) => bounty({ debrisPerPower: num(v) })} />
      </Section>

      <Section title="Repaire">
        <TextField label="Nom" value={f.lair.name} onChange={(v) => lair({ name: v })} />
        <NumberField label="Raids repoussés pour le localiser" value={f.lair.raidsNeeded} min={1} step={1} onChange={(v) => lair({ raidsNeeded: num(v) })} />
        <NumberField label="Force (× la cible du raid)" value={f.lair.pct} min={0} step={0.1} onChange={(v) => lair({ pct: num(v) })} />
        <NumberField label="Récompense : heures de production" value={f.lair.rewardHours} min={0} step={1} onChange={(v) => lair({ rewardHours: num(v) })} />
        <NumberField label="Récompense : bonus de chaque rare" value={f.lair.rare} min={0} step={50} onChange={(v) => lair({ rare: num(v) })} />
        <NumberField label="Récompense : XP" value={f.lair.xp} min={0} step={10} onChange={(v) => lair({ xp: num(v) })} />
        <TextField label="Titre décerné" value={f.lair.title} onChange={(v) => lair({ title: v })} />
      </Section>
    </div>
  );
}
