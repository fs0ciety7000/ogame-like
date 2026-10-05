import { useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { assetUrl } from "@/lib/assets";
import { currentGameContent } from "@/game/content";
import { describeRelic, RARITIES, RELIC_EFFECT_LABELS, validateRelics, type RelicEffect, type RelicRarity, type RelicSettings, type RelicTemplate } from "@/game/relics";
import { DEFAULT_LOOT_TOKEN_CAP, defaultLootTables, LOOT_SOURCE_LABELS, LOOT_SOURCES, validateLootTables, type LootSource, type LootTable, type LootTables } from "@/game/loot";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import { CheckboxField, ImageField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";
import { ComposedEffectFields } from "@/pages/admin/ComposedEffectFields";

/* v5.9 : reliques dans l'administration — modèles (nom, effet, image,
   rareté réservée) et réglages (bonus par rareté, tirage, recyclage,
   emplacements, fusion). Les bonus viennent de la rareté : une relique
   rare donne le même pourcentage quel que soit son effet. */

const ID_HINT_NEW = "Minuscules, chiffres, _ — non modifiable une fois enregistrée.";
const ID_HINT_LOCKED = "Identifiant de la relique : non modifiable (les joueurs qui la possèdent y sont liés).";

const EFFECT_OPTIONS = (Object.keys(RELIC_EFFECT_LABELS) as RelicEffect[]).map((value) => ({ value, label: RELIC_EFFECT_LABELS[value] }));

type Reserved = "none" | "legendary" | "mythic";

export function newRelic(): RelicTemplate {
  return { id: "nouvelle_relique", name: "Nouvelle relique", effect: "attack", lore: "", image: "/assets/relics/engrenage_varan.webp" };
}

export function relicListLabel(t: RelicTemplate): string {
  const tag = t.mythicOnly ? " · mythique" : t.legendaryOnly ? " · légendaire" : "";
  return `${t.name}${tag}${t.disabled ? " (inactive)" : ""}`;
}

/** Fiche d'une relique. */
export function RelicForm({ value: t, onChange, isNew }: { value: RelicTemplate; onChange: (next: RelicTemplate) => void; isNew: boolean }) {
  const set = (patch: Partial<RelicTemplate>) => onChange({ ...t, ...patch });
  const reserved: Reserved = t.mythicOnly ? "mythic" : t.legendaryOnly ? "legendary" : "none";
  const setReserved = (v: Reserved) => set({ legendaryOnly: v === "legendary" || undefined, mythicOnly: v === "mythic" || undefined });
  const shownRarities: RelicRarity[] = reserved === "mythic" ? ["mythic"] : reserved === "legendary" ? ["legendary"] : ["common", "rare", "epic", "legendary"];
  return (
    <div className="flex flex-col gap-3">
      <Section title="Relique">
        <TextField label="Identifiant" value={t.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(id) => set({ id })} />
        <TextField label="Nom" value={t.name} onChange={(name) => set({ name })} />
        <SelectField label="Effet" value={t.effect} options={EFFECT_OPTIONS} onChange={(effect) => set({ effect, ...(effect === "custom" && !t.custom ? { custom: { stat: "unitAttack" } } : {}) })} hint="La force de l'effet dépend de la rareté (réglages en bas de page)." />
        {t.effect === "custom" && (
          <>
            <ComposedEffectFields value={t.custom ?? {}} onChange={(c) => set({ custom: { ...c, ...(t.custom?.scale !== undefined ? { scale: t.custom.scale } : {}) } })} onPreset={(p) => set({ custom: { ...p.effect, scale: p.suggest.relic }, ...(t.name === "Nouvelle relique" ? { name: p.name } : {}) })} />
            <NumberField
              label="Multiplicateur du bonus de rareté"
              value={t.custom?.scale ?? 1}
              min={0.1}
              step={0.1}
              onChange={(scale) => set({ custom: { ...(t.custom ?? { stat: "unitAttack" }), scale } })}
              hint="1 : bonus de rareté tel quel (+6 % en rare). 2 : le double. Pour un niveau d'espionnage, 10 ≈ +0,6 niveau en rare."
            />
          </>
        )}
        <SelectField<Reserved>
          label="Rareté"
          value={reserved}
          options={[
            { value: "none", label: "Toutes (commune → légendaire)" },
            { value: "legendary", label: "Réservée aux légendaires" },
            { value: "mythic", label: "Mythique (une par saison)" },
          ]}
          onChange={setReserved}
          hint="Mythique : remise au n° 1 d'un boss mondial ou du boss de saison, en rotation avec les autres mythiques."
        />
        <div className="sm:col-span-2">
          <TextAreaField label="Texte d'ambiance" value={t.lore} rows={2} onChange={(lore) => set({ lore })} />
        </div>
        <div className="sm:col-span-2">
          <ImageField label="Image" value={t.image ?? `/assets/relics/${t.id}.webp`} onChange={(image) => set({ image })} />
        </div>
        <CheckboxField
          label="Inactive"
          checked={!!t.disabled}
          onChange={(disabled) => set({ disabled: disabled || undefined })}
          hint="Plus tirée ni remise. Les exemplaires déjà trouvés gardent leur effet."
        />
      </Section>
      <Section title="Aperçu en jeu">
        <div className="flex items-center gap-3 sm:col-span-2">
          <img src={assetUrl(t.image || `/assets/relics/${t.id}.webp`)} alt="" className="h-14 w-14 shrink-0 border border-white/10 bg-black/30 object-contain p-1" />
          <ul className="text-xs text-slate-300">
            {shownRarities.map((r) => (
              <li key={r}>
                <span style={{ color: RARITIES.find((x) => x.id === r)?.color }}>{RARITIES.find((x) => x.id === r)?.label}</span> : {describeRelic({ template: t.id, rarity: r }) || "—"}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[11px] text-slate-500 sm:col-span-2">L'aperçu utilise les réglages enregistrés ; enregistre la relique pour voir son nouvel effet.</p>
      </Section>
    </div>
  );
}

/** Réglages communs : bonus et poids de chaque rareté, emplacements, fusion, expéditions. */
export function RelicSettingsCard() {
  const customized = useContentStore((s) => s.customized.includes("relicSettings"));
  const [settings, setSettings] = useState<RelicSettings>(() => currentGameContent().relicSettings);
  const [busy, setBusy] = useState(false);
  const errors = [...validateRelics(currentGameContent().relics, settings).filter((e) => !e.startsWith("Relique ")), ...validateLootTables(settings.loot as Partial<LootTables> | undefined)];
  const set = (patch: Partial<RelicSettings>) => setSettings((s) => ({ ...s, ...patch }));
  const setRarity = (id: RelicRarity, patch: Partial<RelicSettings["rarities"][RelicRarity]>) =>
    setSettings((s) => ({ ...s, rarities: { ...s.rarities, [id]: { ...s.rarities[id], ...patch } } }));
  const totalWeight = RARITIES.filter((r) => r.id !== "mythic").reduce((a, r) => a + (settings.rarities[r.id]?.weight ?? 0), 0) || 1;

  const save = async () => {
    if (errors.length > 0) return toast.error("Corrige les erreurs avant d'enregistrer.");
    setBusy(true);
    try {
      await saveContentSection("relicSettings", settings);
      toast.success("Réglages des reliques enregistrés (appliqués aussi par le serveur).");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-sm text-slate-100">Réglages des reliques</h3>
        <Badge variant={customized ? "warning" : "default"}>{customized ? "Personnalisé" : "Valeurs du code"}</Badge>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || !customized}
            onClick={async () => {
              await resetContentSection("relicSettings");
              setSettings(currentGameContent().relicSettings);
              toast.success("Réglages par défaut restaurés.");
            }}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Valeurs par défaut
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-danger-glow">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500">
              <th className="py-1 pr-2 font-normal">Rareté</th>
              <th className="py-1 pr-2 font-normal">Bonus (0,06 = 6 %)</th>
              <th className="py-1 pr-2 font-normal">Poids de tirage</th>
              <th className="py-1 pr-2 font-normal">Recyclage (ambre)</th>
            </tr>
          </thead>
          <tbody>
            {RARITIES.map((r) => {
              const v = settings.rarities[r.id];
              return (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="py-1.5 pr-2" style={{ color: r.color }}>
                    {r.label}
                  </td>
                  <td className="py-1.5 pr-2">
                    <NumInput value={v.pct} step={0.01} onChange={(pct) => setRarity(r.id, { pct })} />
                  </td>
                  <td className="py-1.5 pr-2">
                    {r.id === "mythic" ? (
                      <span className="text-xs text-slate-500">jamais tirée (remise)</span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <NumInput value={v.weight} step={1} onChange={(weight) => setRarity(r.id, { weight })} />
                        <span className="text-xs text-slate-500">{Math.round(((v.weight ?? 0) / totalWeight) * 1000) / 10} %</span>
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 pr-2">
                    {r.id === "mythic" ? <span className="text-xs text-slate-500">non recyclable</span> : <NumInput value={v.recycle} step={1} onChange={(recycle) => setRarity(r.id, { recycle })} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-1 text-[11px] text-slate-500">
          Le poids donne la chance de chaque rareté lors d'un tirage. Une source « rare au moins » (boss mondiaux, proie d'élite…) ne tire que parmi les raretés égales ou supérieures.
        </p>
      </div>

      <Section title="Règles">
        <NumberField label="Emplacements équipés" value={settings.slots} min={1} step={1} onChange={(v) => set({ slots: Math.round(v ?? 1) })} />
        <NumberField
          label="Emplacement bonus à partir de l'Ascension n°"
          value={settings.extraSlotAscensions}
          min={0}
          step={1}
          onChange={(v) => set({ extraSlotAscensions: Math.round(v ?? 1) })}
        />
        <NumberField label="Taille de l'inventaire" value={settings.maxItems} min={1} step={1} onChange={(v) => set({ maxItems: Math.round(v ?? 1) })} />
        <NumberField label="Reliques identiques pour une fusion" value={settings.fuseCount} min={2} step={1} onChange={(v) => set({ fuseCount: Math.round(v ?? 3) })} />
        <NumberField
          label="Chance en expédition à 2 h (0,05 = 5 %)"
          value={settings.expeditionBase}
          min={0}
          step={0.01}
          onChange={(v) => set({ expeditionBase: v ?? 0 })}
        />
        <NumberField
          label="Chance en plus par heure au-delà de 2 h"
          value={Math.round(settings.expeditionPerHour * 10000) / 10000}
          min={0}
          step={0.005}
          hint={`À 8 h : ${Math.round(Math.min(settings.expeditionMax, settings.expeditionBase + 6 * settings.expeditionPerHour) * 1000) / 10} %.`}
          onChange={(v) => set({ expeditionPerHour: v ?? 0 })}
        />
        <NumberField label="Chance maximale en expédition (0,15 = 15 %)" value={settings.expeditionMax} min={0} step={0.01} onChange={(v) => set({ expeditionMax: v ?? 0 })} />
        <NumberField
          label="Plafond hebdo de jetons gagnés en combat (0 = sans plafond)"
          value={settings.lootTokenCap ?? DEFAULT_LOOT_TOKEN_CAP}
          min={0}
          step={5}
          onChange={(v) => set({ lootTokenCap: Math.max(0, Math.round(v ?? 0)) })}
        />
      </Section>

      <LootTablesEditor value={settings.loot as Partial<LootTables> | undefined} onChange={(loot) => set({ loot: loot as RelicSettings["loot"] })} />
    </Card>
  );
}

/** v5.14 : tables de butin des combats (en plus des récompenses habituelles). */
function LootTablesEditor({ value, onChange }: { value: Partial<LootTables> | undefined; onChange: (v: Partial<LootTables>) => void }) {
  const d = defaultLootTables();
  const row = (src: LootSource): LootTable => ({ ...d[src], ...(value?.[src] ?? {}) });
  const setRow = (src: LootSource, patch: Partial<LootTable>) => onChange({ ...(value ?? {}), [src]: { ...row(src), ...patch } });
  const rarityOptions = RARITIES.filter((r) => r.id !== "mythic").map((r) => ({ value: r.id, label: r.label }));
  return (
    <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
      <h4 className="font-display text-sm text-slate-100">Tables de butin des combats</h4>
      <p className="text-[11px] text-slate-500">En plus des récompenses habituelles. Chances en fraction (0,25 = 25 %). Sur un boss, le podium multiplie ses chances par le bonus indiqué. Jetons du casino : chance multipliée par la difficulté du combat (×0,5 à ×2 selon le rapport des forces ; vendetta forte ×1,5 ; expédition selon sa durée).</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-slate-500">
              <th className="py-1 pr-2 font-normal">Source</th>
              <th className="py-1 pr-2 font-normal">Relique</th>
              <th className="py-1 pr-2 font-normal">Rareté min.</th>
              <th className="py-1 pr-2 font-normal">Capsule</th>
              <th className="py-1 pr-2 font-normal">Niv. min</th>
              <th className="py-1 pr-2 font-normal">Niv. max</th>
              <th className="py-1 pr-2 font-normal">Podium ×</th>
              <th className="py-1 pr-2 font-normal">Jetons</th>
              <th className="py-1 pr-2 font-normal">Jetons min</th>
              <th className="py-1 pr-2 font-normal">Jetons max</th>
            </tr>
          </thead>
          <tbody>
            {LOOT_SOURCES.map((src) => {
              const t = row(src);
              return (
                <tr key={src} className="border-t border-white/5">
                  <td className="py-1.5 pr-2 text-slate-300">{LOOT_SOURCE_LABELS[src]}</td>
                  <td className="py-1.5 pr-2">
                    <NumInput value={t.relicChance} step={0.01} onChange={(relicChance) => setRow(src, { relicChance })} />
                  </td>
                  <td className="py-1.5 pr-2">
                    <select value={t.relicMinRarity} onChange={(e) => setRow(src, { relicMinRarity: e.target.value as RelicRarity })} className="h-8 border border-white/10 bg-black/30 px-2 text-sm text-slate-100">
                      {rarityOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1.5 pr-2">
                    <NumInput value={t.capsuleChance} step={0.01} onChange={(capsuleChance) => setRow(src, { capsuleChance })} />
                  </td>
                  <td className="py-1.5 pr-2">
                    <NumInput value={t.capsuleMin} step={1} onChange={(capsuleMin) => setRow(src, { capsuleMin: Math.round(capsuleMin) })} />
                  </td>
                  <td className="py-1.5 pr-2">
                    <NumInput value={t.capsuleMax} step={1} onChange={(capsuleMax) => setRow(src, { capsuleMax: Math.round(capsuleMax) })} />
                  </td>
                  <td className="py-1.5 pr-2">
                    <NumInput value={t.podiumMult} step={0.1} onChange={(podiumMult) => setRow(src, { podiumMult })} />
                  </td>
                  <td className="py-1.5 pr-2">
                    <NumInput value={t.tokenChance ?? 0} step={0.01} onChange={(tokenChance) => setRow(src, { tokenChance })} />
                  </td>
                  <td className="py-1.5 pr-2">
                    <NumInput value={t.tokenMin ?? 1} step={1} onChange={(tokenMin) => setRow(src, { tokenMin: Math.round(tokenMin) })} />
                  </td>
                  <td className="py-1.5 pr-2">
                    <NumInput value={t.tokenMax ?? 1} step={1} onChange={(tokenMax) => setRow(src, { tokenMax: Math.round(tokenMax) })} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NumInput({ value, step, onChange }: { value: number; step: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      step={step}
      min={0}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-8 w-24 border border-white/10 bg-black/30 px-2 text-sm tabular-nums text-slate-100 outline-none focus:border-cyan-glow/50"
    />
  );
}
