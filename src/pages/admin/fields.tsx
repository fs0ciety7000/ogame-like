import { useRef, useState, type ReactNode } from "react";
import { ImageUp, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RESOURCE_LIST } from "@/game/resources";
import { adminUploadAsset } from "@/services/adminService";
import { cn } from "@/lib/utils";

/* Champs de formulaire de l'administration : chacun reçoit une valeur et
 * un onChange, sans état propre (l'éditeur parent tient le brouillon). */

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-white/5 bg-black/10 p-3">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-glow/80">{title}</legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
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

export function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label} className="sm:col-span-2">
      <textarea
        value={value}
        rows={2}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-space-800/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-glow/50"
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
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  hint?: string;
  min?: number;
  step?: number;
  optional?: boolean;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type="number"
        min={min}
        step={step ?? "any"}
        value={value ?? ""}
        placeholder={optional ? "(par défaut)" : undefined}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") onChange(optional ? undefined : 0);
          else onChange(Number(raw));
        }}
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
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-10 rounded-lg border border-white/10 bg-space-800/70 px-3 text-sm text-slate-100 outline-none focus:border-cyan-glow/50"
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
  options: { value: string; label: string }[];
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
            <select
              value={key}
              onChange={(e) => set(entries.map((en, j) => (j === i ? [e.target.value, en[1]] : en)))}
              className="h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-space-800/70 px-2 text-sm text-slate-100"
            >
              {[options.find((o) => o.value === key) ?? { value: key, label: `${key} (inconnu)` }, ...unused].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <Input
              type="number"
              step="any"
              aria-label={valueLabel}
              value={num}
              onChange={(e) => set(entries.map((en, j) => (j === i ? [en[0], Number(e.target.value) || 0] : en)))}
              className="h-9 w-32"
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

export const RESOURCE_OPTIONS = RESOURCE_LIST.map((r) => ({ value: r.id as string, label: `${r.emoji} ${r.name}` }));

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
