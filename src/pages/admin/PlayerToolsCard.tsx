import { useState } from "react";
import { toast } from "sonner";
import { FastForward, FlaskConical, Gift, Sparkles, Timer } from "lucide-react";
import { allCommanders, COMMANDERS } from "@/game/commanders";
import { RARITIES, RELICS } from "@/game/relics";
import { CAPSULE_TYPES, CAPSULES } from "@/game/synthesis";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { ResourceIcon } from "@/components/ui/game-icon";
import { RESOURCE_LIST } from "@/game/resources";
import { adminPlayerAction, type AdminPlayer } from "@/services/adminService";
import { formatNumber } from "@/lib/utils";

/* v5.5 : actions directes sur un joueur, passées par le serveur et consignées au journal admin. */

export function PlayerToolsCard({ player, onDone }: { player: AdminPlayer; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [grant, setGrant] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");

  const run = async (label: string, task: () => Promise<Record<string, unknown>>) => {
    setBusy(true);
    try {
      const out = await task();
      toast.success(label, { description: summarize(out) });
      onDone();
    } catch (err) {
      toast.error(`Impossible : ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const granted = Object.values(grant).some((v) => v > 0);

  return (
    <div className="flex flex-col gap-3 border border-cyan-glow/20 bg-cyan-glow/[0.03] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200" title="Constructions, recherches, unités et missions se terminent aussitôt ; aucun délai entre deux changements de poste d'officier.">
          <input
            type="checkbox"
            className="accent-cyan-glow"
            checked={!!player.testMode}
            disabled={busy}
            onChange={(e) => void run(e.target.checked ? "Compte test activé" : "Compte test désactivé", () => adminPlayerAction(player.id, { action: "testMode", on: e.target.checked }))}
          />
          <FlaskConical className="h-4 w-4 text-cyan-glow" /> Compte test
        </label>
        <span className="text-xs text-slate-500">chantiers instantanés, aucun délai d'officier</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void run("Tout est terminé", () => adminPlayerAction(player.id, { action: "finishAll" }))}>
            <FastForward className="mr-1 h-3.5 w-3.5" /> Tout terminer
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void run("Délais d'officiers levés", () => adminPlayerAction(player.id, { action: "officers" }))}>
            <Timer className="mr-1 h-3.5 w-3.5" /> Lever les délais d'officiers
          </Button>
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-slate-300">
          <Gift className="mr-1 inline h-3.5 w-3.5 text-gold-glow" /> Rendre des ressources (ajoutées au stock actuel)
        </summary>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-4">
          {RESOURCE_LIST.map((r) => (
            <label key={r.id} className="flex flex-col gap-1 text-[11px] text-slate-400">
              <span>
                <ResourceIcon id={r.id} /> {r.name}
              </span>
              <NumberInput size="sm" step={100} value={grant[r.id] ?? 0} onChange={(v) => setGrant((g) => ({ ...g, [r.id]: v }))} aria-label={r.name} className="w-full" />
            </label>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input value={reason} maxLength={300} placeholder="Motif (obligatoire, consigné au journal)" className="h-8 flex-1" onChange={(e) => setReason(e.target.value)} />
          <Button
            size="sm"
            disabled={busy || !granted || reason.trim().length < 5}
            onClick={() =>
              void run("Ressources rendues", () => adminPlayerAction(player.id, { action: "grant", resources: grant, reason: reason.trim() })).then(() => {
                setGrant({});
                setReason("");
              })
            }
          >
            Rendre
          </Button>
        </div>
      </details>
      <GiftItems player={player} busy={busy} run={run} />
    </div>
  );
}

/** v5.14 : offrir un officier (rare ou de saison compris), une relique ou une capsule. */
function GiftItems({ player, busy, run }: { player: AdminPlayer; busy: boolean; run: (label: string, task: () => Promise<Record<string, unknown>>) => Promise<void> }) {
  const [officerId, setOfficerId] = useState(COMMANDERS.find((c) => c.rare)?.id ?? "");
  const [template, setTemplate] = useState(RELICS.find((t) => !t.disabled)?.id ?? "");
  const [rarity, setRarity] = useState<string>("epic");
  const [capsule, setCapsule] = useState<string>(CAPSULE_TYPES[0]);
  const [level, setLevel] = useState(5);
  const [amber, setAmber] = useState(player.bounties?.amber ?? 0);
  const [reason, setReason] = useState("");
  const ok = reason.trim().length >= 5 && !busy;
  const select = "h-8 border border-white/10 bg-black/30 px-2 text-sm text-slate-100";
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-slate-300">
        <Sparkles className="mr-1 inline h-3.5 w-3.5 text-violet-glow" /> Offrir un officier, une relique, une capsule ou modifier l'Ambre
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        <Input value={reason} maxLength={300} placeholder="Motif (obligatoire, consigné au journal et montré au joueur)" className="h-8" onChange={(e) => setReason(e.target.value)} />
        <div className="flex flex-wrap items-center gap-2">
          <select className={select} value={officerId} onChange={(e) => setOfficerId(e.target.value)} aria-label="Officier">
            {allCommanders().map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} {c.name}
                {c.rare ? " (rare)" : c.season ? ` (saison ${c.season.label})` : ""}
              </option>
            ))}
          </select>
          <Button size="sm" variant="secondary" disabled={!ok || !officerId} onClick={() => void run("Officier offert", () => adminPlayerAction(player.id, { action: "officer", officerId, reason: reason.trim() }))}>
            Offrir l'officier
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={select} value={template} onChange={(e) => setTemplate(e.target.value)} aria-label="Relique">
            {RELICS.filter((t) => !t.disabled).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select className={select} value={rarity} onChange={(e) => setRarity(e.target.value)} aria-label="Rareté">
            {RARITIES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <Button size="sm" variant="secondary" disabled={!ok || !template} onClick={() => void run("Relique offerte", () => adminPlayerAction(player.id, { action: "relic", template, rarity, reason: reason.trim() }))}>
            Offrir la relique
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className={select} value={capsule} onChange={(e) => setCapsule(e.target.value)} aria-label="Capsule">
            {CAPSULE_TYPES.map((c) => (
              <option key={c} value={c}>
                {CAPSULES[c].name}
              </option>
            ))}
          </select>
          <NumberInput size="sm" step={1} min={1} max={10} value={level} onChange={(v) => setLevel(Math.max(1, Math.min(10, v)))} aria-label="Niveau" className="w-20" />
          <Button size="sm" variant="secondary" disabled={!ok} onClick={() => void run("Capsule offerte", () => adminPlayerAction(player.id, { action: "capsule", capsule, level, reason: reason.trim() }))}>
            Offrir la capsule
          </Button>
        </div>
        {/* 5.18 : solde d'Ambre fixé (le joueur est prévenu, motif au journal). */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">
            Ambre : <span className="font-mono text-slate-200">{formatNumber(player.bounties?.amber ?? 0)}</span> → nouveau solde
          </span>
          <NumberInput size="sm" step={10} min={0} value={amber} onChange={(v) => setAmber(Math.max(0, v))} aria-label="Nouveau solde d'Ambre" className="w-28" />
          <Button size="sm" variant="secondary" disabled={!ok} onClick={() => void run("Ambre modifiée", () => adminPlayerAction(player.id, { action: "amber", amount: amber, reason: reason.trim() }))}>
            Fixer l'Ambre
          </Button>
        </div>
      </div>
    </details>
  );
}

function summarize(out: Record<string, unknown>): string {
  if ("given" in out) return Object.entries(out.given as Record<string, number>).map(([k, v]) => `${formatNumber(v)} ${RESOURCE_LIST.find((r) => r.id === k)?.name ?? k}`).join(", ");
  if ("buildings" in out) {
    const r = out as Record<string, number>;
    return `${r.buildings} bâtiment(s), ${r.researches} recherche(s), ${r.units} unité(s), ${r.missions} mission(s), ${r.officers} délai(s) d'officier`;
  }
  if ("officers" in out) return `${out.officers} officier(s) libéré(s)`;
  for (const k of ["officier", "relique", "capsule", "ambre"]) if (k in out) return String(out[k]);
  return "";
}
