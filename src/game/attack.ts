import { resolveCombat, type CombatResult } from "@/game/combat";
import { flushState, type NewNotification } from "@/game/flush";
import { getRepairPercent, withMissingBuildings } from "@/game/buildings";
import { OFFENSIVE_UNITS } from "@/game/units";
import { applyXpDelta } from "@/game/seasons";
import { capDefenderXpLoss, checkAttackAllowed, computeCombatXp } from "@/game/pvp";
import type { BattleReport, PlayerState, QueuesState, ResourceId } from "@/types/game";

/* =====================================================
   Attaque complète, arbitrée côté serveur (pocketbase/pb_hooks).

   Fonction pure : le hook PocketBase lit les enregistrements, appelle
   performAttack, puis écrit le résultat dans une transaction. Elle est
   compilée pour le serveur par `npm run build:hooks`.
===================================================== */

export interface AttackInput {
  now: number;
  attackerUid: string;
  attacker: PlayerState;
  attackerQueues: QueuesState;
  defenderUid: string;
  defender: PlayerState;
  fleet: Record<string, number>;
  /** Dernière attaque de cet attaquant sur cette cible (ms). */
  lastAttackOnTargetMs: number | null;
  /** XP déjà perdue par le défenseur en défense sur 24 h (valeur positive). */
  defenderXpLostLast24h: number;
}

export type AttackOutput =
  | { ok: false; message: string }
  | {
      ok: true;
      attacker: PlayerState;
      attackerQueues: QueuesState;
      notifications: NewNotification[];
      report: Omit<BattleReport, "id">;
      combat: CombatResult;
    };

export function performAttack(input: AttackInput): AttackOutput {
  const { now, attackerUid, defenderUid, defender } = input;

  const check = checkAttackAllowed({
    now,
    attackerUid,
    attackerXp: input.attacker.xp ?? 0,
    defenderUid,
    defenderXp: defender.xp ?? 0,
    defenderCreatedAtMs: defender.createdAtMs,
    defenderHasAttacked: (defender.lastAttackAtMs ?? 0) > 0,
    lastAttackOnTargetMs: input.lastAttackOnTargetMs,
    lastDefenderDefeatMs: defender.lastDefeatAtMs ?? null,
  });
  if (!check.allowed) return { ok: false, message: check.message ?? "Attaque impossible." };

  const fleet: Record<string, number> = {};
  for (const [unitId, raw] of Object.entries(input.fleet ?? {})) {
    const qty = Math.floor(Number(raw));
    if (qty <= 0) continue;
    if (!OFFENSIVE_UNITS.includes(unitId)) return { ok: false, message: "Seules les unités d'attaque peuvent être envoyées." };
    fleet[unitId] = qty;
  }
  if (Object.keys(fleet).length === 0) return { ok: false, message: "Sélectionne au moins une unité à envoyer." };

  // Production et files de l'attaquant rattrapées jusqu'à maintenant (avec
  // les bâtiments ajoutés depuis l'administration après sa création).
  const flushed = flushState(
    { ...input.attacker, buildings: withMissingBuildings(input.attacker.buildings) },
    input.attackerQueues,
    now,
  );
  const attacker = flushed.player;

  for (const [unitId, qty] of Object.entries(fleet)) {
    if ((attacker.units[unitId]?.count ?? 0) < qty) {
      return { ok: false, message: "Tu ne possèdes plus assez d'unités pour cette flotte." };
    }
  }

  const combat = resolveCombat({
    attackerUnits: attacker.units,
    attackerTechLevels: attacker.techLevels,
    attackerRepairPct: getRepairPercent(attacker.buildings),
    fleet,
    defenderUnits: defender.units ?? {},
    defenderTechLevels: defender.techLevels ?? {},
    defenderRepairPct: getRepairPercent(defender.buildings),
    defenderResources: defender.resources ?? {},
  });

  for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
    if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - lost);
  }
  for (const [res, amt] of Object.entries(combat.loot ?? {})) {
    attacker.resources[res as ResourceId] = (attacker.resources[res as ResourceId] ?? 0) + (amt ?? 0);
  }

  const xp = computeCombatXp(combat.outcome, combat.attackerPower, combat.defenderPower);
  const defenderXpDelta = capDefenderXpLoss(xp.defenderXp, input.defenderXpLostLast24h);
  if (combat.outcome === "attacker_win") attacker.victories = (attacker.victories ?? 0) + 1;
  else if (combat.outcome === "defender_win") attacker.defeats = (attacker.defeats ?? 0) + 1;
  applyXpDelta(attacker, xp.attackerXp, now);

  const outcomeTitle: Record<string, string> = {
    attacker_win: "Victoire !",
    defender_win: "Défaite…",
    draw: "Match nul",
  };
  const notifications: NewNotification[] = [
    ...flushed.notifications,
    {
      kind: "combat-attacker",
      title: outcomeTitle[combat.outcome] ?? "Rapport de combat",
      message: `Attaque contre ${defender.pseudo} (${xp.attackerXp >= 0 ? "+" : ""}${xp.attackerXp} XP).`,
      createdAtMs: now,
      read: false,
    },
  ];

  const report: Omit<BattleReport, "id"> = {
    attackerUid,
    attackerPseudo: input.attacker.pseudo,
    defenderUid,
    defenderPseudo: defender.pseudo,
    timestamp: now,
    outcome: combat.outcome,
    attackerPower: combat.attackerPower,
    defenderPower: combat.defenderPower,
    attackerLossPercent: combat.attackerLossPercent,
    defenderLossPercent: combat.defenderLossPercent,
    attackerLosses: combat.attackerLosses,
    attackerRecovered: combat.attackerRecovered,
    defenderLosses: combat.defenderLosses,
    defenderRecovered: combat.defenderRecovered,
    loot: combat.loot,
    defenderProcessed: false,
    attackerXpDelta: xp.attackerXp,
    defenderXpDelta,
  };

  return { ok: true, attacker, attackerQueues: flushed.queues, notifications, report, combat };
}
