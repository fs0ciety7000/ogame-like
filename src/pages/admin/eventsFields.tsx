import { useState } from "react";
import { Plus, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GameRules } from "@/game/content";
import type { EventEffects, EventType } from "@/game/events";
import { previousSeasonId, seasonLabel } from "@/game/seasons";
import { adminCloseSeason } from "@/services/adminService";
import { CheckboxField, Field, NumberField, Section, SelectField, TextField } from "@/pages/admin/fields";

type SetRules = (fn: (r: GameRules) => GameRules) => void;

/** Date locale « AAAA-MM-JJTHH:MM » ↔ millisecondes (champ datetime-local). */
function toLocalInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const EFFECT_FIELDS: { key: keyof EventEffects; label: string; step: number }[] = [
  { key: "buildTime", label: "Temps de construction (×)", step: 0.05 },
  { key: "researchTime", label: "Temps de recherche (×)", step: 0.05 },
  { key: "missionRewards", label: "Récompenses de missions (×)", step: 0.1 },
  { key: "loot", label: "Butin (×)", step: 0.1 },
  { key: "debrisPercent", label: "Débris (part du coût, 0,5 = 50 %)", step: 0.05 },
];

/** Réglages des événements du week-end et des récompenses de saison. */
export function EventsAndSeasonsSections({ rules, setRules }: { rules: GameRules; setRules: SetRules }) {
  const events = rules.events;
  const setEvents = (patch: Partial<GameRules["events"]>) => setRules((r) => ({ ...r, events: { ...r.events, ...patch } }));
  const setType = (id: string, patch: Partial<EventType>) => setEvents({ types: events.types.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  const setEffect = (t: EventType, key: keyof EventEffects, value: number | undefined) => {
    const effects = { ...t.effects } as Record<string, unknown>;
    if (value === undefined) delete effects[key];
    else effects[key] = value;
    setType(t.id, { effects: effects as EventEffects });
  };
  const seasons = rules.seasons;
  const setSeasons = (patch: Partial<GameRules["seasons"]>) => setRules((r) => ({ ...r, seasons: { ...r.seasons, ...patch } }));
  const typeOptions = events.types.map((t) => ({ value: t.id, label: `${t.emoji} ${t.name}` }));
  const [closing, setClosing] = useState(false);

  const closeSeason = async () => {
    const id = previousSeasonId();
    if (!window.confirm(`Clôturer la saison ${seasonLabel(id)} maintenant ? (déjà faite automatiquement si elle est close)`)) return;
    setClosing(true);
    try {
      const out = await adminCloseSeason(id);
      toast.success(out.closed ? `Saison close : ${out.ranked} classés, ${out.rewarded} récompensés.` : "Cette saison était déjà close.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setClosing(false);
    }
  };

  return (
    <>
      <Section title="Événements du week-end">
        <CheckboxField
          label="Rotation automatique chaque week-end"
          checked={events.rotationEnabled}
          onChange={(v) => setEvents({ rotationEnabled: v })}
          hint="Du vendredi (heure ci-contre) au dimanche 23 h 59, heure de Paris."
        />
        <CheckboxField
          label="Léviathan mensuel"
          checked={events.bossMonthly !== false}
          onChange={(v) => setEvents({ bossMonthly: v })}
          hint="Il remplace l'événement de la rotation son week-end-là. Week-end, heure et durée : section Léviathan."
        />
        <NumberField label="Début le vendredi à (heure de Paris)" value={events.startHour} min={0} step={1} onChange={(v) => setEvents({ startHour: Math.min(23, Math.max(0, v ?? 18)) })} />
        <Field label="Ordre de rotation" hint="Identifiants séparés par des virgules." className="sm:col-span-2">
          <Input
            value={events.rotation.join(", ")}
            onChange={(e) =>
              setEvents({
                rotation: e.target.value
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
      </Section>

      {events.types.map((t) => (
        <Section key={t.id} title={`Événement : ${t.emoji} ${t.name} (${t.id})`}>
          <TextField label="Nom" value={t.name} onChange={(v) => setType(t.id, { name: v })} />
          <TextField label="Emoji" value={t.emoji} onChange={(v) => setType(t.id, { emoji: v })} />
          <TextField label="Description (affichée aux joueurs)" value={t.description} onChange={(v) => setType(t.id, { description: v })} className="sm:col-span-2" />
          <NumberField
            label="Production de ferraille (×)"
            value={t.effects.production?.scrap}
            optional
            step={0.1}
            onChange={(v) => setType(t.id, { effects: { ...t.effects, production: { ...(t.effects.production ?? {}), scrap: v } } })}
          />
          <NumberField
            label="Production de nanocomposants (×)"
            value={t.effects.production?.nano}
            optional
            step={0.1}
            onChange={(v) => setType(t.id, { effects: { ...t.effects, production: { ...(t.effects.production ?? {}), nano: v } } })}
          />
          {EFFECT_FIELDS.map((f) => (
            <NumberField key={f.key} label={f.label} value={t.effects[f.key] as number | undefined} optional step={f.step} onChange={(v) => setEffect(t, f.key, v)} />
          ))}
        </Section>
      ))}

      <Section title="Événements programmés (prioritaires sur la rotation)">
        {events.scheduled.length === 0 && <p className="text-xs text-slate-500 sm:col-span-2">Aucun événement programmé.</p>}
        {events.scheduled.map((s, i) => (
          <div key={s.id} className="grid grid-cols-1 gap-2 border border-white/5 p-2 sm:col-span-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <SelectField
              label="Événement"
              value={s.type}
              options={typeOptions}
              onChange={(v) => setEvents({ scheduled: events.scheduled.map((x, j) => (j === i ? { ...x, type: v } : x)) })}
            />
            <Field label="Début (heure locale)">
              <Input
                type="datetime-local"
                value={toLocalInput(s.startMs)}
                onChange={(e) => setEvents({ scheduled: events.scheduled.map((x, j) => (j === i ? { ...x, startMs: new Date(e.target.value).getTime() } : x)) })}
              />
            </Field>
            <Field label="Fin (heure locale)">
              <Input
                type="datetime-local"
                value={toLocalInput(s.endMs)}
                onChange={(e) => setEvents({ scheduled: events.scheduled.map((x, j) => (j === i ? { ...x, endMs: new Date(e.target.value).getTime() } : x)) })}
              />
            </Field>
            <Button variant="ghost" size="icon" className="self-end" title="Supprimer" onClick={() => setEvents({ scheduled: events.scheduled.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="sm:col-span-2 sm:justify-self-start"
          onClick={() => {
            const start = Math.ceil(Date.now() / 3600_000) * 3600_000;
            setEvents({ scheduled: [...events.scheduled, { id: `evt${Date.now().toString(36)}`, type: events.types[0]?.id ?? "", startMs: start, endMs: start + 24 * 3600_000 }] });
          }}
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Programmer un événement
        </Button>
      </Section>

      <Section title="Factions hostiles">
        <CheckboxField label="Ultimatums et raids des factions actifs" checked={rules.pirates.enabled} onChange={(v) => setRules((r) => ({ ...r, pirates: { ...r.pirates, enabled: v } }))} />
        <NumberField label="Adaptation : + par raid repoussé" value={rules.pirates.adaptUp} min={0} step={0.01} onChange={(v) => setRules((r) => ({ ...r, pirates: { ...r.pirates, adaptUp: v ?? 0 } }))} />
        <NumberField label="Adaptation : − par raid perdu" value={rules.pirates.adaptDown} min={0} step={0.01} onChange={(v) => setRules((r) => ({ ...r, pirates: { ...r.pirates, adaptDown: v ?? 0 } }))} />
        <NumberField label="Adaptation minimale (×)" value={rules.pirates.adaptMin} min={0.1} step={0.05} onChange={(v) => setRules((r) => ({ ...r, pirates: { ...r.pirates, adaptMin: v ?? 1 } }))} />
        <NumberField label="Adaptation maximale (×)" value={rules.pirates.adaptMax} min={1} step={0.05} onChange={(v) => setRules((r) => ({ ...r, pirates: { ...r.pirates, adaptMax: v ?? 1 } }))} />
        <p className="text-xs text-slate-500 sm:col-span-2">Chaque raid repoussé renforce le suivant de cette faction contre ce joueur, chaque défaite l'affaiblit. Équilibre : environ « − ÷ (+ + −) » de raids repoussés (70 % avec 0,04 et 0,1).</p>
        <p className="text-xs text-slate-500 sm:col-span-2">Les factions elles-mêmes (déclencheur, tribut, raids, repaire, textes) se règlent dans l'onglet « Factions ».</p>
      </Section>
      <Section title="Alliances">
        <NumberField label="Membres maximum par alliance" value={rules.alliances.maxMembers} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, maxMembers: v ?? 0 } }))} />
        <NumberField label="Versement : part max du stock (0,2 = 20 %)" value={rules.alliances.distributionMaxPct} min={0} step={0.05} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, distributionMaxPct: v ?? 0 } }))} />
        <NumberField label="Versements par jour" value={rules.alliances.distributionsPerDay} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, distributionsPerDay: v ?? 0 } }))} />
        <NumberField label="Recherche niv. 1 : coût commun" value={rules.alliances.researchCommonCost} min={0} step={1000000} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, researchCommonCost: v ?? 0 } }))} />
        <NumberField label="Recherche niv. 1 : coût rare" value={rules.alliances.researchRareCost} min={0} step={100000} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, researchRareCost: v ?? 0 } }))} />
        <NumberField label="Recherche : croissance du coût (×)" value={rules.alliances.researchGrowth} min={0} step={0.1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, researchGrowth: v ?? 0 } }))} />
        <NumberField label="Recherche : heures par niveau" value={rules.alliances.researchHoursPerLevel} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, researchHoursPerLevel: v ?? 0 } }))} />
        <NumberField label="Projet palier 1 : coût commun" value={rules.alliances.projectCommonCost} min={0} step={10000000} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, projectCommonCost: v ?? 0 } }))} />
        <NumberField label="Projet palier 1 : coût rare" value={rules.alliances.projectRareCost} min={0} step={100000} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, projectRareCost: v ?? 0 } }))} />
        <NumberField label="Projet : croissance du coût (×)" value={rules.alliances.projectGrowth} min={0} step={0.1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, projectGrowth: v ?? 0 } }))} />
        <NumberField label="Projet : heures de construction par palier" value={rules.alliances.projectHoursPerLevel} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, projectHoursPerLevel: v ?? 0 } }))} />
        <NumberField label="Garnison : part de puissance (0,5 = 50 %)" value={rules.alliances.garrisonPower} min={0} step={0.05} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, garrisonPower: v ?? 0 } }))} />
        <NumberField label="Garnison : durée min (h)" value={rules.alliances.garrisonMinHours} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, garrisonMinHours: v ?? 0 } }))} />
        <NumberField label="Garnison : durée max (h)" value={rules.alliances.garrisonMaxHours} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, garrisonMaxHours: v ?? 0 } }))} />
        <NumberField label="Garnisons max par joueur" value={rules.alliances.maxGarrisonsPerHost} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, maxGarrisonsPerHost: v ?? 0 } }))} />
        <NumberField label="Renseignement : jours" value={rules.alliances.sharedReportsDays} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, sharedReportsDays: v ?? 0 } }))} />
        <NumberField label="Saison : meilleurs membres comptés" value={rules.alliances.seasonTopMembers} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, seasonTopMembers: v ?? 0 } }))} />
        <NumberField label="Saison : heures de production (alliance gagnante)" value={rules.alliances.seasonRewardHours} min={0} step={1} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, seasonRewardHours: v ?? 0 } }))} />
        <TextField label="Saison : titre de l'alliance gagnante" value={rules.alliances.seasonTitle} onChange={(v) => setRules((r) => ({ ...r, alliances: { ...r.alliances, seasonTitle: v } }))} />
      </Section>
      <Section title="Récompenses de fin de saison">
        {seasons.tiers.map((t, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 border border-white/5 p-2 sm:col-span-2 sm:grid-cols-4">
            <NumberField label="Jusqu'au rang" value={t.maxRank} min={1} step={1} onChange={(v) => setSeasons({ tiers: seasons.tiers.map((x, j) => (j === i ? { ...x, maxRank: v ?? 1 } : x)) })} />
            <NumberField label="Heures de production" value={t.hours} min={0} step={1} onChange={(v) => setSeasons({ tiers: seasons.tiers.map((x, j) => (j === i ? { ...x, hours: v ?? 0 } : x)) })} />
            <NumberField label="Bonus de chaque rare" value={t.rare} min={0} step={50} onChange={(v) => setSeasons({ tiers: seasons.tiers.map((x, j) => (j === i ? { ...x, rare: v ?? 0 } : x)) })} />
            <TextField label="Titre (+ « de Mois Année »)" value={t.title} onChange={(v) => setSeasons({ tiers: seasons.tiers.map((x, j) => (j === i ? { ...x, title: v } : x)) })} />
          </div>
        ))}
        <NumberField label="Participation : XP de saison minimale" value={seasons.participationXp} min={0} step={10} onChange={(v) => setSeasons({ participationXp: v ?? 0 })} />
        <NumberField label="Participation : heures de production" value={seasons.participationHours} min={0} step={1} onChange={(v) => setSeasons({ participationHours: v ?? 0 })} />
        <div className="sm:col-span-2">
          <Button variant="outline" size="sm" className="h-auto min-h-8 whitespace-normal py-1.5 text-left" disabled={closing} onClick={() => void closeSeason()}>
            <Trophy className="mr-1 h-3.5 w-3.5" /> Clôturer la saison {seasonLabel(previousSeasonId())} maintenant
          </Button>
          <p className="mt-1 text-[11px] text-slate-500">Automatique chaque heure après le changement de mois : ce bouton ne sert qu'en cas de besoin. Une saison n'est jamais close deux fois.</p>
        </div>
      </Section>
    </>
  );
}
