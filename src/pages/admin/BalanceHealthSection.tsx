import { HudChip, StatTile } from "@/components/ui/hud";
import type { BalanceHealth } from "@/game/balance/health";
import { formatCompact } from "@/lib/utils";

/* 6.0.1 (lot K) : santé de l'équilibre. Les relevés de la feuille de route (abri, butin, chantiers,
   flottes, alliances, routes, classes), lus sans accès direct aux données des joueurs. */

const PASS_SOURCE_LABELS: Record<string, string> = {
  dailyLogin: "Connexion",
  contract: "Objectifs du jour",
  bounty: "Primes",
  raidRepelled: "Raids repoussés",
  victory: "Victoires",
  bossAssault: "Assauts de boss",
  vendetta: "Vendettas",
  chronicle: "Épisodes",
  seasonBoss: "Boss de saison",
  allianceBoss: "Boss d'alliance",
  allianceBossTry: "Boss d'alliance (essai)",
  coalition: "Coalitions",
  allianceDaily: "Objectif d'alliance",
};

const h = (x: number) => `${String(x).replace(".", ",")} h`;

export function BalanceHealthSection({ health, achievementsPace }: { health: BalanceHealth; achievementsPace?: number | null }) {
  const e = health.exposure;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile size="sm" tone="accent" label="Stock (médiane)" value={h(e.stockHours)} sub="de production" />
        <StatTile size="sm" tone="mint" label="Part à l'abri (médiane)" value={h(e.protectedHours)} sub="de production" />
        <StatTile size="sm" tone="ember" label="Pillable (médiane)" value={h(e.pillableHours)} sub={`${e.pillablePlayersPct} % des joueurs exposés`} />
        <StatTile size="sm" tone="danger" label="Butin moyen" value={formatCompact(health.pvp.avgLoot)} sub={`${String(health.pvp.battlesPerDay).replace(".", ",")} combats JcJ / jour (${health.pvp.windowDays} j)`} />
        <StatTile size="sm" tone="violet" label="Sauvetage" value={`${health.salvage.avgPct} %`} sub={`max ${health.salvage.maxPct} %`} />
        <StatTile size="sm" tone="gold" label="Chantiers en parallèle" value={`${health.parallel.buildsMedian}`} sub={`médiane · max ${health.parallel.buildsMax}`} />
        <StatTile size="sm" tone="accent" label="Flottes en vol" value={`${health.parallel.fleetsMedian}`} sub={`médiane · max ${health.parallel.fleetsMax} · ${health.parallel.fullSlotsPct ?? 0} % à court d'emplacements`} />
        <StatTile
          size="sm"
          tone={health.pass.finishedPct >= 40 && (health.pass.medianFinishDay ?? 31) < 15 ? "danger" : "gold"}
          label="Passe du mois"
          value={`${health.pass.finishedPct} % fini`}
          sub={`${health.pass.medianPoints} / ${health.pass.maxPoints} points (médiane)${health.pass.medianFinishDay ? ` · fini le ${health.pass.medianFinishDay} (médiane)` : ""}`}
        />
        <StatTile
          size="sm"
          tone="violet"
          label="Succès (joueur médian)"
          value={`${health.achievements.medianPct} %`}
          sub={`${health.achievements.medianUnlocked} sur ${health.achievements.total}${achievementsPace != null ? ` · +${achievementsPace} pts en 7 j` : ""}`}
        />
        {health.commerce && (
          <StatTile
            size="sm"
            tone="gold"
            label="Commerce (7 j)"
            value={`${String(health.commerce.dealsPerPlayerWeek).replace(".", ",")} / joueur`}
            sub={`marché ${health.commerce.marketFilled}/${health.commerce.marketCreated} · enchères ${health.commerce.auctionsSold}/${health.commerce.auctionsCreated} · contrats ${health.commerce.contractsDelivered}/${health.commerce.contractsCreated} · ${health.commerce.gifts} cadeaux`}
          />
        )}
        {/* 6.14.19 (A29-2) : raids et repaires (PNJ-4, cible 60 à 80 % repoussés), élites (PNJ-5), casino et pot (COM-3). */}
        {health.npc && (
          <StatTile
            size="sm"
            tone={health.npc.raids && (health.npc.raidsRepelledPct < 60 || health.npc.raidsRepelledPct > 80) ? "ember" : "mint"}
            label={`Raids repoussés (${health.npc.windowDays} j)`}
            value={health.npc.raids ? `${health.npc.raidsRepelledPct} %` : "—"}
            sub={`${health.npc.raids} raids · cible 60 à 80 % · repaires pris ${health.npc.lairsTakenPct} % (${health.npc.lairs})`}
          />
        )}
        {health.elites && <StatTile size="sm" tone="gold" label="Unités d'élite" value={`${health.elites.sharePct} %`} sub={`${health.elites.players} joueurs en ont débloqué une`} />}
        {health.casino && (
          <StatTile
            size="sm"
            tone="violet"
            label="Casino (semaine)"
            value={`${health.casino.playersPct} %`}
            sub={`des joueurs ont joué · ${health.casino.medianSpins} tirages (médiane) · ${health.casino.jackpots} gros lots en tout`}
          />
        )}
        {health.casino?.pot && <StatTile size="sm" tone="gold" label="Pot commun" value={formatCompact(health.casino.pot.value)} sub={`ressources (valeur commune) · ${health.casino.pot.amber} Ambre`} />}
        <StatTile size="sm" tone="mint" label="Routes de colonies" value={`${health.colonies.withRoute} / ${health.colonies.colonies}`} sub={`dont ${health.colonies.supply ?? 0} en ravitaillement · ${health.colonies.queued ?? 0} files de défense`} />
        {/* 6.14.69 (É30-1d, risque R1) : lunes chez les actifs, usage de la phalange et de la porte de saut (cumuls). */}
        {health.moons && (
          <>
            <StatTile
              size="sm"
              tone="violet"
              label="Actifs avec une lune"
              value={`${health.moons.sharePct} %`}
              sub={`${health.moons.players} lunes · niveau ${String(health.moons.medianLevel).replace(".", ",")} (médiane) · ${health.moons.byPity} nées par pitié · ${health.moons.pityPending} réserves en cours`}
            />
            <StatTile
              size="sm"
              tone="violet"
              label="Phalange et porte"
              value={`${health.moons.scans} balayages`}
              sub={`${health.moons.scanners} joueurs · ${health.moons.jumps} sauts (${health.moons.jumpers} joueurs) · ${health.moons.saves} sauvetages`}
            />
          </>
        )}
        {/* 6.14.77 (É30-1f) : victoires de l'attaquant en JcJ contre une cible avec ou sans lune (lune relevée dans le rapport). */}
        {health.moonPvp && (
          <StatTile
            size="sm"
            tone="violet"
            label={`Attaquant gagnant (${health.moonPvp.windowDays} j)`}
            value={health.moonPvp.withMoon.battles || health.moonPvp.withoutMoon.battles ? `${health.moonPvp.withMoon.winPct} % / ${health.moonPvp.withoutMoon.winPct} %` : "—"}
            sub={`avec lune (${health.moonPvp.withMoon.battles} combats) / sans lune (${health.moonPvp.withoutMoon.battles}) · ${health.moonPvp.unknown} sans relevé`}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>Alliances ({health.alliances.count}) :</span>
        {health.alliances.sizes.length ? (
          health.alliances.sizes.map((n, i) => (
            <HudChip key={i} size="sm" tone="neutral">
              <span className="font-mono tabular-nums">{n}</span>&nbsp;membres
            </HudChip>
          ))
        ) : (
          <span className="text-slate-500">aucune</span>
        )}
      </div>
      {health.pass.bySource.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>Points de passe par source :</span>
          {health.pass.bySource.map((r) => (
            <HudChip key={r.source} size="sm" tone="gold">
              {PASS_SOURCE_LABELS[r.source] ?? r.source} <span className="ml-1 font-mono tabular-nums">{r.sharePct} %</span>
            </HudChip>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>Classes :</span>
        {health.classes.rows.map((r) => (
          <HudChip key={r.id} size="sm" tone="gold" title={`Production médiane : ${formatCompact(r.medianProduction)} / h`}>
            {r.name} <span className="ml-1 font-mono tabular-nums">{r.players}</span> ({r.sharePct} %)
          </HudChip>
        ))}
        <HudChip size="sm" tone="neutral">
          sans classe <span className="ml-1 font-mono tabular-nums">{health.classes.none}</span>
        </HudChip>
      </div>
      {/* 6.14.6 (BOSS-2) : boss abattus par type, depuis le Hall of fame. */}
      {health.bosses && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>Boss abattus ({health.bosses.windowDays} j) :</span>
          {health.bosses.rows.map((r) => (
            <HudChip
              key={r.kind}
              size="sm"
              tone={r.fought === 0 ? "neutral" : r.winPct >= 50 ? "mint" : "ember"}
              title={r.fought ? `Participants (médiane) : ${r.medianParticipants} · dégâts (médiane) : ${r.medianDamagePct} % des PV` : "Aucun combat terminé sur la période"}
            >
              {r.label}{" "}
              <span className="ml-1 font-mono tabular-nums">
                {r.won}/{r.fought}
                {r.fought ? ` · ${r.winPct} %` : ""}
              </span>
            </HudChip>
          ))}
        </div>
      )}
      {health.casino?.pot && health.casino.pot.inflows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>Entrées du pot commun :</span>
          {health.casino.pot.inflows.map((r) => (
            <HudChip key={r.source} size="sm" tone="gold" title={`${formatCompact(r.value)} en valeur de ressources communes`}>
              {r.label} <span className="ml-1 font-mono tabular-nums">{r.sharePct} %</span>
            </HudChip>
          ))}
        </div>
      )}
      {/* 6.5.1 (lot U) : unités possédées par type (relevés de 6.3.1 et 6.5). */}
      <UnitRows label="Défenses construites" tone="accent" rows={health.defenses ?? []} />
      <UnitRows label="Vaisseaux de classe" tone="violet" rows={health.classUnits ?? []} />
      {health.elites && <UnitRows label="Unités d'élite" tone="violet" rows={health.elites.rows} />}
    </div>
  );
}

function UnitRows({ label, tone, rows }: { label: string; tone: "accent" | "violet"; rows: { id: string; name: string; total: number; owners: number }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
      <span>{label} :</span>
      {rows.some((r) => r.total > 0) ? (
        rows
          .filter((r) => r.total > 0)
          .map((r) => (
            <HudChip key={r.id} size="sm" tone={tone} title={`${r.owners} joueur${r.owners > 1 ? "s" : ""}`}>
              {r.name} <span className="ml-1 font-mono tabular-nums">{formatCompact(r.total)}</span>
            </HudChip>
          ))
      ) : (
        <span className="text-slate-500">aucun</span>
      )}
    </div>
  );
}
