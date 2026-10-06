import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Crown, Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { currentGameContent, validateRules, type GameRules } from "@/game/content";
import { type ChroniclesConfig } from "@/game/chronicles";
import { isActive, LEVIATHAN_RULES, leviathanSchedule } from "@/game/leviathan";
import { defaultLootTables, type LootTable } from "@/game/loot";
import { RARITIES, type RelicRarity, type RelicSettings } from "@/game/relics";
import { OFFENSIVE_UNITS, findUnit } from "@/game/units";
import { saveContentSection, useContentStore } from "@/services/contentService";
import { BossScheduleFields } from "@/pages/admin/bossFields";
import { offerApplyDuration } from "@/pages/admin/applyBossDuration";
import { adminSeasonBoss, useSeasonBoss, useSeasonBossStore } from "@/services/seasonBossService";
import { bossWindows } from "@/game/events";
import { CheckboxField, Field, ImageField, NumberField, Section, SelectField, TextAreaField, TextField } from "@/pages/admin/fields";

/* 5.15 : tout le boss de saison au même endroit, comme les boss mondiaux :
   le boss de chaque mois (identité), le calendrier, le combat (structure,
   délai entre assauts, trajet, pertes, faiblesses) et les récompenses
   (reliques du podium, table de butin). Trois sections de contenu sont
   enregistrées : règles (seasonBoss), Chroniques (boss du mois), reliques (butin). */

const formatDateTime = (ms: number) => new Date(ms).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

export function SeasonBossPanel() {
  useContentStore((s) => s.version);
  const [rules, setRules] = useState<GameRules>(() => structuredClone(currentGameContent().rules));
  const [chronicles, setChronicles] = useState<ChroniclesConfig>(() => structuredClone(currentGameContent().chronicles));
  const [relics, setRelics] = useState<RelicSettings>(() => structuredClone(currentGameContent().relicSettings));
  const [dirty, setDirty] = useState({ rules: false, chronicles: false, relics: false });
  const thisMonth = new Date().toISOString().slice(0, 7);
  const [monthId, setMonthId] = useState(() => chronicles.months.find((m) => m.id >= thisMonth)?.id ?? chronicles.months[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const sb = rules.seasonBoss;
  const setSb = (patch: Partial<GameRules["seasonBoss"]>) => {
    setRules((r) => ({ ...r, seasonBoss: { ...r.seasonBoss, ...patch } }));
    setDirty((d) => ({ ...d, rules: true }));
  };
  const month = chronicles.months.find((m) => m.id === monthId);
  const setBoss = (patch: Partial<NonNullable<typeof month>["boss"]>) => {
    setChronicles((c) => ({ months: c.months.map((m) => (m.id === monthId ? { ...m, boss: { ...m.boss, ...patch } } : m)) }));
    setDirty((d) => ({ ...d, chronicles: true }));
  };
  const loot: LootTable = { ...defaultLootTables().seasonBoss, ...((relics.loot as Partial<Record<string, LootTable>> | undefined)?.seasonBoss ?? {}) };
  const setLoot = (patch: Partial<LootTable>) => {
    setRelics((r) => ({ ...r, loot: { ...(r.loot ?? {}), seasonBoss: { ...loot, ...patch } } as RelicSettings["loot"] }));
    setDirty((d) => ({ ...d, relics: true }));
  };
  const weakness = sb.weakness ?? [];
  const errors = useMemo(() => validateRules(rules).filter((e) => e.startsWith("Boss de saison")), [rules]);
  const anyDirty = dirty.rules || dirty.chronicles || dirty.relics;
  const live = useSeasonBoss();
  const now = Date.now();
  // Écart entre deux passages du boss mondial : plafond de la durée en alternance.
  const [w1, w2] = bossWindows(now, leviathanSchedule(), 3);
  const gapHours = w1 && w2 ? Math.floor((w2.startMs - w1.endMs) / 3600_000) : null;

  const save = async () => {
    if (errors.length) return toast.error("Corrige les erreurs avant d'enregistrer.");
    setBusy(true);
    try {
      const oldHours = currentGameContent().rules.seasonBoss.durationHours;
      if (dirty.rules) await saveContentSection("rules", rules);
      if (dirty.chronicles) await saveContentSection("chronicles", chronicles);
      if (dirty.relics) await saveContentSection("relicSettings", relics);
      setDirty({ rules: false, chronicles: false, relics: false });
      toast.success("Boss de saison enregistré (appliqué aussi par le serveur).");
      await offerApplyDuration({ state: useSeasonBossStore.getState().state, oldHours, newHours: sb.durationHours, name: "Le boss de saison", reschedule: (endMs) => adminSeasonBoss("reschedule", undefined, endMs) });
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Crown className="h-4 w-4 text-gold-glow" />
        <h2 className="hud-title text-sm text-slate-100">Boss de saison</h2>
        {anyDirty && (
          <HudChip size="sm" tone="ember">
            Modifications non enregistrées
          </HudChip>
        )}
        <Button size="sm" className="ml-auto" disabled={busy || !anyDirty} onClick={() => void save()}>
          <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
        </Button>
      </div>
      <p className="text-xs text-slate-400">
        Le boss des Chroniques : un boss par mois (son identité ci-dessous), qui revient chaque semaine en alternance avec le boss mondial. Les champs laissés vides reprennent la valeur du boss mondial. Jetons du casino par boss abattu : onglet Casino.
      </p>
      {errors.length > 0 && <HudCallout tone="danger" className="text-xs">{errors.join(" ")}</HudCallout>}

      <Section title="Boss du mois">
        <Field label="Mois" className="sm:col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {chronicles.months.map((m) => (
              <HudChip key={m.id} asChild size="sm" tone={m.id === monthId ? "accent" : m.id === thisMonth ? "gold" : "neutral"}>
                <button type="button" onClick={() => setMonthId(m.id)}>
                  {m.id}
                  {m.id === thisMonth ? " · en cours" : ""}
                </button>
              </HudChip>
            ))}
          </div>
        </Field>
        {month ? (
          <>
            <TextField label="Nom du boss" value={month.boss.name} onChange={(name) => setBoss({ name })} />
            <TextField label="Titre des participants à sa chute" value={month.boss.title} onChange={(title) => setBoss({ title })} />
            <ImageField label="Image du boss (21:9)" value={month.boss.image} onChange={(image) => setBoss({ image })} />
            <ImageField label="Sceau du mois" value={month.boss.emblem} onChange={(emblem) => setBoss({ emblem })} />
            <div className="sm:col-span-2">
              <TextAreaField label="Présentation du boss" rows={2} value={month.boss.lore} onChange={(lore) => setBoss({ lore })} />
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">Aucun arc des Chroniques : ajoute un mois dans l'onglet Chroniques.</p>
        )}
      </Section>

      <Section title="Calendrier">
        <CheckboxField
          label="Chaque semaine, en alternance avec le boss mondial"
          checked={sb.alternate !== false}
          onChange={(v) => setSb({ alternate: v })}
          hint="Une apparition entre deux passages du boss mondial, jamais en même temps. Décoché : une fois par mois."
        />
        <BossScheduleFields label="Boss de saison" weekday value={sb.alternate !== false ? { ...sb, weekly: { minGapDays: 0, between: leviathanSchedule() } } : sb} onChange={(p) => setSb(p)} />
        {live && isActive(live, now) && (
          <HudCallout tone="accent" className="text-xs sm:col-span-2">
            Combat en cours : fin le <span className="font-mono text-slate-100">{formatDateTime(live.endMs)}</span> ({Math.round((live.endMs - live.startMs) / 3600_000)} h, fixées à son apparition). Une nouvelle durée vaut pour les prochains combats ; à l'enregistrement, tu pourras aussi l'appliquer à celui-ci.
          </HudCallout>
        )}
        {sb.alternate !== false && gapHours !== null && sb.durationHours > gapHours && (
          <HudCallout tone="danger" className="text-xs sm:col-span-2">
            {sb.durationHours} h ne tiennent pas entre deux boss mondiaux (<span className="font-mono">{gapHours} h</span> d'écart) : le boss de saison n'apparaîtrait plus. Réduis la durée, ou celle du boss mondial.
          </HudCallout>
        )}
      </Section>

      <Section title="Combat">
        <NumberField label="Structure : facteur × puissance d'attaque des actifs" value={sb.hpFactor} step={0.5} onChange={(v) => setSb({ hpFactor: v ?? 0 })} />
        <NumberField label="Structure minimale" value={sb.minHp} step={100000} onChange={(v) => setSb({ minHp: v ?? 0 })} />
        <NumberField label="Délai entre deux assauts d'un joueur (h)" optional value={sb.cooldownHours} step={0.5} min={0.25} hint={`Vide : comme le boss mondial (${LEVIATHAN_RULES.cooldownHours} h).`} onChange={(v) => setSb({ cooldownHours: v })} />
        <NumberField label="Trajet aller (min)" optional value={sb.flightMinutes} step={5} min={1} hint={`Vide : comme le boss mondial (${LEVIATHAN_RULES.flightMinutes} min). Le retour prend autant.`} onChange={(v) => setSb({ flightMinutes: v })} />
        <NumberField label="Pertes à chaque assaut ×" optional value={sb.lossMult} step={0.05} min={0.1} hint={`1 = ${Math.round(LEVIATHAN_RULES.lossPct * 100)} % de chaque type de vaisseau, comme le boss mondial. Vide : 1.`} onChange={(v) => setSb({ lossMult: v })} />
        <Field label="Faiblesses possibles en phase 3 (une est tirée par combat ; aucune : liste commune)" className="sm:col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage").map((id) => {
              const on = weakness.includes(id);
              return (
                <HudChip key={id} asChild size="sm" tone={on ? "violet" : "neutral"}>
                  <button type="button" onClick={() => setSb({ weakness: on ? weakness.filter((w) => w !== id) : [...weakness, id] })}>
                    {findUnit(id)?.name ?? id}
                  </button>
                </HudChip>
              );
            })}
          </div>
        </Field>
      </Section>

      <Section title="Récompenses">
        <NumberField label="Reliques épiques pour les N premiers" value={sb.topRelics} min={0} step={1} onChange={(v) => setSb({ topRelics: Math.max(0, Math.round(v ?? 0)) })} />
        <NumberField label="Butin : chance de relique (0,2 = 20 %)" value={loot.relicChance} step={0.01} min={0} onChange={(v) => setLoot({ relicChance: v ?? 0 })} />
        <SelectField<RelicRarity> label="Butin : rareté minimale" value={loot.relicMinRarity} options={RARITIES.filter((r) => r.id !== "mythic").map((r) => ({ value: r.id, label: r.label }))} onChange={(relicMinRarity) => setLoot({ relicMinRarity })} />
        <NumberField label="Butin : chance de capsule" value={loot.capsuleChance} step={0.01} min={0} onChange={(v) => setLoot({ capsuleChance: v ?? 0 })} />
        <NumberField label="Capsule : niveau min." value={loot.capsuleMin} step={1} min={1} onChange={(v) => setLoot({ capsuleMin: Math.round(v ?? 1) })} />
        <NumberField label="Capsule : niveau max." value={loot.capsuleMax} step={1} min={1} onChange={(v) => setLoot({ capsuleMax: Math.round(v ?? 1) })} />
        <NumberField label="Podium : chances ×" value={loot.podiumMult} step={0.1} min={1} onChange={(v) => setLoot({ podiumMult: v ?? 1 })} />
        <NumberField label="Butin : chance de jetons du casino" value={loot.tokenChance ?? 0} step={0.01} min={0} onChange={(v) => setLoot({ tokenChance: v ?? 0 })} />
        <NumberField label="Jetons : min." value={loot.tokenMin ?? 1} step={1} min={1} onChange={(v) => setLoot({ tokenMin: Math.round(v ?? 1) })} />
        <NumberField label="Jetons : max." value={loot.tokenMax ?? 1} step={1} min={1} onChange={(v) => setLoot({ tokenMax: Math.round(v ?? 1) })} />
      </Section>
    </Card>
  );
}
