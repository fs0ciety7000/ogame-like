import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, RotateCcw, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { HudCallout, HudChip, HudSwitch, HudTag } from "@/components/ui/hud";
import { defaultGameContent, RULE_GROUP_LABELS, type GameRules } from "@/game/content";
import { ruleFieldMeta } from "@/game/ruleRegistry";
import { NESTED_FIELD_LABELS, ruleBoundError, RULE_UNIT_LABELS, type RuleFieldMeta } from "@/game/ruleMeta";
import { CheckboxField, Field, NumberField, TextAreaField, TextField } from "@/pages/admin/fields";
import { cn, formatDecimal } from "@/lib/utils";

/* 6.7.2 : tous les réglages de GameRules, y compris ceux des fonctionnalités futures, sont éditables ici.
   Chaque champ est affiché selon son type (nombre, oui/non, texte, liste de nombres, objet, liste d'objets en JSON).
   Les sections dédiées (plus haut et dans les autres onglets) restent la façon la plus lisible de régler les chiffres
   courants ; cet éditeur garantit qu'aucun réglage n'est réservé au code.
   6.14.95 (AA2, constats AA-24 et AA-28) : chaque champ de premier niveau montre son libellé clair (métadonnées
   `X_RULES_META` du registre, `HISTORICAL_RULES_META` pour les groupes historiques), son nom technique en petit,
   son unité, ses bornes et son aide ; badge « modifié » et bouton « défaut » quand la valeur diffère du défaut ;
   alerte au-delà de ×2 ou ÷2 du défaut, et hors des bornes (refusé à l'enregistrement). */

type Json = unknown;

const isPlainObject = (v: Json): v is Record<string, Json> => !!v && typeof v === "object" && !Array.isArray(v);
const isScalarList = (v: Json): v is (number | string)[] => Array.isArray(v) && v.every((x) => typeof x === "number" || typeof x === "string");
const same = (a: Json, b: Json) => JSON.stringify(a) === JSON.stringify(b);
const fmt = (n: number) => formatDecimal(n, 4);

/** Libellé d'un sous-champ (objets imbriqués) : libellé courant, sinon nom technique. */
function nestedLabel(key: string): string {
  return NESTED_FIELD_LABELS[key] ? `${NESTED_FIELD_LABELS[key]} · ${key}` : key;
}

/** Valeur par défaut affichée en une ligne courte. */
function shortValue(v: Json): string {
  if (typeof v === "number") return fmt(v);
  if (typeof v === "boolean") return v ? "oui" : "non";
  if (typeof v === "string") return v === "" ? "(vide)" : `« ${v} »`;
  if (isScalarList(v)) return v.map((x) => (typeof x === "number" ? fmt(x) : x)).join(", ") || "(liste vide)";
  return "valeur composée";
}

/** Écart de plus de ×2 (ou ÷2) entre un nombre et son défaut (même règle que ruleDriftWarnings). */
function drifts(v: Json, d: Json): boolean {
  return typeof v === "number" && typeof d === "number" && d !== 0 && Number.isFinite(v) && (Math.sign(v) !== Math.sign(d) || Math.abs(v) > Math.abs(d) * 2 || Math.abs(v) < Math.abs(d) / 2);
}

/** Champ selon le type de la valeur (sous-champs et valeurs composées). `name` sert de clé et de libellé. */
function RuleValue({ name, label, value, onChange }: { name: string; label?: string; value: Json; onChange: (v: Json) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const text0 = label ?? nestedLabel(name);
  if (typeof value === "number") return <NumberField label={text0} value={value} step={Number.isInteger(value) ? 1 : 0.01} onChange={(v) => onChange(v ?? 0)} />;
  if (typeof value === "boolean") return <CheckboxField label={text0} checked={value} onChange={onChange} />;
  if (typeof value === "string") return <TextField label={text0} value={value} onChange={onChange} />;
  if (value === null || value === undefined) return <TextField label={text0} value="" hint="Vide = comportement par défaut." onChange={(v) => onChange(v === "" ? null : v)} />;
  if (isScalarList(value)) {
    const numeric = value.every((x) => typeof x === "number");
    return (
      <TextField
        label={text0}
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
      <fieldset className="hud-cut-sm min-w-0 border border-cyan-glow/10 p-2">
        <legend className="px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">{text0}</legend>
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
    <div className="flex min-w-0 flex-col gap-1">
      <TextAreaField
        label={`${text0} (JSON)`}
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

/** Champ de premier niveau d'un groupe : libellé, nom technique, unité, bornes, aide, écart au défaut. */
function RuleField({ name, meta, value, def, onChange }: { name: string; meta: RuleFieldMeta | undefined; value: Json; def: Json; onChange: (v: Json) => void }) {
  // Clé de remontage : « défaut » repart d'un brouillon propre (listes, JSON).
  const [resetKey, setResetKey] = useState(0);
  const title = meta?.label ?? name;
  const modified = def !== undefined && !same(value, def);
  const unit = meta?.unit;
  const bounds = meta && (meta.min !== undefined || meta.max !== undefined) ? `${meta.min !== undefined ? fmt(meta.min) : "…"} à ${meta.max !== undefined ? fmt(meta.max) : "…"}` : null;
  const bound = typeof value === "number" ? ruleBoundError(meta, value) : null;
  const drift = !bound && drifts(value, def);
  const composite = typeof value !== "number" && typeof value !== "boolean" && typeof value !== "string";
  let control: ReactNode;
  if (typeof value === "number")
    control = (
      <NumberInput
        min={-1e15}
        step={Number.isInteger(value) ? 1 : 0.01}
        decimals={4}
        quick={false}
        value={value}
        suffix={unit ? <span className="font-mono text-[10px] text-slate-500">{unit}</span> : undefined}
        aria-label={title}
        onChange={(v: number | undefined) => onChange(v ?? 0)}
        className="w-full"
      />
    );
  else if (typeof value === "boolean")
    control = (
      <span className="flex items-center gap-2 text-xs text-slate-300">
        <HudSwitch checked={value} onCheckedChange={onChange} label={title} />
        <span className="font-mono tabular-nums">{value ? "oui" : "non"}</span>
      </span>
    );
  else if (typeof value === "string") control = <Input value={value} aria-label={title} onChange={(e) => onChange(e.target.value)} />;
  else control = <RuleValue key={resetKey} name={name} label="Valeur" value={value} onChange={onChange} />;
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", composite && "sm:col-span-2")}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="min-w-0 text-sm text-slate-100 [overflow-wrap:anywhere]">{title}</span>
        {unit && typeof value !== "number" && (
          <span title={RULE_UNIT_LABELS[unit] ?? unit}>
            <HudTag>{unit}</HudTag>
          </span>
        )}
        {modified && (
          <HudChip size="sm" tone="accent">
            modifié
          </HudChip>
        )}
      </div>
      <p className="font-mono text-[10px] text-slate-500 [overflow-wrap:anywhere]">
        {name}
        {def !== undefined && !composite && (
          <>
            {" · défaut "}
            <span className="tabular-nums">{shortValue(def)}</span>
          </>
        )}
        {bounds && (
          <>
            {" · bornes "}
            <span className="tabular-nums">{bounds}</span>
          </>
        )}
        {unit === "part" && typeof value === "number" && (
          <>
            {" · soit "}
            <span className="tabular-nums">{fmt(value * 100)} %</span>
          </>
        )}
      </p>
      {control}
      {meta?.hint && <p className="text-[11px] text-slate-400">{meta.hint}</p>}
      {bound && (
        <HudCallout tone="danger" className="p-2 text-[11px] text-slate-200">
          Hors bornes : doit être {bound}. L'enregistrement sera refusé.
        </HudCallout>
      )}
      {drift && (
        <HudCallout tone="ember" className="p-2 text-[11px] text-slate-200">
          Plus de ×2 d'écart avec le défaut (<span className="font-mono tabular-nums">{shortValue(def)}</span>) : vérifie l'ordre de grandeur.
        </HudCallout>
      )}
      {modified && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="self-start"
          onClick={() => {
            onChange(structuredClone(def));
            setResetKey((k) => k + 1);
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Défaut
        </Button>
      )}
    </div>
  );
}

export function AllRulesEditor({ rules, setRules }: { rules: GameRules; setRules: (fn: (r: GameRules) => GameRules) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [onlyModified, setOnlyModified] = useState(false);
  const defaults = useMemo(() => defaultGameContent().rules as unknown as Record<string, Json>, []);
  const groups = useMemo(() => Object.entries(rules as unknown as Record<string, Json>), [rules]);
  const q = query.trim().toLowerCase();
  const total = groups.reduce((a, [, v]) => a + (isPlainObject(v) ? Object.keys(v).length : 1), 0);
  const defaultOf = (group: string, key: string): Json => {
    const d = defaults[group];
    return isPlainObject(d) ? d[key] : undefined;
  };
  const modifiedCount = groups.reduce((a, [group, v]) => a + (isPlainObject(v) ? Object.entries(v).filter(([k, x]) => defaultOf(group, k) !== undefined && !same(x, defaultOf(group, k))).length : 0), 0);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <button type="button" className="flex items-center gap-2 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-cyan-glow transition-transform", !open && "-rotate-90")} />
        <span className="hud-title text-sm text-slate-100">Tous les réglages (avancé)</span>
        <span className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          {modifiedCount > 0 && (
            <HudChip size="sm" tone="accent">
              <span className="tabular-nums">{modifiedCount}</span> modifiés
            </HudChip>
          )}
          <span className="font-mono text-xs tabular-nums text-slate-500">{total} champs</span>
        </span>
      </button>
      <p className="text-xs text-slate-400">
        Chaque réglage du jeu, y compris ceux sans section dédiée, avec son unité, ses bornes et son aide. Les valeurs sont vérifiées à l'enregistrement (bouton en haut de l'onglet).
      </p>
      {open && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Field label="Chercher un réglage" className="min-w-0 flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ex. phalange, recharge, scanCostMin…" className="pl-7" />
              </div>
            </Field>
            <span className="flex items-center gap-2 pb-2 text-xs text-slate-300">
              <HudSwitch checked={onlyModified} onCheckedChange={setOnlyModified} label="Seulement les réglages modifiés" />
              Seulement les modifiés
            </span>
          </div>
          {groups.map(([group, value]) => {
            const title = RULE_GROUP_LABELS[group] ?? group;
            const plain = isPlainObject(value);
            const entries = plain ? Object.entries(value) : [[group, value] as [string, Json]];
            const groupHit = title.toLowerCase().includes(q) || group.toLowerCase().includes(q);
            const shown = entries.filter(([k, v]) => {
              const meta = plain ? ruleFieldMeta(group, k) : undefined;
              if (onlyModified && (!plain || defaultOf(group, k) === undefined || same(v, defaultOf(group, k)))) return false;
              if (!q || groupHit) return true;
              return k.toLowerCase().includes(q) || (meta?.label ?? "").toLowerCase().includes(q) || (meta?.hint ?? "").toLowerCase().includes(q);
            });
            if (shown.length === 0) return null;
            return (
              <fieldset key={group} className="hud-cut-sm min-w-0 border border-cyan-glow/10 bg-black/20 p-3">
                <legend className="hud-eyebrow max-w-full px-1.5 text-[10px] text-cyan-glow/80 [overflow-wrap:anywhere]">
                  {title} · <span className="font-mono">{group}</span>
                </legend>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {shown.map(([k, v]) =>
                    plain ? (
                      <RuleField
                        key={k}
                        name={k}
                        meta={ruleFieldMeta(group, k)}
                        value={v}
                        def={defaultOf(group, k)}
                        onChange={(nv) => setRules((r) => ({ ...r, [group]: { ...(r as unknown as Record<string, Record<string, Json>>)[group], [k]: nv } }) as GameRules)}
                      />
                    ) : (
                      <RuleValue key={k} name={k} value={v} onChange={(nv) => setRules((r) => ({ ...r, [group]: nv }) as GameRules)} />
                    ),
                  )}
                </div>
              </fieldset>
            );
          })}
        </>
      )}
    </Card>
  );
}
