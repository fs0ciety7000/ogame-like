import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Shield, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudCallout, HudChip } from "@/components/ui/hud";
import { currentGameContent, validateRules, type GameRules } from "@/game/content";
import { defaultLootTables, type LootTable } from "@/game/loot";
import { type RelicSettings } from "@/game/relics";
import { saveContentSection, useContentStore } from "@/services/contentService";
import { Field, ImageField, NumberField, Section, TextAreaField, TextField } from "@/pages/admin/fields";

/* 5.15 : boss d'alliance, réglé comme les autres boss : catalogue (nom,
   image, histoire), combat (structure, durée, délai, trajet), coût
   d'appel et récompenses, table de butin. Deux sections de contenu :
   règles (allianceBoss) et reliques (butin). */

type AllianceBossRules = GameRules["allianceBoss"];

export function AllianceBossPanel() {
  useContentStore((s) => s.version);
  const [rules, setRules] = useState<GameRules>(() => structuredClone(currentGameContent().rules));
  const [relics, setRelics] = useState<RelicSettings>(() => structuredClone(currentGameContent().relicSettings));
  const [dirty, setDirty] = useState({ rules: false, relics: false });
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);

  const ab = rules.allianceBoss;
  const setAb = (patch: Partial<AllianceBossRules>) => {
    setRules((r) => ({ ...r, allianceBoss: { ...r.allianceBoss, ...patch } }));
    setDirty((d) => ({ ...d, rules: true }));
  };
  const bosses = ab.bosses ?? [];
  const boss = bosses[selected] ?? bosses[0];
  const setBoss = (patch: Partial<AllianceBossRules["bosses"][number]>) => setAb({ bosses: bosses.map((b, i) => (i === selected ? { ...b, ...patch } : b)) });
  const loot: LootTable = { ...defaultLootTables().allianceBoss, ...((relics.loot as Partial<Record<string, LootTable>> | undefined)?.allianceBoss ?? {}) };
  const setLoot = (patch: Partial<LootTable>) => {
    setRelics((r) => ({ ...r, loot: { ...(r.loot ?? {}), allianceBoss: { ...loot, ...patch } } as RelicSettings["loot"] }));
    setDirty((d) => ({ ...d, relics: true }));
  };
  const idErrors = bosses.filter((b) => !/^[a-z0-9_]+$/.test(b.id) || !b.name.trim()).map((b) => `Boss d'alliance « ${b.name || b.id || "?"} » : identifiant (minuscules, chiffres, _) et nom obligatoires.`);
  const errors = useMemo(() => [...validateRules(rules).filter((e) => e.includes("alliance")), ...idErrors], [rules, idErrors]);
  const anyDirty = dirty.rules || dirty.relics;

  const save = async () => {
    if (errors.length) return toast.error("Corrige les erreurs avant d'enregistrer.");
    setBusy(true);
    try {
      if (dirty.rules) await saveContentSection("rules", rules);
      if (dirty.relics) await saveContentSection("relicSettings", relics);
      setDirty({ rules: false, relics: false });
      toast.success("Boss d'alliance enregistré (appliqué aussi par le serveur).");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Shield className="h-4 w-4 text-mint-glow" />
        <h2 className="hud-title text-sm text-white">Boss d'alliance</h2>
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
        Une fois par semaine, le fondateur ou un officier appelle un boss en payant sur le trésor. Le boss de la semaine tourne dans le catalogue ci-dessous. Jetons du casino par boss abattu : onglet Pot commun.
      </p>
      {errors.length > 0 && <HudCallout tone="danger" className="text-xs">{errors.join(" ")}</HudCallout>}

      <Section title="Catalogue">
        <Field label="Boss" className="sm:col-span-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {bosses.map((b, i) => (
              <HudChip key={`${b.id}-${i}`} asChild size="sm" tone={i === selected ? "accent" : "neutral"}>
                <button type="button" onClick={() => setSelected(i)}>
                  {b.name || b.id}
                </button>
              </HudChip>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setAb({ bosses: [...bosses, { id: `boss_${bosses.length + 1}`, name: "Nouveau boss", image: "/assets/story/varan.webp", lore: "" }] });
                setSelected(bosses.length);
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
        </Field>
        {boss && (
          <>
            <TextField label="Identifiant" value={boss.id} onChange={(id) => setBoss({ id })} />
            <TextField label="Nom" value={boss.name} onChange={(name) => setBoss({ name })} />
            <ImageField label="Image" value={boss.image} onChange={(image) => setBoss({ image })} />
            <div className="flex items-end">
              <Button
                size="sm"
                variant="ghost"
                disabled={bosses.length <= 1}
                onClick={() => {
                  setAb({ bosses: bosses.filter((_, i) => i !== selected) });
                  setSelected(0);
                }}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Retirer ce boss
              </Button>
            </div>
            <div className="sm:col-span-2">
              <TextAreaField label="Présentation" rows={2} value={boss.lore} onChange={(lore) => setBoss({ lore })} />
            </div>
          </>
        )}
      </Section>

      <Section title="Combat">
        <NumberField label="Structure : facteur × puissance d'attaque des membres actifs" value={ab.hpFactor} step={0.5} onChange={(v) => setAb({ hpFactor: v ?? 0 })} />
        <NumberField label="Structure minimale" value={ab.minHp} step={10000} onChange={(v) => setAb({ minHp: v ?? 0 })} />
        <NumberField label="Durée de présence (h)" value={ab.durationHours} step={1} min={1} onChange={(v) => setAb({ durationHours: v ?? 24 })} />
        <NumberField label="Délai entre deux assauts d'un membre (h)" value={ab.cooldownHours} step={0.5} min={0.25} onChange={(v) => setAb({ cooldownHours: v ?? 4 })} />
        <NumberField label="Trajet aller (min)" value={ab.flightMinutes} step={5} min={1} onChange={(v) => setAb({ flightMinutes: v ?? 20 })} />
      </Section>

      <Section title="Coût et récompenses">
        <NumberField label="Coût d'appel (heures de production cumulée des membres)" value={ab.costHours} step={0.5} min={0} onChange={(v) => setAb({ costHours: v ?? 0 })} />
        <NumberField label="Part du coût rendue s'il tombe (0,5 = 50 %)" value={ab.refundPct} step={0.05} min={0} onChange={(v) => setAb({ refundPct: v ?? 0 })} />
        <NumberField label="Part minimale des dégâts pour être récompensé" value={ab.minSharePct} step={0.01} min={0} onChange={(v) => setAb({ minSharePct: v ?? 0 })} />
        <NumberField label="Récompense (heures de production)" value={ab.rewardHours} step={0.5} min={0} onChange={(v) => setAb({ rewardHours: v ?? 0 })} />
        <NumberField label="Points de passe s'il tombe" value={ab.killPoints} step={5} min={0} onChange={(v) => setAb({ killPoints: v ?? 0 })} />
        <NumberField label="Points de passe s'il survit" value={ab.failPoints} step={5} min={0} onChange={(v) => setAb({ failPoints: v ?? 0 })} />
      </Section>

      <Section title="Butin (en plus des récompenses)">
        <NumberField label="Chance de relique" value={loot.relicChance} step={0.01} min={0} onChange={(v) => setLoot({ relicChance: v ?? 0 })} />
        <NumberField label="Chance de capsule" value={loot.capsuleChance} step={0.01} min={0} onChange={(v) => setLoot({ capsuleChance: v ?? 0 })} />
        <NumberField label="Chance de jetons du casino" value={loot.tokenChance ?? 0} step={0.01} min={0} onChange={(v) => setLoot({ tokenChance: v ?? 0 })} />
        <NumberField label="Podium : chances ×" value={loot.podiumMult} step={0.1} min={1} onChange={(v) => setLoot({ podiumMult: v ?? 1 })} />
      </Section>
    </Card>
  );
}
