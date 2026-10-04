import { useRef, useState, type ReactNode } from "react";
import { ImageUp, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { RESOURCE_LIST } from "@/game/resources";
import { IconSelect } from "@/components/ui/icon-select";
import { ResourceIcon } from "@/components/ui/game-icon";
import { adminUploadAsset } from "@/services/adminService";
import { cn } from "@/lib/utils";

/* Champs de formulaire de l'administration : chacun reçoit une valeur et
 * un onChange, sans état propre (l'éditeur parent tient le brouillon). */

export function Field({ label, hint, children, className }: { label: ReactNode; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="hud-cut-sm border border-cyan-glow/10 bg-black/20 p-3">
      <legend className="hud-eyebrow px-1.5 text-[10px] text-cyan-glow/80">{title}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <Input value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

export function TextAreaField({ label, value, onChange, rows = 2 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <Field label={label} className="sm:col-span-2">
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="hud-cut-sm border border-cyan-glow/15 bg-space-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-glow/60"
      />
    </Field>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  min,
  step,
  optional,
}: {
  label: ReactNode;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  hint?: string;
  min?: number;
  step?: number;
  optional?: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      <NumberInput
        nullable={optional === true}
        min={min ?? -1e15}
        step={step ?? 1}
        decimals={4}
        quick={false}
        value={value}
        placeholder={optional ? "(par défaut)" : "0"}
        onChange={(v: number | undefined) => onChange(v === undefined ? (optional ? undefined : 0) : v)}
        className="w-full"
      />
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; icon?: ReactNode }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  // Options illustrées (ressources…) : liste déroulante avec icônes.
  if (options.some((o) => o.icon)) {
    return (
      <Field label={label} hint={hint}>
        <IconSelect value={value} onChange={onChange} options={options} ariaLabel={label} />
      </Field>
    );
  }
  return (
    <Field label={label} hint={hint}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 border border-cyan-glow/15 bg-space-900/80 px-3 text-sm text-slate-100 outline-none focus:border-cyan-glow/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function CheckboxField({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex items-start gap-2 pt-5 text-sm text-slate-200">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 accent-cyan-400" />
      <span>
        {label}
        {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}

/** Liste « clé → nombre » (coûts en ressources, prérequis…). */
export function KeyNumberMapField({
  label,
  value,
  onChange,
  options,
  hint,
  valueLabel = "Quantité",
}: {
  label: string;
  value: Record<string, number> | undefined;
  onChange: (v: Record<string, number>) => void;
  options: { value: string; label: string; icon?: ReactNode }[];
  hint?: string;
  valueLabel?: string;
}) {
  const entries = Object.entries(value ?? {});
  const unused = options.filter((o) => !(o.value in (value ?? {})));
  const set = (next: [string, number][]) => onChange(Object.fromEntries(next));

  return (
    <Field label={label} hint={hint} className="sm:col-span-2">
      <div className="flex flex-col gap-1.5">
        {entries.length === 0 && <p className="text-xs text-slate-500">Aucun.</p>}
        {entries.map(([key, num], i) => (
          <div key={key} className="flex items-center gap-2">
            {options.some((o) => o.icon) ? (
              <IconSelect
                value={key}
                onChange={(v) => set(entries.map((en, j) => (j === i ? [v, en[1]] : en)))}
                options={[options.find((o) => o.value === key) ?? { value: key, label: `${key} (inconnu)` }, ...unused]}
                className="h-9 flex-1"
              />
            ) : (
              <select
                value={key}
                onChange={(e) => set(entries.map((en, j) => (j === i ? [e.target.value, en[1]] : en)))}
                className="h-9 min-w-0 flex-1 border border-cyan-glow/15 bg-space-900/80 px-2 text-sm text-slate-100"
              >
                {[options.find((o) => o.value === key) ?? { value: key, label: `${key} (inconnu)` }, ...unused].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
            <NumberInput
              min={-1e15}
              decimals={4}
              quick={false}
              aria-label={valueLabel}
              value={num}
              onChange={(v) => set(entries.map((en, j) => (j === i ? [en[0], v] : en)))}
              className="w-36"
            />
            <Button variant="ghost" size="icon" type="button" onClick={() => set(entries.filter((_, j) => j !== i))}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {unused.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="self-start"
            onClick={() => set([...entries, [unused[0].value, 0]])}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter
          </Button>
        )}
      </div>
    </Field>
  );
}

export const RESOURCE_OPTIONS = RESOURCE_LIST.map((r) => ({ value: r.id as string, label: r.name, icon: <ResourceIcon id={r.id} /> }));

export function ResourceMapField(props: {
  label: string;
  value: Record<string, number> | undefined;
  onChange: (v: Record<string, number>) => void;
  hint?: string;
}) {
  return <KeyNumberMapField {...props} options={RESOURCE_OPTIONS} />;
}

/** Liste de nombres séparés par des virgules (table de production…). */
export function NumberListField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number[];
  onChange: (v: number[]) => void;
  hint?: string;
}) {
  const [text, setText] = useState(value.join(", "));
  return (
    <Field label={label} hint={hint} className="sm:col-span-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const nums = text
            .split(/[,;\s]+/)
            .filter(Boolean)
            .map(Number)
            .filter((n) => Number.isFinite(n));
          onChange(nums);
          setText(nums.join(", "));
        }}
      />
    </Field>
  );
}

/** Chemin d'image + envoi d'un fichier dans la collection game_assets. */
export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  return (
    <Field label={label} hint="Chemin (/assets/…) ou image envoyée (webp conseillé, carré)." className="sm:col-span-2">
      <div className="flex items-center gap-2">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-space-800">
          {value && <img src={value} alt="" className="h-full w-full object-cover" />}
        </div>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setUploading(true);
            try {
              onChange(await adminUploadAsset(file));
              toast.success("Image envoyée.");
            } catch {
              toast.error("Envoi impossible (collection game_assets et droits admin requis).");
            } finally {
              setUploading(false);
            }
          }}
        />
        <Button variant="outline" size="sm" type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <ImageUp className="mr-1 h-3.5 w-3.5" /> {uploading ? "Envoi…" : "Envoyer"}
        </Button>
      </div>
    </Field>
  );
}

export function formatSeconds(total: number): string {
  if (!total) return "0 s";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  return [h && `${h} h`, m && `${m} min`, s && `${s} s`].filter(Boolean).join(" ");
}
