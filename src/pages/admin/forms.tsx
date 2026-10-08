import { ResourceIcon } from "@/components/ui/game-icon";
import { Button } from "@/components/ui/button";
import {
  getBuildingUpgradeCost,
  getBuildingUpgradeTime,
  storageCapacityAt,
  VISUAL_TIERS,
  type BuildingDef,
  type BuildingEffect,
} from "@/game/buildings";
import { getUnitBuildTime, resolveUnitRoles, UNIT_LEVEL_BONUS_DEFAULT, UNIT_ROLE_IDS, UNIT_ROLE_INFO, unitLevelBonus, type UnitDef } from "@/game/units";
import { getTechCost, getTechTime, RESEARCH_RULES, TECH_GROWTH_BOUNDS, type TechDef } from "@/game/technologies";
import { TechEffectsEditor } from "@/pages/admin/TechEffectsEditor";
import { MISSION_XP_RULES, type MissionDef } from "@/game/missions";
import { currentGameContent } from "@/game/content";
import { formatCost } from "@/game/resources";
import { formatDecimal, formatNumber } from "@/lib/utils";
import type { ReactNode } from "react";
import { HudCallout } from "@/components/ui/hud";
import { costTotal, formatRatio, valueDelta, type ValueDelta } from "@/game/adminPreview";
import type { Resources } from "@/types/game";
import {
  CheckboxField,
  formatSeconds,
  ImageField,
  KeyNumberMapField,
  NumberField,
  NumberListField,
  RESOURCE_OPTIONS,
  ResourceMapField,
  Section,
  SelectField,
  TextAreaField,
  TextField,
} from "@/pages/admin/fields";

const ID_HINT_NEW = "Lettres, chiffres, _ — non modifiable une fois enregistré.";
const ID_HINT_LOCKED = "Identifiant utilisé dans les données des joueurs : non modifiable.";

function techOptions(withNone = false) {
  const techs = currentGameContent().technologies.map((t) => ({ value: t.id, label: `${t.nom} (${t.id})` }));
  return withNone ? [{ value: "", label: "— Aucune —" }, ...techs] : techs;
}

function unitOptions() {
  return currentGameContent().units.map((u) => ({ value: u.id, label: u.name }));
}

/** 6.14.154 (AA-28) : valeur d'une case d'aperçu ; enregistrée et nouvelle différentes : « avant → après ». */
function BeforeAfter({ before, after }: { before?: string; after: string }) {
  if (before === undefined || before === after) return <>{after}</>;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1">
      <span className="text-slate-500 line-through">{before}</span>
      <span aria-hidden>→</span>
      <span className="text-gold-glow">{after}</span>
    </span>
  );
}

/** 6.14.154 (AA-28) : écart au dernier niveau entre la fiche enregistrée et le brouillon (coût total, durée). */
function DeltaSummary({ cost, time, level }: { cost: ValueDelta; time: ValueDelta; level: number }) {
  if (cost.ratio === 1 && time.ratio === 1) return null;
  const alert = cost.alert || time.alert;
  return (
    <HudCallout tone={alert ? "ember" : "neutral"} className="mt-2 text-xs">
      Par rapport à la version enregistrée, au niveau <span className="font-mono tabular-nums">{level}</span> : coût{" "}
      <span className="font-mono tabular-nums">{formatRatio(cost.ratio)}</span>, durée <span className="font-mono tabular-nums">{formatRatio(time.ratio)}</span>.
      {alert ? " Écart de plus de ×2 : vérifie avant d'enregistrer." : ""}
    </HudCallout>
  );
}

function PreviewTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto border border-white/5">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/5 text-slate-400">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-2 py-1 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tabular-mono text-slate-300">
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/5">
              {r.map((c, j) => (
                <td key={j} className="px-2 py-1">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Bâtiments ---------------- */

/** 6.14.122 (AP-L8) : date du jour (AAAA-MM-JJ) : un contenu créé dans l'admin est « nouveau » (épisode « nouveauté »). */
const today = () => new Date().toISOString().slice(0, 10);
const ADDED_ON_HINT = "AAAA-MM-JJ. Un contenu ajouté depuis peu prend l'épisode « nouveauté » du chapitre suivant des Chroniques (Règles → Épisode « nouveauté »). Vide : jamais mis en avant.";

/** Champ « Ajouté le » : vide = champ retiré (JSON pur, jamais undefined). */
function AddedOnField<T extends { addedOn?: string }>({ value, onChange }: { value: T; onChange: (v: T) => void }) {
  return (
    <TextField
      label="Ajouté le (épisode « nouveauté »)"
      value={value.addedOn ?? ""}
      hint={ADDED_ON_HINT}
      onChange={(v) => {
        const next: T = { ...value };
        const at = v.trim();
        if (at) next.addedOn = at;
        else delete next.addedOn;
        onChange(next);
      }}
    />
  );
}

export function newBuilding(): BuildingDef {
  return {
    id: "nouveau_batiment",
    name: "Nouveau bâtiment",
    description: "",
    image: "",
    maxLevel: 10,
    unlockCost: { scrap: 500 },
    upgrade: { baseCost: { scrap: 100, energy: 50 }, maxCost: { scrap: 1_000_000, energy: 500_000 }, costFromLevel: 1, secondsPerLevel: 600 },
    addedOn: today(),
  };
}

export function BuildingForm({ value: b, onChange, isNew, saved }: { value: BuildingDef; onChange: (b: BuildingDef) => void; isNew: boolean; saved?: BuildingDef }) {
  const set = (patch: Partial<BuildingDef>) => onChange({ ...b, ...patch });
  const effectType = b.effect?.type ?? "";
  return (
    <div className="flex flex-col gap-3">
      <Section title="Identité">
        <TextField label="Identifiant" value={b.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(id) => set({ id })} />
        <TextField label="Nom" value={b.name} onChange={(name) => set({ name })} />
        <TextAreaField label="Description" value={b.description} onChange={(description) => set({ description })} />
        <ImageField label="Image" value={b.image} onChange={(image) => set({ image })} />
        <AddedOnField value={b} onChange={onChange} />
      </Section>

      <Section title="Déblocage">
        <CheckboxField label="Débloqué dès l'inscription" checked={!!b.startsUnlocked} onChange={(startsUnlocked) => set({ startsUnlocked })} />
        <SelectField
          label="Débloqué par une technologie"
          value={b.unlockedByTech ?? ""}
          options={techOptions(true)}
          hint="La techno doit avoir l'effet « unlock_buildings »."
          onChange={(t) => set({ unlockedByTech: t || undefined })}
        />
        <ResourceMapField
          label="Coût de déblocage"
          value={b.unlockCost}
          hint="Laisser vide si débloqué d'office ou par une technologie."
          onChange={(unlockCost) => set({ unlockCost: Object.keys(unlockCost).length ? unlockCost : undefined })}
        />
      </Section>

      <Section title="Amélioration">
        <NumberField label="Niveau max" value={b.maxLevel} min={1} step={1} onChange={(v) => set({ maxLevel: Math.max(1, Math.round(v ?? 1)) })} />
        <NumberField
          label="Durée par niveau (s)"
          value={b.upgrade.secondsPerLevel}
          min={0}
          hint={`Niveau 2 : ${formatSeconds(getBuildingUpgradeTime(b, 2))}, puis ×2 environ par niveau jusqu'au dernier niveau du premier palier, qui dure (niveau − 1) × cette durée (Règles → « Bâtiments : durée des premiers niveaux »).`}
          onChange={(v) => set({ upgrade: { ...b.upgrade, secondsPerLevel: v ?? 0 } })}
        />
        <ResourceMapField label="Coût au premier niveau payant" value={b.upgrade.baseCost} onChange={(baseCost) => set({ upgrade: { ...b.upgrade, baseCost } })} />
        <ResourceMapField
          label={b.upgrade.tier2 ? `Coût au niveau ${b.upgrade.tier2.fromLevel - 1} (fin du 1er palier)` : "Coût au niveau max"}
          value={b.upgrade.maxCost}
          hint="Entre les deux, progression géométrique."
          onChange={(maxCost) => set({ upgrade: { ...b.upgrade, maxCost } })}
        />
        <NumberField
          label="Premier niveau payant"
          value={b.upgrade.costFromLevel}
          min={1}
          step={1}
          hint="Niveau auquel s'applique le coût initial (1 en général)."
          onChange={(v) => set({ upgrade: { ...b.upgrade, costFromLevel: Math.max(1, Math.round(v ?? 1)) } })}
        />
      </Section>

      <Section title="Second palier (hauts niveaux)">
        <CheckboxField
          label="Coûts et durées séparés pour les hauts niveaux"
          checked={!!b.upgrade.tier2}
          hint="Permet d'ajouter des niveaux sans changer le coût des niveaux déjà atteints par les joueurs."
          onChange={(on) =>
            set({
              upgrade: {
                ...b.upgrade,
                tier2: on
                  ? { fromLevel: Math.min(b.maxLevel, 11), baseCost: { ...b.upgrade.maxCost }, maxCost: { ...b.upgrade.maxCost }, baseSeconds: 3 * 3600, secondsPerLevel: 3600 }
                  : undefined,
              },
            })
          }
        />
        {b.upgrade.tier2 && (
          <>
            <NumberField
              label="À partir du niveau"
              value={b.upgrade.tier2.fromLevel}
              min={2}
              step={1}
              onChange={(v) => set({ upgrade: { ...b.upgrade, tier2: { ...b.upgrade.tier2!, fromLevel: Math.max(2, Math.round(v ?? 2)) } } })}
            />
            <NumberField
              label="Durée du premier niveau du palier (s)"
              value={b.upgrade.tier2.baseSeconds}
              min={0}
              hint={formatSeconds(b.upgrade.tier2.baseSeconds)}
              onChange={(v) => set({ upgrade: { ...b.upgrade, tier2: { ...b.upgrade.tier2!, baseSeconds: v ?? 0 } } })}
            />
            <NumberField
              label="Durée ajoutée par niveau (s)"
              value={b.upgrade.tier2.secondsPerLevel}
              min={0}
              hint={formatSeconds(b.upgrade.tier2.secondsPerLevel)}
              onChange={(v) => set({ upgrade: { ...b.upgrade, tier2: { ...b.upgrade.tier2!, secondsPerLevel: v ?? 0 } } })}
            />
            <ResourceMapField
              label="Coût au premier niveau du palier"
              value={b.upgrade.tier2.baseCost}
              hint="Ajoute des ressources rares pour en faire un puits."
              onChange={(baseCost) => set({ upgrade: { ...b.upgrade, tier2: { ...b.upgrade.tier2!, baseCost } } })}
            />
            <ResourceMapField
              label="Coût au niveau max"
              value={b.upgrade.tier2.maxCost}
              onChange={(maxCost) => set({ upgrade: { ...b.upgrade, tier2: { ...b.upgrade.tier2!, maxCost } } })}
            />
          </>
        )}
      </Section>

      <Section title="Images par palier (facultatif)">
        {VISUAL_TIERS.map((tier) => (
          <ImageField
            key={tier}
            label={`À partir du niveau ${tier}`}
            value={b.tierImages?.[tier] ?? ""}
            onChange={(img) => {
              const tierImages = { ...(b.tierImages ?? {}) };
              if (img) tierImages[tier] = img;
              else delete tierImages[tier];
              set({ tierImages: Object.keys(tierImages).length ? tierImages : undefined });
            }}
          />
        ))}
      </Section>

      <Section title="Production">
        <CheckboxField
          label="Produit une ressource"
          checked={!!b.production}
          onChange={(on) => set({ production: on ? { resource: "scrap", perSecond: [2, 4, 7, 13, 23, 42, 75, 135, 259, 500] } : undefined })}
        />
        {b.production && (
          <>
            <SelectField
              label="Ressource produite"
              value={b.production.resource}
              options={RESOURCE_OPTIONS}
              onChange={(resource) => set({ production: { ...b.production!, resource: resource as keyof Resources } })}
            />
            <NumberListField
              label="Production par seconde, par niveau"
              value={b.production.perSecond}
              hint="Ex. 2, 4, 7… (premier nombre = niveau 1)."
              onChange={(perSecond) => set({ production: { ...b.production!, perSecond } })}
            />
          </>
        )}
      </Section>

      <Section title="Effet spécial">
        <SelectField
          label="Effet"
          value={effectType}
          options={[
            { value: "", label: "Aucun" },
            { value: "repair", label: "Réparation après combat" },
            { value: "hangar", label: "Capacité de hangar" },
            { value: "storage", label: "Entrepôt (stockage)" },
            { value: "dock", label: "Cale sèche (postes de réparation)" },
          ]}
          onChange={(t) =>
            set({
              effect:
                t === "repair"
                  ? { type: "repair", perLevel: 0.05, max: 0.5 }
                  : t === "hangar"
                    ? { type: "hangar", category: "attack", perLevel: 2000 }
                    : t === "storage"
                      ? { type: "storage", base: 2_000_000, growth: 1.6 }
                      : t === "dock"
                        ? { type: "dock", perLevel: 1000, orbitalRepair: 0.05 }
                        : undefined,
            })
          }
        />
        {b.effect?.type === "repair" && (
          <>
            <NumberField
              label="Réparation par niveau (0,05 = 5 %)"
              value={b.effect.perLevel}
              step={0.01}
              onChange={(v) => set({ effect: { ...(b.effect as Extract<BuildingEffect, { type: "repair" }>), perLevel: v ?? 0 } })}
            />
            <NumberField
              label="Réparation maximale (0,5 = 50 %)"
              value={b.effect.max}
              step={0.05}
              onChange={(v) => set({ effect: { ...(b.effect as Extract<BuildingEffect, { type: "repair" }>), max: v ?? 0 } })}
            />
            <NumberField
              label="À partir du niveau (réparation réduite)"
              value={b.effect.bonusFromLevel}
              optional
              step={1}
              hint="Laisser vide : même réparation à tous les niveaux."
              onChange={(v) => set({ effect: { ...(b.effect as Extract<BuildingEffect, { type: "repair" }>), bonusFromLevel: v } })}
            />
            <NumberField
              label="…réparation par niveau ensuite (0,02 = 2 %)"
              value={b.effect.bonusPerLevel}
              optional
              step={0.01}
              onChange={(v) => set({ effect: { ...(b.effect as Extract<BuildingEffect, { type: "repair" }>), bonusPerLevel: v } })}
            />
          </>
        )}
        {b.effect?.type === "storage" && (
          <>
            <NumberField
              label="Capacité de base"
              value={b.effect.base}
              min={1}
              step={100000}
              hint="Capacité = base × croissance^niveau, par ressource commune."
              onChange={(v) => set({ effect: { ...(b.effect as Extract<BuildingEffect, { type: "storage" }>), base: v ?? 0 } })}
            />
            <NumberField
              label="Croissance par niveau (1,6 = +60 %)"
              value={b.effect.growth}
              min={1}
              step={0.05}
              onChange={(v) => set({ effect: { ...(b.effect as Extract<BuildingEffect, { type: "storage" }>), growth: v ?? 1 } })}
            />
          </>
        )}
        {b.effect?.type === "hangar" && (
          <>
            <SelectField
              label="Unités stockées"
              value={b.effect.category}
              options={[
                { value: "attack", label: "Attaque" },
                { value: "defense", label: "Défense" },
              ]}
              onChange={(category) => set({ effect: { ...(b.effect as Extract<BuildingEffect, { type: "hangar" }>), category } })}
            />
            <NumberField
              label="Places par niveau"
              value={b.effect.perLevel}
              min={0}
              step={1}
              onChange={(v) => set({ effect: { ...(b.effect as Extract<BuildingEffect, { type: "hangar" }>), perLevel: v ?? 0 } })}
            />
          </>
        )}
        {b.effect?.type === "dock" && (
          <>
            <NumberField
              label="Postes par niveau (places de hangar)"
              value={b.effect.perLevel}
              min={0}
              step={100}
              hint="Les vaisseaux sauvés y attendent leur réparation, hors du hangar. Paliers : Triage 5, remise automatique 10, priorités 15, Cale orbitale 20."
              onChange={(v) => set({ effect: { ...(b.effect as Extract<BuildingEffect, { type: "dock" }>), perLevel: v ?? 0 } })}
            />
            <NumberField
              label="Cale orbitale (palier 20) : vaisseaux sauvés en plus (0,05 = +5 points)"
              value={b.effect.orbitalRepair ?? 0}
              min={0}
              step={0.01}
              onChange={(v) => set({ effect: { ...(b.effect as Extract<BuildingEffect, { type: "dock" }>), orbitalRepair: v ?? 0 } })}
            />
          </>
        )}
      </Section>

      <div>
        <p className="mb-1 text-xs font-semibold text-slate-400">Aperçu par niveau</p>
        <PreviewTable
          headers={["Niveau", "Coût", "Durée", ...(b.production ? ["Production/s"] : []), ...(b.effect?.type === "storage" ? ["Capacité"] : [])]}
          rows={Array.from({ length: b.maxLevel }, (_, i) => i + 1).map((lvl) => [
            lvl,
            lvl === 1 ? "—" : <BeforeAfter before={saved && lvl <= saved.maxLevel ? formatCost(getBuildingUpgradeCost(saved, lvl) as Partial<Resources>) || "gratuit" : undefined} after={formatCost(getBuildingUpgradeCost(b, lvl) as Partial<Resources>) || "gratuit"} />,
            lvl === 1 ? "—" : <BeforeAfter before={saved && lvl <= saved.maxLevel ? formatSeconds(getBuildingUpgradeTime(saved, lvl)) : undefined} after={formatSeconds(getBuildingUpgradeTime(b, lvl))} />,
            ...(b.production ? [b.production.perSecond[lvl - 1] ?? "?"] : []),
            ...(b.effect?.type === "storage" ? [formatNumber(storageCapacityAt(b.effect, lvl))] : []),
          ])}
        />
        {saved && saved.maxLevel >= 2 && b.maxLevel >= 2 && (
          <DeltaSummary
            level={Math.min(saved.maxLevel, b.maxLevel)}
            cost={valueDelta(costTotal(getBuildingUpgradeCost(saved, Math.min(saved.maxLevel, b.maxLevel))), costTotal(getBuildingUpgradeCost(b, Math.min(saved.maxLevel, b.maxLevel))))}
            time={valueDelta(getBuildingUpgradeTime(saved, Math.min(saved.maxLevel, b.maxLevel)), getBuildingUpgradeTime(b, Math.min(saved.maxLevel, b.maxLevel)))}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- Unités ---------------- */

export function newUnit(): UnitDef {
  return {
    id: "nouvelle_unite",
    name: "Nouvelle unité",
    image: "",
    maxLevel: 10,
    description: "",
    cost: { scrap: 1000, energy: 500 },
    stats: { attaque: 50, defense: 10, vitesse: 3, cargo: 0 },
    category: "attack",
    hangarSpace: 1,
    unlockTech: currentGameContent().technologies[0]?.id ?? "",
    addedOn: today(),
  };
}

export function UnitForm({ value: u, onChange, isNew, saved }: { value: UnitDef; onChange: (u: UnitDef) => void; isNew: boolean; saved?: UnitDef }) {
  const set = (patch: Partial<UnitDef>) => onChange({ ...u, ...patch });
  const setStat = (key: keyof UnitDef["stats"], v: number | undefined) => set({ stats: { ...u.stats, [key]: v ?? 0 } });
  // Puissance au niveau max (gain par niveau compris), pour comparer les unités.
  const lv = (u.maxLevel - 1) * unitLevelBonus(u);
  const power = u.category === "attack" ? u.stats.attaque + lv : u.stats.attaque + u.stats.defense + 2 * lv;
  const price = (u.cost.scrap ?? 0) + (u.cost.energy ?? 0);

  return (
    <div className="flex flex-col gap-3">
      <Section title="Identité">
        <TextField label="Identifiant" value={u.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(id) => set({ id })} />
        <TextField label="Nom" value={u.name} onChange={(name) => set({ name })} />
        <TextAreaField label="Description" value={u.description} onChange={(description) => set({ description })} />
        <ImageField label="Image" value={u.image} onChange={(image) => set({ image })} />
        <AddedOnField value={u} onChange={onChange} />
      </Section>

      <Section title="Rôle">
        <SelectField
          label="Catégorie"
          value={u.category}
          options={[
            { value: "attack", label: "Attaque (envoyée en combat)" },
            { value: "defense", label: "Défense (protège la base)" },
          ]}
          onChange={(category) => set({ category })}
        />
        <SelectField label="Technologie de déblocage" value={u.unlockTech} options={techOptions()} onChange={(unlockTech) => set({ unlockTech })} hint="Le niveau de la techno = niveau de l'unité." />
        <NumberField label="Niveau max" value={u.maxLevel} min={1} step={1} onChange={(v) => set({ maxLevel: Math.max(1, Math.round(v ?? 1)) })} />
        <NumberField label="Places de hangar" value={u.hangarSpace} min={1} step={1} onChange={(v) => set({ hangarSpace: Math.max(1, Math.round(v ?? 1)) })} />
        {/* 6.14.123 (AA5) : rôles lus par le jeu à la place des identifiants (sonde, recycleur, soutien, faiblesse de boss…). */}
        <p className="text-xs text-slate-500 sm:col-span-2">Rôles : ce que l'unité fait en plus de combattre. Une unité ajoutée n'en a aucun ; une unité livrée garde les siens tant que tu n'y touches pas.</p>
        {UNIT_ROLE_IDS.map((role) => {
          const roles = resolveUnitRoles(u);
          return (
            <CheckboxField
              key={role}
              label={UNIT_ROLE_INFO[role].label}
              hint={UNIT_ROLE_INFO[role].hint}
              checked={roles.includes(role)}
              onChange={(on) => set({ roles: on ? [...roles, role] : roles.filter((r) => r !== role) })}
            />
          );
        })}
      </Section>

      <Section title="Statistiques (niveau 1)">
        <NumberField
          label="Gain par niveau (attaque et défense)"
          value={u.levelBonus}
          optional
          min={0}
          step={5}
          hint={`Vide = +${UNIT_LEVEL_BONUS_DEFAULT}. Au niveau ${u.maxLevel} : ${formatNumber(u.stats.attaque + (u.maxLevel - 1) * unitLevelBonus(u))} ATK.`}
          onChange={(levelBonus) => set({ levelBonus })}
        />
        <NumberField label="Attaque" value={u.stats.attaque} min={0} onChange={(v) => setStat("attaque", v)} />
        <NumberField label="Défense" value={u.stats.defense} min={0} onChange={(v) => setStat("defense", v)} hint="Compte en défense uniquement (ATK + DEF)." />
        <NumberField label="Vitesse" value={u.stats.vitesse} min={0} onChange={(v) => setStat("vitesse", v)} />
        <NumberField label="Cargaison" value={u.stats.cargo} min={0} onChange={(v) => setStat("cargo", v)} />
      </Section>

      <Section title="Coût">
        <NumberField label="Ferraille" value={u.cost.scrap} min={0} onChange={(v) => set({ cost: { ...u.cost, scrap: v ?? 0 } })} />
        <NumberField label="Énergie" value={u.cost.energy} min={0} onChange={(v) => set({ cost: { ...u.cost, energy: v ?? 0 } })} />
        {/* 6.14.123 (AA5, AA-17) : une unité de fin de partie peut coûter une ressource rare. */}
        <KeyNumberMapField
          label="Autres ressources"
          value={Object.fromEntries(Object.entries(u.cost).filter(([r]) => r !== "scrap" && r !== "energy")) as Record<string, number>}
          options={RESOURCE_OPTIONS.filter((o) => o.value !== "scrap" && o.value !== "energy")}
          hint="Payées à la construction, rendues à moitié à la revente. Le temps de construction par défaut et les débris ne comptent que la ferraille et l'énergie."
          onChange={(extra) => set({ cost: { scrap: u.cost.scrap, energy: u.cost.energy, ...extra } })}
        />
        <NumberField
          label="Temps de construction (s)"
          value={u.buildTime}
          optional
          min={0}
          hint={`Vide = (ferraille + énergie) / 100 → ${formatSeconds(getUnitBuildTime({ ...u, buildTime: undefined }))}`}
          onChange={(buildTime) => set({ buildTime })}
        />
        {/* 6.14.154 (AA-28) : coût et temps enregistrés → nouveaux, avant d'enregistrer. */}
        {saved && (
          <p className="text-xs text-slate-400 sm:col-span-2">
            Coût : <BeforeAfter before={formatCost(saved.cost as Partial<Resources>)} after={formatCost(u.cost as Partial<Resources>)} /> · temps :{" "}
            <BeforeAfter before={formatSeconds(getUnitBuildTime(saved))} after={formatSeconds(getUnitBuildTime(u))} />
          </p>
        )}
        {saved && <DeltaSummary level={1} cost={valueDelta(costTotal(saved.cost), costTotal(u.cost))} time={valueDelta(getUnitBuildTime(saved), getUnitBuildTime(u))} />}
      </Section>

      <div className="grid grid-cols-1 gap-2 border border-white/5 bg-black/10 p-3 text-xs text-slate-300 sm:grid-cols-3">
        <p>
          Puissance {u.category === "attack" ? "d'attaque" : "de défense"} : <strong className="text-slate-100">{formatNumber(power)}</strong>
        </p>
        <p>
          Par place de hangar : <strong className="text-gold-glow">{formatNumber(Math.round(power / Math.max(1, u.hangarSpace)))}</strong>
        </p>
        <p>
          Par 1 000 ressources : <strong className="text-mint-glow">{price > 0 ? formatNumber(Math.round((power / price) * 1000)) : "∞"}</strong>
        </p>
      </div>
    </div>
  );
}

/* ---------------- Technologies ---------------- */

export function newTech(): TechDef {
  return {
    id: "nouvelle_techno",
    nom: "Nouvelle technologie",
    desc: "",
    maxLevel: 10,
    baseCost: { scrap: 500, energy: 200 },
    baseTime: 60,
    effects: [{ type: "unit_attack" }],
    prereq: {},
    addedOn: today(),
  };
}

export function TechForm({ value: t, onChange, isNew, saved }: { value: TechDef; onChange: (t: TechDef) => void; isNew: boolean; saved?: TechDef }) {
  const set = (patch: Partial<TechDef>) => onChange({ ...t, ...patch });
  const prereqOptions = techOptions().filter((o) => o.value !== t.id);
  return (
    <div className="flex flex-col gap-3">
      <Section title="Identité">
        <TextField label="Identifiant" value={t.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(id) => set({ id })} />
        <TextField label="Nom" value={t.nom} onChange={(nom) => set({ nom })} />
        <TextAreaField label="Description" value={t.desc} onChange={(desc) => set({ desc })} />
        {/* 6.14.12 : illustration du Codex (vide = image provisoire commune). */}
        <ImageField label="Image (Codex)" value={t.image ?? ""} onChange={(image) => {
            // JSON pur : un champ vide est retiré, jamais laissé à undefined.
            const next: TechDef = { ...t, image };
            if (!image) delete next.image;
            onChange(next);
          }}
        />
        <AddedOnField value={t} onChange={onChange} />
      </Section>

      <Section title="Niveaux">
        <NumberField label="Niveau max" value={t.maxLevel} min={1} step={1} onChange={(v) => set({ maxLevel: Math.max(1, Math.round(v ?? 1)) })} />
      </Section>

      <fieldset className="hud-cut-sm border border-cyan-glow/10 bg-black/20 p-3">
        <legend className="hud-eyebrow px-1.5 text-[10px] text-cyan-glow/80">Effets octroyés</legend>
        <TechEffectsEditor tech={t} onChange={onChange} />
      </fieldset>

      <Section title="Coût et durée">
        <ResourceMapField label="Coût au niveau 1" value={t.baseCost} onChange={(baseCost) => set({ baseCost })} />
        <NumberField
          label="Ambre par niveau"
          value={t.amberCost}
          optional
          min={0}
          step={1}
          hint="Ambre des Kesh'Vaar payé à chaque niveau, en plus des ressources (montant fixe, vide = aucun). Rendu au prorata si la recherche est annulée."
          onChange={(v) => set({ amberCost: v === undefined || v <= 0 ? undefined : Math.round(v) })}
        />
        <NumberField label="Durée au niveau 1 (s)" value={t.baseTime} min={0} onChange={(v) => set({ baseTime: v ?? 0 })} />
        <NumberField
          label="Croissance du coût par niveau"
          value={t.costGrowth}
          optional
          step={0.05}
          hint={`Multiplicateur par niveau (vide = réglage commun, ${formatDecimal(RESEARCH_RULES.costGrowth)}).`}
          onChange={(costGrowth) => set({ costGrowth })}
        />
        {/* 6.14.154 (AU27, R6, AA-12) : croissance propre de la durée (vide = réglage commun du Labo). */}
        <NumberField
          label="Croissance de la durée par niveau"
          value={t.timeGrowth}
          optional
          min={TECH_GROWTH_BOUNDS.min}
          step={0.05}
          hint={`Multiplicateur par niveau, entre ${TECH_GROWTH_BOUNDS.min} et ${TECH_GROWTH_BOUNDS.max} (vide = réglage commun, ${formatDecimal(RESEARCH_RULES.timeGrowth)}, Règles → Labo).`}
          onChange={(v) => {
            // JSON pur : un champ vidé est retiré, jamais laissé à undefined.
            const next: TechDef = { ...t, timeGrowth: v };
            if (v === undefined) delete next.timeGrowth;
            onChange(next);
          }}
        />
      </Section>

      <Section title="Prérequis">
        <KeyNumberMapField
          label="Technologies requises (niveau minimal)"
          value={t.prereq}
          options={prereqOptions}
          valueLabel="Niveau"
          onChange={(prereq) => set({ prereq })}
        />
        <p className="text-[11px] text-slate-500">
          Une techno qui débloque une unité à plan (Traqueur Kesh) exige en plus, automatiquement, que le joueur ait acheté le plan.
        </p>
      </Section>

      <Section title="Position dans l'arbre du Labo (facultatif)">
        <NumberField
          label="Colonne"
          value={t.treePos?.col}
          optional
          step={1}
          hint="Vide = placement automatique."
          onChange={(col) => set({ treePos: col === undefined ? undefined : { col, row: t.treePos?.row ?? 0 } })}
        />
        <NumberField
          label="Ligne"
          value={t.treePos?.row}
          optional
          step={0.25}
          onChange={(row) => set({ treePos: row === undefined ? undefined : { col: t.treePos?.col ?? 0, row } })}
        />
      </Section>

      <div>
        <p className="mb-1 text-xs font-semibold text-slate-400">Aperçu par niveau</p>
        <PreviewTable
          headers={["Niveau", "Coût", "Durée"]}
          rows={Array.from({ length: Math.min(t.maxLevel, 20) }, (_, i) => i + 1).map((lvl) => [
            lvl,
            <BeforeAfter before={saved && lvl <= saved.maxLevel ? formatCost(getTechCost(saved, lvl) as Partial<Resources>) : undefined} after={formatCost(getTechCost(t, lvl) as Partial<Resources>)} />,
            <BeforeAfter before={saved && lvl <= saved.maxLevel ? formatSeconds(getTechTime(saved, lvl)) : undefined} after={formatSeconds(getTechTime(t, lvl))} />,
          ])}
        />
        {saved && (
          <DeltaSummary
            level={Math.min(saved.maxLevel, t.maxLevel)}
            cost={valueDelta(costTotal(getTechCost(saved, Math.min(saved.maxLevel, t.maxLevel))), costTotal(getTechCost(t, Math.min(saved.maxLevel, t.maxLevel))))}
            time={valueDelta(getTechTime(saved, Math.min(saved.maxLevel, t.maxLevel)), getTechTime(t, Math.min(saved.maxLevel, t.maxLevel)))}
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- Missions ---------------- */

export function newMission(): MissionDef {
  return { key: "nouvelle_mission", name: "Nouvelle mission", duration: 1800, reward: { scrap: 10000, xp: 30 }, prereq: {} };
}

export function MissionForm({ value: m, onChange, isNew }: { value: MissionDef; onChange: (m: MissionDef) => void; isNew: boolean }) {
  const set = (patch: Partial<MissionDef>) => onChange({ ...m, ...patch });
  const { xp = 0, ...resources } = m.reward;
  const suggestedXp = Math.max(1, Math.round((m.duration / 3600) * MISSION_XP_RULES.perHour));
  const perHour = (v: number) => formatNumber(Math.round((v * 3600) / Math.max(1, m.duration)));
  return (
    <div className="flex flex-col gap-3">
      <Section title="Identité">
        <TextField label="Identifiant" value={m.key} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(key) => set({ key })} />
        <TextField label="Nom" value={m.name} onChange={(name) => set({ name })} />
        <NumberField
          label="Durée (s)"
          value={m.duration}
          min={1}
          step={1}
          hint={formatSeconds(m.duration)}
          onChange={(v) => set({ duration: Math.max(1, Math.round(v ?? 1)) })}
        />
      </Section>

      <Section title="Récompense">
        <ResourceMapField label="Ressources" value={resources} onChange={(res) => set({ reward: { ...res, xp } })} />
        <NumberField label="XP" value={xp} min={0} step={1} onChange={(v) => set({ reward: { ...resources, xp: v ?? 0 } })} />
        <div className="flex items-end">
          <Button variant="outline" size="sm" type="button" onClick={() => set({ reward: { ...resources, xp: suggestedXp } })}>
            Appliquer {suggestedXp} XP ({MISSION_XP_RULES.perHour} XP/h)
          </Button>
        </div>
      </Section>

      <Section title="Unités requises">
        <KeyNumberMapField label="Unités (quantité minimale possédée)" value={m.prereq} options={unitOptions()} onChange={(prereq) => set({ prereq })} />
      </Section>

      <div className="border border-white/5 bg-black/10 p-3 text-xs text-slate-300">
        Rentabilité si relancée en boucle :{" "}
        {Object.entries(resources).map(([res, v]) => (
          <span key={res} className="mr-3">
            <ResourceIcon id={res} /> {RESOURCE_OPTIONS.find((o) => o.value === res)?.label ?? res} <strong>{perHour(v)}</strong>/h
          </span>
        ))}
        <span>
          XP <strong>{perHour(xp)}</strong>/h
        </span>
      </div>
    </div>
  );
}
