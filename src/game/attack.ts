import { colonyOf, colonyView } from "@/game/colonies";
import { onVacation } from "@/game/vacation";
import { capLoot } from "@/game/warlords";
import { shieldUntil } from "@/game/bounties";
import { bumpStat, setStat } from "@/game/stats";
import { getShieldPercent, resolveCombat, type CombatGarrison, type CombatResult } from "@/game/combat";
import { flushState, type NewNotification } from "@/game/flush";
import { getRepairPercent, withMissingBuildings } from "@/game/buildings";
import { protectedAmount } from "@/game/economy";
import { recordContract } from "@/game/contracts";
import { OFFENSIVE_UNITS } from "@/game/units";
import { DEBRIS_RULES, debrisFromLosses, type DebrisAmount } from "@/game/debris";
import { eventDebrisPercent, lootFactor } from "@/game/events";
import { ALLIANCE_RULES, allianceShieldBonus } from "@/game/alliances";
import { formationEffects, postureEffects } from "@/game/formations";
import { applyXpDelta } from "@/game/seasons";
import { capDefenderXpLoss, checkAttackAllowed, computeCombatXp } from "@/game/pvp";
import { playerModifiers, withRepairBonus } from "@/game/modifiers";
import { consumeArmor } from "@/game/synthesis";
import { consumeAegis } from "@/game/relics";
import { COMMANDER_XP, grantCommanderXp } from "@/game/commanders";
import { addPassPoints } from "@/game/seasonPass";
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
  defenderQueues: QueuesState;
  fleet: Record<string, number>;
  /** Dernière attaque de cet attaquant sur cette cible (ms). */
  lastAttackOnTargetMs: number | null;
  /** XP déjà perdue par le défenseur en défense sur 24 h (valeur positive). */
  defenderXpLostLast24h: number;
  /** Flotte en vol (v1.6) : ses unités ont déjà quitté l'attaquant au
   *  décollage. Les protections ont été vérifiées à ce moment-là ; le butin
   *  et les survivants rentrent avec la flotte au lieu d'être crédités. */
  inFlight?: boolean;
  /** v3.0 : formation de l'attaquant (la posture du défenseur est lue sur son profil). */
  formation?: string;
  /** v3.5 : colonie visée (sinon la planète mère). */
  colonyId?: string;
  /** Garnisons alliées stationnées chez le défenseur (v1.9). */
  garrisons?: (CombatGarrison & { fleetId: string; ownerUid: string; ownerPseudo: string })[];
  /** v4.0 : capsules embarquées au lancement (bonus en %). */
  boosts?: { assault?: number };
  /** v4.2 : butin maximal (total), pour les attaques des seigneurs de guerre. */
  lootCap?: number;
}

export type AttackOutput =
  | { ok: false; message: string }
  | {
      ok: true;
      attacker: PlayerState;
      attackerQueues: QueuesState;
      notifications: NewNotification[];
      /** Le serveur applique aussi le résultat au défenseur (pertes, pillage,
       *  XP) : son navigateur ne fait plus qu'afficher le rapport. */
      defender: PlayerState;
      defenderQueues: QueuesState;
      defenderNotifications: NewNotification[];
      report: Omit<BattleReport, "id">;
      combat: CombatResult;
      /** Flotte en vol : unités qui rentrent et butin qu'elles rapportent. */
      survivors: Record<string, number>;
      loot: Partial<Record<ResourceId, number>>;
      /** Débris laissés en orbite du défenseur (vaisseaux détruits des deux camps). */
      debris: DebrisAmount;
    };

export function performAttack(input: AttackInput): AttackOutput {
  const { now, attackerUid, defenderUid, defender } = input;

  const check = input.inFlight
    ? { allowed: true as const, message: undefined }
    : checkAttackAllowed({
    now,
    attackerUid,
    attackerXp: input.attacker.xp ?? 0,
    defenderUid,
    defenderXp: defender.xp ?? 0,
    defenderCreatedAtMs: defender.createdAtMs,
    defenderHasAttacked: (defender.lastAttackAtMs ?? 0) > 0,
    lastAttackOnTargetMs: input.lastAttackOnTargetMs,
    defenderAscendedAtMs: defender.ascendedAtMs,
    defenderShieldUntilMs: shieldUntil(defender),
    defenderVacationUntilMs: onVacation(defender, now) ? defender.vacation?.untilMs : undefined,
    defenderIsWarlord: !!defender.npc,
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
    { ...input.attacker, buildings: withMissingBuildings(input.attacker.buildings, input.attacker.resources) },
    input.attackerQueues,
    now,
  );
  const attacker = flushed.player;

  // Flotte en vol : on la remet provisoirement « à bord » pour le combat.
  if (input.inFlight) {
    for (const [unitId, qty] of Object.entries(fleet)) {
      const state = attacker.units[unitId] ?? { level: 1, count: 0 };
      attacker.units[unitId] = { ...state, count: state.count + qty };
    }
  }

  for (const [unitId, qty] of Object.entries(fleet)) {
    if ((attacker.units[unitId]?.count ?? 0) < qty) {
      return { ok: false, message: "Tu ne possèdes plus assez d'unités pour cette flotte." };
    }
  }

  // Défenseur rattrapé lui aussi (production, unités terminées) avant le combat.
  const flushedDefender = flushState({ ...defender, buildings: withMissingBuildings(defender.buildings, defender.resources) }, input.defenderQueues, now);
  const owner = flushedDefender.player;
  // v3.5 : sur une colonie, on combat ses défenses et on pille son stock
  // (la vue partage ses objets : les pertes et le pillage s'y appliquent).
  const colony = input.colonyId ? colonyOf(owner, input.colonyId) : undefined;
  if (input.colonyId && !colony) return { ok: false, message: "Cette colonie n'existe plus." };
  const def = colony ? colonyView(owner, colony) : owner;

  const posture = postureEffects(def.posture?.id);
  // v4.0 : officiers, reliques et capsules (stimulant d'assaut, carapace).
  const formation = formationEffects(input.formation);
  const atkMods = playerModifiers(attacker);
  const defMods = playerModifiers(owner);
  const assault = Math.max(0, Math.min(50, Number(input.boosts?.assault) || 0)) / 100;
  const armor = consumeArmor(owner, now) / 100;
  const combat = resolveCombat({
    ...formation,
    attackFactor: formation.attackFactor * (1 + atkMods.attack + assault),
    cargoFactor: formation.cargoFactor * (1 + atkMods.cargo),
    defenderPowerFactor: 1 + defMods.defense + armor,
    defenseFactor: posture.defenseFactor,
    homeFleetFactor: posture.homeFleetFactor,
    lootMultiplier: lootFactor(now),
    garrisons: input.garrisons ?? [],
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
    attackerUnits: attacker.units,
    attackerTechLevels: attacker.techLevels,
    attackerRepairPct: withRepairBonus(getRepairPercent(attacker.buildings), attacker),
    fleet,
    defenderUnits: def.units ?? {},
    defenderTechLevels: def.techLevels ?? {},
    defenderRepairPct: withRepairBonus(getRepairPercent(def.buildings), owner),
    defenderShieldPct: getShieldPercent(def.buildings, allianceShieldBonus(def.allianceResearch)),
    // Le bunker de l'entrepôt met une partie du stock à l'abri du pillage.
    defenderResources: Object.fromEntries(
      Object.entries(def.resources ?? {}).map(([res, amount]) => [res, Math.max(0, (amount ?? 0) - protectedAmount(def.buildings, res as ResourceId, def.techLevels, def.allianceResearch))]),
    ),
  });

  // Égide de la Reine : la première défaite de la semaine n'est pas pillée.
  const aegis = combat.outcome === "attacker_win" && Object.values(combat.loot ?? {}).some((n) => (n ?? 0) > 0) && consumeAegis(owner, now);
  if (aegis) combat.loot = {};
  if (input.lootCap !== undefined && combat.loot) combat.loot = capLoot(combat.loot, input.lootCap);

  for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
    if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - lost);
  }
  const survivors: Record<string, number> = {};
  for (const [unitId, qty] of Object.entries(fleet)) survivors[unitId] = Math.max(0, qty - (combat.attackerLosses[unitId] ?? 0));
  if (input.inFlight) {
    // Les survivants repartent avec la flotte : ils quittent à nouveau la base.
    for (const [unitId, qty] of Object.entries(survivors)) {
      if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - qty);
    }
  }
  for (const [res, amt] of Object.entries(combat.loot ?? {})) {
    if (!input.inFlight) {
      attacker.resources[res as ResourceId] = (attacker.resources[res as ResourceId] ?? 0) + (amt ?? 0);
      bumpStat(attacker, "loot", amt ?? 0);
    }
    def.resources[res as ResourceId] = Math.max(0, (def.resources[res as ResourceId] ?? 0) - (amt ?? 0));
  }
  for (const [unitId, lost] of Object.entries(combat.defenderLosses)) {
    if (def.units[unitId]) def.units[unitId].count = Math.max(0, def.units[unitId].count - lost);
  }

  const xp = computeCombatXp(combat.outcome, combat.attackerPower, combat.defenderPower);
  const defenderXpDelta = capDefenderXpLoss(xp.defenderXp, input.defenderXpLostLast24h);
  if (combat.outcome === "attacker_win") {
    if (attacker.lastDefeatAtMs && now - attacker.lastDefeatAtMs <= 3600_000) setStat(attacker, "phoenix", 1);
    attacker.victories = (attacker.victories ?? 0) + 1;
  }
  else if (combat.outcome === "defender_win") attacker.defeats = (attacker.defeats ?? 0) + 1;
  applyXpDelta(attacker, xp.attackerXp, now);
  attacker.lastAttackAtMs = now;

  if (combat.outcome === "defender_win") owner.victories = (owner.victories ?? 0) + 1;
  else if (combat.outcome === "attacker_win") {
    owner.defeats = (owner.defeats ?? 0) + 1;
    if (colony) colony.lastDefeatAtMs = now;
    else if (!owner.npc) owner.lastDefeatAtMs = now;
  }
  applyXpDelta(owner, defenderXpDelta, now);
  if (combat.outcome === "attacker_win") recordContract(attacker, "win_attack", 1, now);
  if (combat.outcome === "defender_win") recordContract(owner, "win_defense", 1, now);
  if (combat.outcome === "attacker_win") grantCommanderXp(attacker, "admiral", COMMANDER_XP.attackWin);
  if (combat.outcome === "attacker_win") addPassPoints(attacker, "victory", now);
  if (combat.outcome === "defender_win") addPassPoints(owner, "victory", now);
  grantCommanderXp(owner, "strategist", combat.outcome === "defender_win" ? COMMANDER_XP.defenseWin : COMMANDER_XP.defenseLost);

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
      message: `Attaque contre ${def.pseudo} (${xp.attackerXp >= 0 ? "+" : ""}${xp.attackerXp} XP).`,
      createdAtMs: now,
      read: false,
    },
  ];

  const defenderTitle: Record<string, string> = {
    attacker_win: "Tu as perdu ce combat...",
    defender_win: "Attaque repoussée !",
    draw: "Match nul.",
  };
  const defenderNotifications: NewNotification[] = [
    ...flushedDefender.notifications,
    {
      kind: "combat-defender",
      title: defenderTitle[combat.outcome] ?? "Rapport de combat",
      message: `Attaque de ${input.attacker.pseudo}${colony ? ` sur ${colony.name}` : ""}${defenderXpDelta ? ` (${defenderXpDelta > 0 ? "+" : ""}${defenderXpDelta} XP)` : ""}.${aegis ? " L'Égide de la Reine a protégé tes réserves du pillage." : ""}${armor > 0 ? ` Carapace réactive consommée (+${Math.round(armor * 100)} % de défense).` : ""}`,
      createdAtMs: now,
      read: false,
    },
  ];

  const report: Omit<BattleReport, "id"> = {
    attackerUid,
    attackerPseudo: input.attacker.pseudo,
    defenderUid,
    defenderPseudo: def.pseudo,
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
    defenderApplied: true,
    garrisons: (input.garrisons ?? []).map((g, i) => ({ ownerUid: g.ownerUid, ownerPseudo: g.ownerPseudo, units: g.fleet, losses: combat.garrisonLosses?.[i] ?? {} })),
    attackerFleet: fleet,
    planetId: colony ? colony.id : "",
  };

  return {
    ok: true,
    attacker,
    attackerQueues: flushed.queues,
    notifications,
    defender: owner,
    defenderQueues: flushedDefender.queues,
    defenderNotifications,
    report,
    combat,
    survivors,
    loot: combat.loot ?? {},
    debris: debrisFromLosses([combat.attackerLosses, combat.defenderLosses, ...(combat.garrisonLosses ?? [])], eventDebrisPercent(now) ?? DEBRIS_RULES.percent),
  };
}
