import { useState } from "react";
import { AmberAmount } from "@/components/ui/amber";
import { NumberInput } from "@/components/ui/number-input";
import { toast } from "sonner";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currentGameContent } from "@/game/content";
import { describePassReward, type PassReward, type SeasonPassConfig } from "@/game/seasonPass";
import { CAPSULES, type CapsuleType } from "@/game/synthesis";
import { resetContentSection, saveContentSection, useContentStore } from "@/services/contentService";
import { NumberField, Section } from "@/pages/admin/fields";

/* v4.3 : paliers et points du passe de saison, sans toucher au code. */

const POINT_LABELS: Record<string, string> = {
  contract: "Contrat du jour",
  bounty: "Prime Kesh'Vaar",
  raidRepelled: "Raid repoussé",
  victory: "Combat gagné",
  bossAssault: "Assaut sur un boss",
  dailyLogin: "Connexion du jour",
  mission: "Mission terminée",
  vendetta: "Vendetta gagnée",
  chronicle: "Épisode des Chroniques",
  seasonBoss: "Participation au boss de saison",
  allianceBoss: "Boss d'alliance abattu",
  allianceBossTry: "Participation au boss d'alliance",
  coalition: "Coalition gagnée contre un seigneur",
};

const KINDS: { value: PassReward["kind"]; label: string }[] = [
  { value: "production", label: "Production (h)" },
  { value: "amber", label: "Ambre" },
  { value: "dossier", label: "Dossiers" },
  { value: "capsule", label: "Capsule" },
  { value: "relic", label: "Relique" },
  { value: "tokens", label: "Jetons du casino" },
  { value: "cosmetic", label: "Bannière + titre" },
];

function blank(kind: PassReward["kind"]): PassReward {
  switch (kind) {
    case "production":
      return { kind, hours: 2 };
    case "amber":
      return { kind, amount: 20 };
    case "dossier":
      return { kind, count: 1 };
    case "capsule":
      return { kind, capsule: "assault", level: 3 };
    case "relic":
      return { kind, rarity: "rare" };
    case "tokens":
      return { kind, count: 1 };
    default:
      return { kind: "cosmetic" };
  }
}

const sel = "h-8 border border-white/15 bg-space-950 px-1.5 text-xs text-slate-200";
const num = { size: "sm", stepper: false, quick: false, meter: false, className: "w-20" } as const;

function RewardEditor({ value, onChange, onRemove }: { value: PassReward; onChange: (r: PassReward) => void; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-1 border border-white/10 bg-white/[0.02] p-1">
      <select className={sel} value={value.kind} onChange={(e) => onChange(blank(e.target.value as PassReward["kind"]))}>
        {KINDS.map((k) => (
          <option key={k.value} value={k.value}>
            {k.label}
          </option>
        ))}
      </select>
      {value.kind === "production" && <NumberInput {...num} min={1} value={value.hours} suffix="h" aria-label="Heures" onChange={(v) => onChange({ ...value, hours: v })} />}
      {value.kind === "amber" && <NumberInput {...num} min={1} value={value.amount} aria-label="Ambre" onChange={(v) => onChange({ ...value, amount: v })} />}
      {value.kind === "dossier" && <NumberInput {...num} min={1} value={value.count} aria-label="Dossiers" onChange={(v) => onChange({ ...value, count: v })} />}
      {value.kind === "tokens" && <NumberInput {...num} min={1} max={20} value={value.count} aria-label="Jetons" onChange={(v) => onChange({ ...value, count: v })} />}
      {value.kind === "capsule" && (
        <>
          <select className={sel} value={value.capsule} onChange={(e) => onChange({ ...value, capsule: e.target.value as CapsuleType })}>
            {Object.entries(CAPSULES).map(([id, c]) => (
              <option key={id} value={id}>
                {c.name}
              </option>
            ))}
          </select>
          <NumberInput {...num} min={1} max={10} value={value.level} aria-label="Niveau" onChange={(v) => onChange({ ...value, level: v })} />
        </>
      )}
      {value.kind === "relic" && (
        <select className={sel} value={value.rarity} onChange={(e) => onChange({ ...value, rarity: e.target.value as "rare" })}>
          {["common", "rare", "epic", "legendary"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      )}
      <button type="button" title="Retirer" className="px-1 text-slate-500 hover:text-danger-glow" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

export function PassPanel() {
  const customized = useContentStore((s) => s.customized.includes("seasonPass"));
  const [cfg, setCfg] = useState<SeasonPassConfig>(() => structuredClone(currentGameContent().seasonPass));
  const [busy, setBusy] = useState(false);
  const setTier = (i: number, list: PassReward[]) => setCfg((c) => ({ ...c, tiers: c.tiers.map((t, j) => (j === i ? list : t)) }));

  const save = async () => {
    setBusy(true);
    try {
      await saveContentSection("seasonPass", { ...cfg, rules: { ...cfg.rules, tiers: cfg.tiers.length } });
      toast.success("Passe enregistré (appliqué aussi par le serveur).");
    } catch (err) {
      toast.error(`Enregistrement impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const amber = cfg.tiers.flat().reduce((a, r) => a + (r.kind === "amber" ? r.amount : 0), 0);
  const tokens = cfg.tiers.flat().reduce((a, r) => a + (r.kind === "tokens" ? r.count : 0), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base text-white">Passe de saison</h2>
        <Badge variant={customized ? "warning" : "default"}>{customized ? "Personnalisé" : "Valeurs du code"}</Badge>
        <span className="text-xs text-slate-500">
          {cfg.tiers.length} paliers · <AmberAmount value={amber} /> et {tokens} jeton{tokens > 1 ? "s" : ""} du casino au total
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || !customized}
            onClick={async () => {
              await resetContentSection("seasonPass");
              setCfg(structuredClone(currentGameContent().seasonPass));
              toast.success("Passe par défaut restauré.");
            }}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Valeurs par défaut
          </Button>
          <Button size="sm" disabled={busy} onClick={() => void save()}>
            <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
          </Button>
        </div>
      </div>
      <Card className="flex flex-col gap-3 p-4">
        <Section title="Points">
          <NumberField label="Points par palier" value={cfg.rules.pointsPerTier} min={1} onChange={(v) => setCfg((c) => ({ ...c, rules: { ...c.rules, pointsPerTier: v ?? 40 } }))} />
          {Object.keys(cfg.points).map((k) => (
            <NumberField key={k} label={POINT_LABELS[k] ?? k} value={cfg.points[k as keyof typeof cfg.points]} min={0} onChange={(v) => setCfg((c) => ({ ...c, points: { ...c.points, [k]: v ?? 0 } }))} />
          ))}
        </Section>
      </Card>
      <Card className="flex flex-col gap-1.5 p-4">
        <h3 className="mb-1 text-sm text-white">Paliers</h3>
        {cfg.tiers.map((list, i) => (
          <div key={i} className="flex flex-wrap items-center gap-1.5 border-b border-white/5 py-1.5">
            <span className="w-16 font-mono text-xs text-slate-500">Palier {i + 1}</span>
            {list.map((r, j) => (
              <RewardEditor key={j} value={r} onChange={(nr) => setTier(i, list.map((x, k) => (k === j ? nr : x)))} onRemove={() => setTier(i, list.filter((_, k) => k !== j))} />
            ))}
            <button type="button" title="Ajouter une récompense" className="px-1 text-slate-500 hover:text-cyan-glow" onClick={() => setTier(i, [...list, blank("amber")])}>
              <Plus className="h-3.5 w-3.5" />
            </button>
            <span className="ml-auto hidden text-[11px] text-slate-500 lg:inline">{list.map((r) => describePassReward(r, "2026-10")).join(" · ")}</span>
          </div>
        ))}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setCfg((c) => ({ ...c, tiers: [...c.tiers, [blank("amber")]] }))}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Ajouter un palier
          </Button>
          <Button size="sm" variant="ghost" disabled={cfg.tiers.length <= 1} onClick={() => setCfg((c) => ({ ...c, tiers: c.tiers.slice(0, -1) }))}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Retirer le dernier
          </Button>
        </div>
      </Card>
    </div>
  );
}
