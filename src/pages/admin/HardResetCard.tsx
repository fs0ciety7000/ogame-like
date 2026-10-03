import { ResourceIcon } from "@/components/ui/game-icon";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { DEFAULT_RESET_OPTIONS, type ResetOptions } from "@/game/reset";
import { RESOURCE_LIST } from "@/game/resources";
import { adminHardReset, adminListPlayers, type AdminPlayer } from "@/services/adminService";
import { CheckboxField } from "@/pages/admin/fields";
import type { ResourceId } from "@/types/game";

const OPTION_LABELS: { key: keyof Omit<ResetOptions, "starterKit">; label: string; hint?: string }[] = [
  { key: "xp", label: "XP et rang (total et saison)" },
  { key: "achievements", label: "Succès débloqués" },
  { key: "reports", label: "Rapports de combat et d'espionnage, notifications" },
  { key: "alliances", label: "Alliances : trésor, recherches et journal", hint: "Reset global uniquement ; les membres restent." },
  { key: "titles", label: "Titres gagnés et palmarès des saisons", hint: "Le palmarès n'est effacé qu'en reset global." },
];

/** Hard reset de la progression : un joueur ou toute la galaxie. */
export function HardResetCard() {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [scope, setScope] = useState<"all" | "player">("all");
  const [uid, setUid] = useState("");
  const [options, setOptions] = useState<ResetOptions>(() => structuredClone(DEFAULT_RESET_OPTIONS));
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminListPlayers()
      .then((list) => setPlayers([...list].sort((a, b) => a.pseudo.localeCompare(b.pseudo))))
      .catch(() => setPlayers([]));
  }, []);

  const target = players.find((p) => p.uid === uid);
  const expected = scope === "all" ? "RESET" : target?.pseudo ?? "";
  const ready = !!expected && confirmText === expected;

  const run = async () => {
    setBusy(true);
    try {
      const out = await adminHardReset({ scope, uid: scope === "player" ? uid : undefined, confirm: confirmText, options });
      toast.success(`Reset effectué : ${out.players} joueur(s), ${out.fleets} flotte(s) et ${out.reports} rapport(s) supprimés.`, {
        description: `Sauvegarde créée avant le reset : ${out.backup}`,
        duration: 12000,
      });
      setConfirmText("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 border-danger-glow/40 p-4 md:col-span-2">
      <h3 className="hud-title flex items-center gap-2 text-sm text-danger-glow">
        <RotateCcw className="h-4 w-4" /> Hard reset de la progression
      </h3>
      <p className="text-xs text-slate-400">
        Ressources, bâtiments, unités, technologies, files, contrats, flottes en vol et champs de débris repartent de zéro. Comptes, pseudos et appartenance
        aux alliances sont conservés, et la protection débutant (72 h) est rétablie. <strong className="text-slate-200">Une sauvegarde complète est faite
        automatiquement juste avant.</strong>
      </p>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1.5 text-slate-200">
          <input type="radio" className="accent-red-400" checked={scope === "all"} onChange={() => setScope("all")} /> Tous les joueurs ({players.length})
        </label>
        <label className="flex items-center gap-1.5 text-slate-200">
          <input type="radio" className="accent-red-400" checked={scope === "player"} onChange={() => setScope("player")} /> Un joueur :
        </label>
        <select
          value={uid}
          disabled={scope !== "player"}
          onChange={(e) => setUid(e.target.value)}
          className="h-9 border border-cyan-glow/15 bg-space-900/80 px-2 text-sm text-slate-100 disabled:opacity-40"
        >
          <option value="">— choisir —</option>
          {players.map((p) => (
            <option key={p.uid} value={p.uid}>
              {p.pseudo}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-x-4 sm:grid-cols-2">
        {OPTION_LABELS.map((o) => (
          <CheckboxField
            key={o.key}
            label={`Remettre à zéro : ${o.label}`}
            hint={o.hint}
            checked={options[o.key]}
            onChange={(v) => setOptions((prev) => ({ ...prev, [o.key]: v }))}
          />
        ))}
      </div>

      <div>
        <p className="mb-1 text-xs text-slate-400">Kit de départ (en plus des 100 ferraille et 50 énergie de base)</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {RESOURCE_LIST.map((r) => (
            <label key={r.id} className="flex flex-col gap-1 text-[11px] text-slate-400">
              <span>
                <ResourceIcon id={r.id} /> {r.name}
              </span>
              <NumberInput
                size="sm"
                step={100}
                value={options.starterKit[r.id as ResourceId] ?? 0}
                onChange={(v) => setOptions((prev) => ({ ...prev, starterKit: { ...prev.starterKit, [r.id]: v } }))}
                aria-label={r.name}
                className="w-full"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2 border-t border-white/5 pt-3">
        <label className="flex flex-1 flex-col gap-1 text-xs text-slate-400">
          {scope === "all" ? "Tape RESET pour confirmer" : target ? `Tape le pseudo « ${target.pseudo} » pour confirmer` : "Choisis un joueur"}
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder={expected} />
        </label>
        <Button variant="danger" disabled={!ready || busy} onClick={() => void run()}>
          {busy ? "Sauvegarde puis reset…" : scope === "all" ? "Tout remettre à zéro" : "Remettre ce joueur à zéro"}
        </Button>
      </div>
    </Card>
  );
}
