import { toast } from "sonner";
import { TitleBadge } from "@/components/game/TitleBadge";
import { relicImage } from "@/game/relics";
import { Link } from "react-router-dom";
import { NpcBadge, VacationBadge } from "@/components/ui/npc-badge";
import { loadWarlords, useWarlordsStore } from "@/services/warlordService";
import { PERSONALITY_LABELS, TIER_LABELS } from "@/game/warlords";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { removeAvatar } from "@/services/avatarService";
import { useAdminStatus } from "@/services/maintenanceService";
import { useEffect, useState, type ReactNode } from "react";
import { KESH, rankName } from "@/game/bounties";
import { assetUrl } from "@/lib/assets";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PlayerName } from "@/components/ui/player-name";
import { AscensionStars } from "@/components/game/AscensionCard";
import { fetchPlayerSheet, type PlayerSheet } from "@/services/playerService";
import { useLeviathan } from "@/services/leviathanService";
import { leviathanRanking } from "@/game/leviathan";
import { getRankIcon, getRankLabel } from "@/game/ranks";
import { seasonLabel } from "@/game/seasons";
import { cn, formatNumber } from "@/lib/utils";
import { findCommander } from "@/game/commanders";
import { describeRelic, findTemplate, rarityInfo } from "@/game/relics";
import { ACHIEVEMENTS, TIER_LABELS as ACH_TIER_LABELS } from "@/game/achievements";

const ACH_TIER_STYLE: Record<string, string> = {
  bronze: "border-[#cd7f32]/50 bg-[#cd7f32]/[0.06] text-[#e0a36a]",
  argent: "border-slate-300/40 bg-white/[0.04] text-slate-200",
  or: "border-gold-glow/50 bg-gold-glow/[0.07] text-gold-glow",
  legendaire: "border-violet-glow/60 bg-violet-glow/[0.08] text-violet-glow",
};

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
  const isAdmin = useAdminStatus();

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
  const warlords = useWarlordsStore((st) => st.list);
  const lord = entry?.npc ? warlords.find((w) => w.id === entry.npc) : undefined;
  useEffect(() => {
    if (entry?.npc) void loadWarlords().catch(() => undefined);
  }, [entry?.npc]);

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn("max-w-xl", feats?.kesh?.frame && "kesh-frame")}>
        {/* v4.0 : bannière choisie par le joueur */}
        {feats?.showcase && (
          <div
            aria-hidden
            className="-mx-6 -mt-6 mb-1 h-24 bg-cover bg-center"
            style={
              feats.showcase.banner.image
                ? { backgroundImage: `linear-gradient(180deg, transparent 30%, var(--color-space-900, #070a14) 100%), url(${assetUrl(feats.showcase.banner.image)})` }
                : { background: feats.showcase.banner.gradient }
            }
          />
        )}
        <div className="flex items-center gap-3 pr-6">
          {entry && !entry.npc ? (
            <div className="relative shrink-0">
              <PlayerAvatar uid={entry.uid} pseudo={entry.pseudo} file={entry.avatar} className="h-16 w-16" />
              <img src={getRankIcon(entry.xp)} alt="" className="absolute -bottom-2 -right-2 h-7 w-7 object-contain drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]" />
            </div>
          ) : (
            <img src={getRankIcon(entry?.xp ?? 0)} alt="" className="h-14 w-14 shrink-0 object-contain" />
          )}
          {feats?.showcase?.emblem && <img src={assetUrl(feats.showcase.emblem)} alt="" className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]" />}
          {!feats?.showcase?.emblem && feats?.kesh?.emblem && <img src={assetUrl(KESH.emblem)} alt="Emblème de l'Essaim" title="Emblème de l'Essaim Kesh'Vaar" className="h-12 w-12 shrink-0 object-contain drop-shadow-[0_0_10px_rgba(255,190,80,0.4)]" />}
          <div className="min-w-0">
            <DialogTitle className="flex flex-wrap items-center gap-1.5">
              <PlayerName uid={target?.uid} pseudo={entry?.pseudo ?? target?.pseudo ?? ""} allianceId={entry?.allianceId ?? null} />
              <AscensionStars count={entry?.ascensions} />
              {entry?.npc && <NpcBadge />}
              {(entry?.vacationUntilMs ?? 0) > Date.now() && <VacationBadge untilMs={entry!.vacationUntilMs!} />}
            </DialogTitle>
            {entry && (
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-glow">
                {getRankLabel(entry.xp)} · {formatNumber(entry.xp)} XP
              </p>
            )}
            {entry?.activeTitle && (
              <TitleBadge label={entry.activeTitle} size="xs" className="mt-1" />
            )}
          </div>
        </div>

        {isAdmin && entry?.avatar && (
          <button
            type="button"
            className="self-start text-[11px] text-danger-glow hover:underline"
            onClick={() =>
              removeAvatar(entry.uid)
                .then(() => setSheet((cur) => (cur ? { ...cur, entry: { ...cur.entry, avatar: undefined } } : cur)))
                .catch(() => toast.error("Impossible de retirer l'avatar."))
            }
          >
            Modération : retirer l'avatar
          </button>
        )}

        {lord && (
          <div className="mt-3 border-l-2 pl-3 text-xs leading-relaxed text-slate-400" style={{ borderColor: lord.color }}>
            <p className="mb-1 uppercase tracking-[0.14em] text-slate-500">
              {lord.originLabel} · {PERSONALITY_LABELS[lord.personality]} · {TIER_LABELS[lord.tier]}
            </p>
            {lord.bio}{" "}
            <Link to="/game/seigneurs" onClick={onClose} className="text-cyan-glow hover:underline">
              Voir les seigneurs de guerre
            </Link>
          </div>
        )}
        {!sheet && !error && (
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement de la fiche…
          </p>
        )}
        {error && <p className="mt-6 text-sm text-danger-glow">Fiche introuvable.</p>}

        {sheet && entry && (
          <div className="mt-4 flex flex-col gap-4">
            {feats?.showcase?.motto && <p className="border-l-2 border-cyan-glow/40 pl-3 text-sm italic text-slate-300">« {feats.showcase.motto} »</p>}

            {(feats?.showcase?.achievements ?? []).length > 0 && (
              <section>
                <p className="hud-eyebrow mb-2 text-slate-400">Succès en vitrine</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(feats?.showcase?.achievements ?? []).map((id) => {
                    const a = ACHIEVEMENTS.find((x) => x.id === id);
                    if (!a) return null;
                    return (
                      <div key={id} title={a.description} className={cn("hud-cut-sm flex flex-col items-center gap-1 border px-2 py-2.5 text-center", ACH_TIER_STYLE[a.tier])}>
                        <span className="text-2xl leading-none">{a.emoji}</span>
                        <span className="text-xs font-semibold text-white">{a.name}</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.14em] opacity-80">{ACH_TIER_LABELS[a.tier]}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {feats?.showcase && (feats.showcase.commanders.length > 0 || feats.showcase.relics.length > 0) && (
              <section>
                <p className="hud-eyebrow mb-2 text-slate-400">État-major</p>
                <div className="flex flex-wrap gap-2">
                  {feats.showcase.commanders.map((c) => {
                    const def = findCommander(c.id);
                    return (
                      <span key={c.id} className="flex items-center gap-2 border border-cyan-glow/20 bg-white/[0.02] py-1 pl-1 pr-2.5 text-xs text-slate-300">
                        <img src={assetUrl(def?.portrait ?? "")} alt="" className="h-8 w-7 object-cover" />
                        <span>
                          <span className="block text-white">{def?.name}</span>
                          {def?.title} · niv. {c.level}
                        </span>
                      </span>
                    );
                  })}
                  {feats.showcase.relics.map((r, i) => (
                    <span key={i} title={describeRelic(r)} className="flex items-center gap-1.5 border px-2 py-1 text-xs" style={{ borderColor: `${rarityInfo(r.rarity).color}55`, color: rarityInfo(r.rarity).color }}>
                      <img src={assetUrl(relicImage(r.template))} alt="" className="h-6 w-6 object-contain" />
                      {findTemplate(r.template)?.name}
                    </span>
                  ))}
                </div>
              </section>
            )}
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
                    {feats.kesh.shieldUntilMs > Date.now() && <span className="hud-chip hud-chip-sm hud-tone-gold">Voile de chitine actif</span>}
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
