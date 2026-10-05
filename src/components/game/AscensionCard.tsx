import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ASCENSION_INSIGNIA, ASCENSION_RULES, ascensionCount, ascensionLabel, ascensionShieldUntil, canAscend, upkeepFreeUntil } from "@/game/ascension";
import { assetUrl } from "@/lib/assets";
import { BUILDINGS } from "@/game/buildings";
import { ascendEmpire, GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { cn, formatDuration } from "@/lib/utils";

/** Insigne d'ascension (v3.4, 5.15) ; 5.15.13 : l'insigne généré répété une fois par
 *  ascension (Ascension II = 2 insignes, jusqu'à 5), sans étoile en doublon.
 *  `full` montre les cinq emplacements (ceux à venir en grisé) et « Ascension III ». */
export function AscensionStars({ count, full, className }: { count?: number; full?: boolean; className?: string }) {
  const n = ascensionCount({ ascensions: count });
  if (n <= 0) return null;
  const label = ascensionLabel(n);
  const slots = full ? ASCENSION_RULES.maxAscensions : n;
  const size = full ? "h-7 w-7" : "h-5 w-5";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-gold-glow", className)} title={`${label} sur ${ASCENSION_RULES.maxAscensions}`} aria-label={label}>
      <span className={cn("inline-flex items-center", full ? "gap-0.5" : "-space-x-1.5")}>
        {Array.from({ length: slots }, (_, i) =>
          ASCENSION_INSIGNIA ? (
            <img key={i} src={assetUrl(ASCENSION_INSIGNIA)} alt="" className={cn(size, "object-contain", i >= n && "opacity-25 grayscale")} />
          ) : (
            <Sparkles key={i} className={cn(full ? "h-4 w-4" : "h-3.5 w-3.5", i >= n && "text-slate-600")} />
          ),
        )}
      </span>
      {full && <span className="font-mono text-[10px] uppercase tracking-[0.16em]">{label}</span>}
    </span>
  );
}

/** 5.15 : seuil d'apparition de l'Ascension (75 % des niveaux des bâtiments de base, ou déjà ascendé). */
export const ASCENSION_UNLOCK_PCT = 0.75;

export function ascensionProgress(player: { buildings: Record<string, { level?: number } | undefined>; ascensions?: number }) {
  const base = BUILDINGS.filter((b) => !b.endgame);
  const levels = base.reduce((a, b) => a + (player.buildings[b.id]?.level ?? 0), 0);
  const maxLevels = base.reduce((a, b) => a + b.maxLevel, 0);
  const needed = Math.ceil(maxLevels * ASCENSION_UNLOCK_PCT);
  return { levels, maxLevels, needed, unlocked: ascensionCount(player) > 0 || levels >= needed };
}

/** Carte d'ascension (page Ascension) : bonus actuels, conditions, lancement. */
export function AscensionCard() {
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  if (!player) return null;
  const now = Date.now();
  const count = ascensionCount(player);
  if (!ascensionProgress(player).unlocked) return null;
  const check = canAscend(player, queues, now);
  const shield = ascensionShieldUntil(player) - now;
  const upkeep = upkeepFreeUntil(player) - now;
  const nextProd = Math.round((count + 1) * ASCENSION_RULES.productionPerAscension * 100);
  const nextTime = Math.round((count + 1) * ASCENSION_RULES.buildTimePerAscension * 100);

  const go = async () => {
    setBusy(true);
    try {
      await ascendEmpire();
      toast.success("Ascension accomplie : ton empire renaît, plus fort.");
      setOpen(false);
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Ascension impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="relative flex flex-col gap-3 overflow-hidden border-gold-glow/30 p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,200,80,0.12),transparent_60%)]" />
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="h-5 w-5 text-gold-glow" />
        <h2 className="hud-title text-sm">Ascension</h2>
        <AscensionStars count={count} />
        <span className="ml-auto font-mono text-xs text-slate-400">
          {count} / {ASCENSION_RULES.maxAscensions}
        </span>
      </div>
      <p className="text-sm text-slate-300">
        {count > 0 ? (
          <>
            Bonus permanents : <strong className="text-gold-glow">+{Math.round(count * ASCENSION_RULES.productionPerAscension * 100)} % de production</strong> et{" "}
            <strong className="text-gold-glow">−{Math.round(count * ASCENSION_RULES.buildTimePerAscension * 100)} % de durée de construction</strong>.
          </>
        ) : (
          <>Quand tous tes bâtiments sont au niveau maximal, tu peux reconstruire ton empire contre un bonus permanent.</>
        )}
      </p>
      {(shield > 0 || upkeep > 0) && (
        <p className="text-xs text-mint-glow">
          {shield > 0 && <>Bouclier d'ascension : encore {formatDuration(Math.floor(shield / 1000))}. </>}
          {upkeep > 0 && <>Entretien de flotte suspendu : encore {formatDuration(Math.floor(upkeep / 1000))}.</>}
        </p>
      )}
      {count < ASCENSION_RULES.maxAscensions && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" disabled={!check.ok} onClick={() => setOpen(true)}>
            <Sparkles className="mr-1.5 h-4 w-4" /> S'élever ({count + 1}ᵉ ascension)
          </Button>
          <span className="text-xs text-slate-500">
            {check.ok ? `Prochain palier : +${nextProd} % de production, −${nextTime} % de durée de construction.` : check.reason}
            {!check.ok && check.missing.length > 0 && ` (${check.missing.length} bâtiment${check.missing.length > 1 ? "s" : ""} à terminer : ${check.missing.map((m) => m.name).join(", ")})`}
          </span>
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{count + 1}ᵉ ascension</DialogTitle>
          <DialogDescription>Ton empire renaît : c'est définitif.</DialogDescription>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            <li>• Tous tes bâtiments reviennent au <strong>niveau 1</strong> (les déblocages restent acquis).</li>
            <li>• Tes ressources reviennent au <strong>stock de départ</strong>.</li>
            <li>• Tu gardes tes technologies, ta flotte, tes défenses, tes succès, tes titres, ton XP et ton rang.</li>
            <li>
              • Bonus permanent : <strong className="text-gold-glow">+{nextProd} % de production</strong> et <strong className="text-gold-glow">−{nextTime} % de durée de construction</strong>.
            </li>
            <li>
              • Bouclier de {ASCENSION_RULES.shieldHours} h contre les attaques, entretien de flotte suspendu {ASCENSION_RULES.upkeepFreeDays} jours. Au-delà de la capacité des hangars, tes vaisseaux restent mais tu ne
              peux plus en construire.
            </li>
          </ul>
          <label className="mt-3 flex flex-col gap-1 text-xs text-slate-400">
            Tape ton pseudo pour confirmer
            <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={player.pseudo} />
          </label>
          <Button className="mt-3 w-full" disabled={busy || confirm.trim() !== player.pseudo} onClick={() => void go()}>
            <Sparkles className="mr-1.5 h-4 w-4" /> S'élever
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
