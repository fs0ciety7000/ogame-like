import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RULE_GROUP_LABELS, type GameRules } from "@/game/content";
import { CheckboxField, Field, NumberField, TextAreaField, TextField } from "@/pages/admin/fields";
import { cn } from "@/lib/utils";

/* 6.7.2 : tous les réglages de GameRules, y compris ceux des fonctionnalités futures, sont éditables ici.
   Chaque champ est affiché selon son type (nombre, oui/non, texte, liste de nombres, objet, liste d'objets en JSON).
   Les sections dédiées (plus haut et dans les autres onglets) restent la façon la plus lisible de régler les chiffres
   courants ; cet éditeur garantit qu'aucun réglage n'est réservé au code. Libellés manquants : nom du champ. */

type Json = unknown;

/** Libellés des champs sans section dédiée (le nom technique est affiché sinon). */
const FIELD_LABELS: Record<string, string> = {
  npcWinMinXp: "XP minimale d'une victoire contre un PNJ",
  defenseXpLossWindowMs: "Fenêtre de la perte d'XP en défense (ms)",
  protectedHoursFromMs: "Abri en heures de production : actif à partir de (date, ms)",
  mapSize: "Taille de la carte de la galaxie",
  levelsRequired: "Niveaux cumulés requis pour chaque colonie",
  foundationShare: "Fondation : part des niveaux de la planète mère",
  foundationMax: "Fondation : niveau maximal",
  intervals: "Cadences proposées (h)",
  sentinelCounterCap: "Contre-espionnage : sentinelles comptées au plus",
  sentinelUnitId: "Unité de contre-espionnage (id)",
  capacityPerLevel: "Capacité par niveau",
  firstSeasonId: "Première saison (AAAA-MM)",
  membersPerQuarter: "Membres en plus par niveau de Quartiers fédérés",
  sharedReportsMax: "Rapports partagés gardés",
  rareRate: "Taux des ressources rares",
  forceMinPower: "Force ennemie minimale (× ta puissance)",
  forceMaxPower: "Force ennemie maximale (× ta puissance)",
  podiumHours: "Heures de production du podium (1er, 2e, 3e…)",
  relicAmber: "Ambre par relique (rareté)",
};

function label(key: string): string {
  return FIELD_LABELS[key] ? `${FIELD_LABELS[key]} · ${key}` : key;
}

const isPlainObject = (v: Json): v is Record<string, Json> => !!v && typeof v === "object" && !Array.isArray(v);
const isScalarList = (v: Json): v is (number | string)[] => Array.isArray(v) && v.every((x) => typeof x === "number" || typeof x === "string");

/** Champ selon le type de la valeur. `path` sert de clé et de libellé. */
function RuleValue({ name, value, onChange }: { name: string; value: Json; onChange: (v: Json) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  if (typeof value === "number") return <NumberField label={label(name)} value={value} step={Number.isInteger(value) ? 1 : 0.01} onChange={(v) => onChange(v ?? 0)} />;
  if (typeof value === "boolean") return <CheckboxField label={label(name)} checked={value} onChange={onChange} />;
  if (typeof value === "string") return <TextField label={label(name)} value={value} onChange={onChange} />;
  if (value === null || value === undefined) return <TextField label={label(name)} value="" hint="Vide = comportement par défaut." onChange={(v) => onChange(v === "" ? null : v)} />;
  if (isScalarList(value)) {
    const numeric = value.every((x) => typeof x === "number");
    return (
      <TextField
        label={label(name)}
        value={draft ?? value.join(", ")}
        hint="Valeurs séparées par des virgules."
        onChange={(t) => {
          setDraft(t);
          const parts = t.split(",").map((x) => x.trim()).filter((x) => x !== "");
          if (numeric) {
            const nums = parts.map(Number);
            if (nums.every((n) => Number.isFinite(n))) onChange(nums);
          } else onChange(parts);
        }}
      />
    );
  }
  if (isPlainObject(value) && Object.values(value).every((x) => typeof x === "number" || typeof x === "boolean" || typeof x === "string")) {
    return (
      <fieldset className="hud-cut-sm border border-cyan-glow/10 p-2 sm:col-span-2">
        <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">{label(name)}</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {Object.entries(value).map(([k, v]) => (
            <RuleValue key={k} name={k} value={v} onChange={(nv) => onChange({ ...value, [k]: nv })} />
          ))}
        </div>
      </fieldset>
    );
  }
  // Listes d'objets, objets imbriqués : JSON (vérifié à l'enregistrement).
  const text = draft ?? JSON.stringify(value, null, 2);
  let invalid = false;
  try {
    JSON.parse(text);
  } catch {
    invalid = true;
  }
  return (
    <div className="flex flex-col gap-1 sm:col-span-2">
      <TextAreaField
        label={`${label(name)} (JSON)`}
        value={text}
        rows={Math.min(10, text.split("\n").length)}
        onChange={(t) => {
          setDraft(t);
          try {
            onChange(JSON.parse(t));
          } catch {
            /* brouillon invalide : pas appliqué */
          }
        }}
      />
      {invalid && <span className="text-[11px] text-danger-glow">JSON invalide : la dernière valeur valide est gardée.</span>}
    </div>
  );
}

export function AllRulesEditor({ rules, setRules }: { rules: GameRules; setRules: (fn: (r: GameRules) => GameRules) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => Object.entries(rules as unknown as Record<string, Json>), [rules]);
  const q = query.trim().toLowerCase();
  const total = groups.reduce((a, [, v]) => a + (isPlainObject(v) ? Object.keys(v).length : 1), 0);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <button type="button" className="flex items-center gap-2 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ChevronDown className={cn("h-4 w-4 text-cyan-glow transition-transform", !open && "-rotate-90")} />
        <span className="hud-title text-sm text-slate-100">Tous les réglages (avancé)</span>
        <span className="ml-auto font-mono text-xs tabular-nums text-slate-500">{total} champs</span>
      </button>
      <p className="text-xs text-slate-400">
        Chaque réglage du jeu, y compris ceux sans section dédiée. Les valeurs sont vérifiées à l'enregistrement (bouton en haut de l'onglet).
      </p>
      {open && (
        <>
          <Field label="Chercher un réglage">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ex. colonies, mapSize, butin…" className="pl-7" />
            </div>
          </Field>
          {groups.map(([group, value]) => {
            const title = RULE_GROUP_LABELS[group] ?? group;
            const entries = isPlainObject(value) ? Object.entries(value) : [[group, value] as [string, Json]];
            const shown = q ? entries.filter(([k]) => k.toLowerCase().includes(q) || (FIELD_LABELS[k] ?? "").toLowerCase().includes(q) || title.toLowerCase().includes(q) || group.toLowerCase().includes(q)) : entries;
            if (shown.length === 0) return null;
            return (
              <fieldset key={group} className="hud-cut-sm border border-cyan-glow/10 bg-black/20 p-3">
                <legend className="hud-eyebrow px-1.5 text-[10px] text-cyan-glow/80">
                  {title} · <span className="font-mono">{group}</span>
                </legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {shown.map(([k, v]) => (
                    <RuleValue
                      key={k}
                      name={k}
                      value={v}
                      onChange={(nv) => setRules((r) => ({ ...r, [group]: isPlainObject(value) ? { ...(r as unknown as Record<string, Record<string, Json>>)[group], [k]: nv } : nv }) as GameRules)}
                    />
                  ))}
                </div>
              </fieldset>
            );
          })}
        </>
      )}
    </Card>
  );
}
