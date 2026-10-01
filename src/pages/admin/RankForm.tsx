import { type RankDef } from "@/game/ranks";
import { formatNumber } from "@/lib/utils";
import { ImageField, NumberField, Section, TextField } from "@/pages/admin/fields";

const ID_HINT_NEW = "Minuscules, chiffres, _ — non modifiable une fois enregistré.";
const ID_HINT_LOCKED = "Identifiant du rang : non modifiable.";

export function newRank(): RankDef {
  return { id: "nouveau_rang", name: "Nouveau rang", family: "Nouveau rang", xp: 500_000, image: "/assets/ranks/elite.webp" };
}

/** Durée indicative pour atteindre un seuil, à un rythme donné. */
function eta(xp: number, perDay: number): string {
  const days = xp / perDay;
  if (days < 1) return "moins d'un jour";
  if (days < 14) return `${Math.round(days)} j`;
  if (days < 60) return `${Math.round(days / 7)} sem.`;
  return `${(days / 30).toFixed(1).replace(".", ",")} mois`;
}

/** Fiche d'un rang : nom, famille, XP totale requise, emblème. */
export function RankForm({ value: r, onChange, isNew }: { value: RankDef; onChange: (next: RankDef) => void; isNew: boolean }) {
  const set = (patch: Partial<RankDef>) => onChange({ ...r, ...patch });
  return (
    <div className="flex flex-col gap-3">
      <Section title="Rang">
        <TextField label="Identifiant" value={r.id} disabled={!isNew} hint={isNew ? ID_HINT_NEW : ID_HINT_LOCKED} onChange={(v) => set({ id: v })} />
        <TextField label="Nom affiché" value={r.name} onChange={(v) => set({ name: v })} />
        <TextField label="Famille" value={r.family} hint="Regroupe les paliers (Fer, Bronze…) dans les statistiques." onChange={(v) => set({ family: v })} />
        <NumberField label="XP totale requise" value={r.xp} min={0} step={100} onChange={(v) => set({ xp: v ?? 0 })} />
        <div className="sm:col-span-2">
          <ImageField label="Emblème" value={r.image} onChange={(v) => set({ image: v })} />
        </div>
        <p className="text-xs text-slate-500 sm:col-span-2">
          {formatNumber(r.xp)} XP ≈ {eta(r.xp, 3000)} pour un joueur très actif (3 000 XP/j), {eta(r.xp, 800)} pour un joueur régulier (800 XP/j). Les rangs sont
          triés automatiquement par XP.
        </p>
      </Section>
    </div>
  );
}
