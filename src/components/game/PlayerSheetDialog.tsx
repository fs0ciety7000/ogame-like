import { useEffect, useState, type ReactNode } from "react";
import { KESH, rankName } from "@/game/bounties";
import { assetUrl } from "@/lib/assets";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PlayerName } from "@/components/ui/player-name";
import { AscensionStars } from "@/components/game/AscensionCard";
import { GameIcon } from "@/components/ui/game-icon";
import { fetchPlayerSheet, type PlayerSheet } from "@/services/playerService";
import { useLeviathan } from "@/services/leviathanService";
import { leviathanRanking } from "@/game/leviathan";
import { getRankIcon, getRankLabel } from "@/game/ranks";
import { seasonLabel } from "@/game/seasons";
import { cn, formatNumber } from "@/lib/utils";

/* Fiche publique détaillée d'un joueur (v3.7) : rang, colonies, faits
   d'armes, titres, saisons passées et participation au Léviathan. */

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border border-cyan-glow/15 bg-white/[0.02] px-2.5 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-100">{value}</p>
    </div>
  );
}

function sinceLabel(ms?: number) {
  if (!ms) return null;
  return new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function PlayerSheetDialog({ target, onClose, actions }: { target: { uid: string; pseudo: string } | null; onClose: () => void; actions?: ReactNode }) {
  const [sheet, setSheet] = useState<PlayerSheet | null>(null);
  const [error, setError] = useState(false);
  const leviathan = useLeviathan();

  useEffect(() => {
    if (!target) return;
    let alive = true;
    setSheet(null);
    setError(false);
    fetchPlayerSheet(target.uid)
      .then((s) => alive && setSheet(s))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [target]);

  const ranking = leviathan ? leviathanRanking(leviathan) : [];
  const levIndex = target ? ranking.findIndex((r) => r.uid === target.uid) : -1;
  const feats = sheet?.feats;
  const entry = sheet?.entry;

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn("max-w-xl", feats?.kesh?.frame && "kesh-frame")}>
        <div className="flex items-center gap-3 pr-6">
          <img src={getRankIcon(entry?.xp ?? 0)} alt="" className="h-14 w-14 shrink-0 object-contain" />
          {feats?.kesh?.emblem && <img src={assetUrl(KESH.emblem)} alt="Emblème de l'Essaim" title="Emblème de l'Essaim Kesh'Vaar" className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(255,190,80,0.4)]" />}
          <div className="min-w-0">
            <DialogTitle className="flex flex-wrap items-center gap-1.5">
              <PlayerName uid={target?.uid} pseudo={entry?.pseudo ?? target?.pseudo ?? ""} allianceId={entry?.allianceId ?? null} />
              <AscensionStars count={entry?.ascensions} />
            </DialogTitle>
            {entry && (
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-glow">
                {getRankLabel(entry.xp)} · {formatNumber(entry.xp)} XP
              </p>
            )}
            {entry?.activeTitle && (
              <span className="mt-1 inline-block border border-gold-glow/35 bg-gold-glow/[0.06] px-1.5 py-px text-[11px] text-gold-glow">
                <GameIcon name="trophy" /> {entry.activeTitle}
              </span>
            )}
          </div>
        </div>

        {!sheet && !error && (
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement de la fiche…
          </p>
        )}
        {error && <p className="mt-6 text-sm text-danger-glow">Fiche introuvable.</p>}

        {sheet && entry && (
          <div className="mt-4 flex flex-col gap-4">
            {sinceLabel(entry.createdAtMs) && <p className="text-xs text-slate-500">Commandant depuis le {sinceLabel(entry.createdAtMs)}.</p>}

            {feats && (
              <section>
                <p className="hud-eyebrow mb-2 text-slate-400">Faits d'armes</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Victoires" value={formatNumber(feats.victories)} />
                  <Stat label="Défaites" value={formatNumber(feats.defeats)} />
                  <Stat label="Succès" value={formatNumber(feats.achievements)} />
                  <Stat label="Missions" value={formatNumber(feats.missions)} />
                  <Stat label="Expéditions" value={formatNumber(feats.expeditions)} />
                  <Stat label="Léviathans abattus" value={formatNumber(feats.leviathanKills)} />
                  <Stat label="Guerres gagnées" value={formatNumber(feats.warsWon)} />
                  <Stat label="Ascensions" value={formatNumber(entry.ascensions ?? 0)} />
                  {(feats.bounties ?? 0) > 0 && <Stat label="Primes remplies" value={formatNumber(feats.bounties ?? 0)} />}
                </div>
                {feats.kesh && (feats.kesh.rank > 0 || feats.kesh.shieldUntilMs > Date.now()) && (
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gold-glow">
                    {feats.kesh.rank > 0 && <span>Essaim Kesh'Vaar : {rankName(feats.kesh.rank)}</span>}
                    {feats.kesh.shieldUntilMs > Date.now() && <span className="border border-gold-glow/40 px-1.5 py-px">Voile de chitine actif</span>}
                  </p>
                )}
              </section>
            )}

            {leviathan && levIndex >= 0 && (
              <section>
                <p className="hud-eyebrow mb-2 text-slate-400">Léviathan en cours</p>
                <p className="text-sm text-slate-300">
                  {levIndex + 1}
                  <sup>{levIndex === 0 ? "er" : "e"}</sup> sur {ranking.length} · {formatNumber(ranking[levIndex].damage)} dégâts en {ranking[levIndex].assaults} assaut
                  {ranking[levIndex].assaults > 1 ? "s" : ""}
                </p>
              </section>
            )}

            {(entry.planets ?? []).length > 0 && (
              <section>
                <p className="hud-eyebrow mb-2 text-slate-400">Colonies</p>
                <div className="flex flex-wrap gap-1.5">
                  {(entry.planets ?? []).map((c) => (
                    <span key={c.id} className="border border-cyan-glow/20 px-2 py-0.5 text-xs text-slate-300">
                      {c.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {feats && feats.titles.length > 0 && (
              <section>
                <p className="hud-eyebrow mb-2 text-slate-400">Titres obtenus</p>
                <div className="flex flex-wrap gap-1.5">
                  {feats.titles.map((t) => (
                    <span key={t} className="border border-gold-glow/30 bg-gold-glow/[0.05] px-2 py-0.5 text-xs text-gold-glow">
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {sheet.seasons.length > 0 && (
              <section>
                <p className="hud-eyebrow mb-2 text-slate-400">Saisons passées</p>
                <div className="flex flex-col divide-y divide-white/5 border border-cyan-glow/15">
                  {sheet.seasons.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-sm">
                      <span className="text-slate-300 first-letter:uppercase">{seasonLabel(s.seasonId)}</span>
                      <span className="font-mono text-xs text-slate-400">
                        {s.rank}
                        <sup>{s.rank === 1 ? "er" : "e"}</sup> · {formatNumber(s.seasonXp)} XP
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {actions && <div className="flex flex-wrap justify-end gap-2">{actions}</div>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
