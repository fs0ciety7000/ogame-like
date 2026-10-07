import { MOON_RULES, rollMoon } from "@/game/moon";
import { describeLoot, lootDifficulty, rollLoot } from "@/game/loot";
import { applyHull, sendToWorkshop, workshopState } from "@/game/workshop";
import { describeGain } from "@/game/format";
import { recordChronicle } from "@/game/chronicles";
import { colonyOf, colonyView } from "@/game/colonies";
import { onVacation } from "@/game/vacation";
import { capLoot, findWarlord, warlordRankRules } from "@/game/warlords";
import { rankOf, warlordCombatMods, type WarlordCombatMods } from "@/game/warlordRanks";
import { eliteIn, withoutElite } from "@/game/eliteUnits";
import { shieldUntil } from "@/game/bounties";
import { addSeasonPower } from "@/game/seasonWars";
import { bumpStat, setStat } from "@/game/stats";
import { COMBAT_RULES, combatLogOf, computeFullPower, getShieldPercent, pveAttackFactor, pveHomeDefenseFactor, resolveCombat, type CombatGarrison, type CombatResult } from "@/game/combat";
import { flushState, type NewNotification } from "@/game/flush";
import { getRepairPercent, withMissingBuildings } from "@/game/buildings";
import { protectedAmount } from "@/game/economy";
import { recordContract } from "@/game/contracts";
import { OFFENSIVE_UNITS } from "@/game/units";
import { DEBRIS_RULES, debrisFromLosses, debrisTotal, type DebrisAmount } from "@/game/debris";
import { eventDebrisPercent, lootFactor } from "@/game/events";
import { ALLIANCE_RULES, allianceShieldBonus } from "@/game/alliances";
import { formationEffects, postureEffects } from "@/game/formations";
import { applyXpDelta } from "@/game/seasons";
import { capDefenderXpLoss, checkAttackAllowed, computeCombatXp, weakTargetFactor } from "@/game/pvp";
import { playerModifiers, withRepairBonus } from "@/game/modifiers";
import { edgeParam, playerCombatEffects } from "@/game/effectTargets";
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
  /** 6.13.0 : tirage aléatoire (tests) ; Math.random sinon. */
  rand?: () => number;
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
  /** 5.21 : cible prioritaire choisie au lancement. */
  targetPriority?: "defenses" | "ships";
  /** v3.5 : colonie visée (sinon la planète mère). */
  colonyId?: string;
  /** Garnisons alliées stationnées chez le défenseur (v1.9). */
  garrisons?: (CombatGarrison & { fleetId: string; ownerUid: string; ownerPseudo: string })[];
  /** v4.0 : capsules embarquées au lancement (bonus en %). */
  boosts?: { assault?: number };
  /** v4.2 : butin maximal (total), pour les attaques des seigneurs de guerre. */
  lootCap?: number;
  /** 5.22 : rang du seigneur de guerre engagé (attaquant ou défenseur). */
  warlordRank?: number;
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
  // 5.23 : cible bien moins expérimentée : butin et XP dégressifs (plus de blocage dès ×3).
  const weak = weakTargetFactor(input.attacker.xp ?? 0, defender.xp ?? 0, !!defender.npc || !!input.attacker.npc);

  const fleet: Record<string, number> = {};
  for (const [unitId, raw] of Object.entries(input.fleet ?? {})) {
    const qty = Math.floor(Number(raw));
    if (qty <= 0) continue;
    if (!OFFENSIVE_UNITS.includes(unitId)) return { ok: false, message: "Seules les unités d'attaque peuvent être envoyées." };
    fleet[unitId] = qty;
  }
  if (Object.keys(fleet).length === 0) return { ok: false, message: "Sélectionne au moins une unité à envoyer." };
  // 5.22 : unités d'élite contre les seigneurs de guerre seulement.
  if (!defender.npc && eliteIn(fleet).length > 0) return { ok: false, message: "Les unités d'élite ne combattent que les seigneurs de guerre." };

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
  // 5.22 : rang et trait du seigneur engagé, contrés par les unités d'élite du joueur.
  const lord = owner.npc ? findWarlord(owner.npc) : attacker.npc ? findWarlord(attacker.npc) : undefined;
  const lordSide: "attacker" | "defender" = owner.npc ? "defender" : "attacker";
  let mods: WarlordCombatMods | null = null;
  if (lord && !(owner.npc && attacker.npc)) {
    const rules = warlordRankRules();
    const rank = rankOf({ rank: input.warlordRank }, rules);
    const humanUnits = lordSide === "defender" ? fleet : Object.fromEntries(Object.entries(def.units ?? {}).map(([id, st]) => [id, st?.count ?? 0]));
    mods = warlordCombatMods(lord.personality, rank, lordSide, humanUnits, rules, COMBAT_RULES.retreatAt);
  }
  const baseShield = getShieldPercent(def.buildings, allianceShieldBonus(def.allianceResearch));
  const lordEdge = mods && (mods.edgeBonus || mods.edgeCancelled) ? { bonus: mods.edgeBonus, cancel: mods.edgeCancelled } : undefined;
  // 5.23 : effets ciblés des deux camps (reliques, technos, officiers), selon l'adversaire.
  const scope = lord ? "warlord" : "pvp";
  const atkFx = playerCombatEffects(attacker, scope, now);
  const defFx = playerCombatEffects(owner, scope, now);
  const attackerEdge = edgeParam(atkFx, lordSide === "attacker" ? lordEdge : undefined);
  const defenderEdge = edgeParam(defFx, lordSide === "defender" ? lordEdge : undefined);
  const combat = resolveCombat({
    ...formation,
    // v5.9 : les Traqueurs Kesh gardent leur +50 % contre les seigneurs de guerre (PNJ).
    attackFactor: formation.attackFactor * (1 + atkMods.attack + assault) * (owner.npc ? pveAttackFactor(attacker.units, attacker.techLevels, fleet) : 1),
    cargoFactor: formation.cargoFactor * (1 + atkMods.cargo),
    // v5.9 : un seigneur de guerre (PNJ) qui attaque affronte aussi le bonus des Traqueurs à quai.
    defenderPowerFactor: (1 + defMods.defense + armor) * (attacker.npc ? pveHomeDefenseFactor(def.units ?? {}, def.techLevels ?? {}, posture.homeFleetFactor, posture.defenseFactor) : 1),
    defenseFactor: posture.defenseFactor * (mods?.defenseFactor ?? 1),
    homeFleetFactor: mods?.homeFleetFactor !== undefined ? (posture.homeFleetFactor ?? COMBAT_RULES.homeFleetDefenseFactor) * mods.homeFleetFactor : posture.homeFleetFactor,
    ...(mods?.retreatAt !== undefined ? { retreatAt: mods.retreatAt } : {}),
    ...(attackerEdge || defenderEdge ? { classEdge: { ...(attackerEdge ? { attacker: attackerEdge } : {}), ...(defenderEdge ? { defender: defenderEdge } : {}) } } : {}),
    unitBonus: { attacker: atkFx.units, defender: defFx.units },
    targetPriority: input.targetPriority === "defenses" || input.targetPriority === "ships" ? input.targetPriority : undefined,
    // v5.14 : le Corsaire en poste de l'attaquant ajoute du butin.
    lootMultiplier: lootFactor(now) * (1 + atkMods.loot) * weak,
    garrisons: input.garrisons ?? [],
    garrisonFactor: ALLIANCE_RULES.garrisonPower,
    attackerUnits: attacker.units,
    attackerTechLevels: attacker.techLevels,
    attackerRepairPct: withRepairBonus(getRepairPercent(attacker.buildings), attacker),
    fleet,
    // 5.22 : les unités d'élite à quai ne combattent que les seigneurs de guerre.
    defenderUnits: attacker.npc ? (def.units ?? {}) : withoutElite(def.units ?? {}),
    defenderTechLevels: def.techLevels ?? {},
    defenderRepairPct: withRepairBonus(getRepairPercent(def.buildings), owner),
    defenderShieldPct: mods?.shieldIgnored ? 0 : baseShield + (mods?.shieldBonus ?? 0) + defFx.shield,
    // 5.20 : dégâts conservés (planète mère ; pas les colonies). 5.21 : seigneurs de guerre compris.
    attackerHull: workshopState(attacker).hull,
    defenderHull: colony ? undefined : workshopState(owner).hull,
    // Le bunker de l'entrepôt met une partie du stock à l'abri du pillage.
    defenderResources: Object.fromEntries(
      Object.entries(def.resources ?? {}).map(([res, amount]) => [res, Math.max(0, (amount ?? 0) - protectedAmount(def.buildings, res as ResourceId, def.techLevels, def.allianceResearch, def, now))]),
    ),
  });

  // Égide de la Reine : la première défaite de la semaine n'est pas pillée.
  const aegis = combat.outcome !== "defender_win" && Object.values(combat.loot ?? {}).some((n) => (n ?? 0) > 0) && consumeAegis(owner, now);
  if (aegis) combat.loot = {};
  if (input.lootCap !== undefined && combat.loot) combat.loot = capLoot(combat.loot, input.lootCap * (mods?.lootFactor ?? 1));

  for (const [unitId, lost] of Object.entries(combat.attackerLosses)) {
    if (attacker.units[unitId]) attacker.units[unitId].count = Math.max(0, attacker.units[unitId].count - lost);
  }
  // 5.20 : les unités sauvées par l'Atelier partent en réparation (indisponibles jusqu'à la fin) ;
  // les seigneurs de guerre (PNJ) gardent leurs dégâts mais récupèrent leurs unités sauvées aussitôt.
  const attackerToWorkshop = !attacker.npc;
  applyHull(attacker, combat.attackerHull);
  if (attackerToWorkshop) sendToWorkshop(attacker, combat.attackerRecovered, now, "attack", true);
  const survivors: Record<string, number> = {};
  for (const [unitId, qty] of Object.entries(fleet)) survivors[unitId] = Math.max(0, qty - (combat.attackerLosses[unitId] ?? 0) - (attackerToWorkshop ? combat.attackerRecovered[unitId] ?? 0 : 0));
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
  // v4.9 : puissance détruite de part et d'autre (objectifs du jour d'alliance).
  const destroyedByAttacker = Math.round(lostPower(combat.defenderLosses, def.units, def.techLevels));
  const destroyedByDefender = Math.round(lostPower(combat.attackerLosses, attacker.units, attacker.techLevels));
  bumpStat(attacker, "powerDestroyed", destroyedByAttacker);
  bumpStat(def, "powerDestroyed", destroyedByDefender);
  // v5.1 : compteur de saison (classement des guerres de saison).
  addSeasonPower(attacker, destroyedByAttacker, now);
  addSeasonPower(def, destroyedByDefender, now);
  for (const [unitId, lost] of Object.entries(combat.defenderLosses)) {
    if (def.units[unitId]) def.units[unitId].count = Math.max(0, def.units[unitId].count - lost);
  }
  if (!colony) applyHull(owner, combat.defenderHull);
  if (!colony && !owner.npc) {
    // Vaisseaux à quai sauvés : à l'Atelier. Les défenses reconstruites restent en place.
    const ships = Object.fromEntries(Object.entries(combat.defenderRecovered).map(([id, n]) => [id, n - (combat.defenderRebuilt?.[id] ?? 0)]));
    sendToWorkshop(owner, ships, now, "defense", true);
  }

  const xp = computeCombatXp(combat.outcome, combat.attackerPower, combat.defenderPower, !!def.npc);
  if (xp.attackerXp > 0 && weak < 1) xp.attackerXp = Math.round(xp.attackerXp * weak);
  const defenderXpDelta = capDefenderXpLoss(xp.defenderXp, input.defenderXpLostLast24h);
  if (combat.outcome === "attacker_win") {
    if (attacker.lastDefeatAtMs && now - attacker.lastDefeatAtMs <= 3600_000) setStat(attacker, "phoenix", 1);
    attacker.victories = (attacker.victories ?? 0) + 1;
  }
  else if (combat.outcome === "defender_win") attacker.defeats = (attacker.defeats ?? 0) + 1;
  // 5.18 : XP après paliers journaliers (affichée telle quelle dans la notification et le rapport).
  xp.attackerXp = applyXpDelta(attacker, xp.attackerXp, now, "attack");
  attacker.lastAttackAtMs = now;

  if (combat.outcome === "defender_win") owner.victories = (owner.victories ?? 0) + 1;
  else if (combat.outcome === "attacker_win") {
    owner.defeats = (owner.defeats ?? 0) + 1;
    if (colony) colony.lastDefeatAtMs = now;
    else if (!owner.npc) owner.lastDefeatAtMs = now;
  }
  applyXpDelta(owner, defenderXpDelta, now, "defense");
  if (combat.outcome === "attacker_win") recordContract(attacker, "win_attack", 1, now);
  if (combat.outcome === "defender_win") recordContract(owner, "win_defense", 1, now);
  if (combat.outcome === "attacker_win") {
    grantCommanderXp(attacker, "admiral", COMMANDER_XP.attackWin);
    grantCommanderXp(attacker, "corsair", COMMANDER_XP.attackWin);
  }
  if (combat.outcome === "attacker_win") addPassPoints(attacker, "victory", now);
  // v5.14 : table de butin (joueur : très rare ; seigneur de guerre : un peu plus).
  const extraLoot = combat.outcome === "attacker_win" ? describeLoot(rollLoot(attacker, owner.npc ? "warlord" : "pvp", now, -1, Math.random, lootDifficulty(combat.defenderPower, combat.attackerPower))) : "";
  if (combat.outcome === "attacker_win" && owner.npc) recordChronicle(attacker, "warlordWin", now);
  if (combat.outcome === "defender_win") addPassPoints(owner, "victory", now);
  grantCommanderXp(owner, "strategist", combat.outcome === "defender_win" ? COMMANDER_XP.defenseWin : COMMANDER_XP.defenseLost);
  if (combat.outcome === "defender_win") grantCommanderXp(owner, "warden", COMMANDER_XP.defenseWin);

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
      message: `Attaque contre ${def.pseudo} (${xp.attackerXp >= 0 ? "+" : ""}${xp.attackerXp} XP).${combat.loot && describeGain(combat.loot) !== "rien" ? ` Butin en route : ${describeGain(combat.loot)}.` : ""}${extraLoot}`,
      createdAtMs: now,
      read: false,
      data: { resources: combat.loot ?? undefined, xp: xp.attackerXp > 0 ? xp.attackerXp : undefined, toUid: def.uid, toPseudo: def.pseudo },
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
      message: `Attaque de ${input.attacker.pseudo}${colony ? ` sur ${colony.name}` : ""}${defenderXpDelta ? ` (${defenderXpDelta > 0 ? "+" : ""}${defenderXpDelta} XP)` : ""}.${combat.loot && describeGain(combat.loot) !== "rien" ? ` Pillé : ${describeGain(combat.loot)}.` : ""}${aegis ? " L'Égide de la Reine a protégé tes réserves du pillage." : ""}${armor > 0 ? ` Carapace réactive consommée (+${Math.round(armor * 100)} % de défense).` : ""}`,
      createdAtMs: now,
      read: false,
      data: { resources: combat.loot ?? undefined, xp: defenderXpDelta > 0 ? defenderXpDelta : undefined, fromUid: input.attacker.uid, fromPseudo: input.attacker.pseudo },
    },
  ];

  // 6.13.0 (proposals/lunes.md, I21) : un gros combat sur la planète mère d'un joueur peut faire naître une lune.
  const debris = debrisFromLosses([combat.attackerLosses, combat.defenderLosses, ...(combat.garrisonLosses ?? [])], eventDebrisPercent(now) ?? DEBRIS_RULES.percent);
  const moon = rollMoon(owner, debrisTotal(debris), { now, onColony: !!colony, rand: input.rand });
  if (moon) {
    owner.moon = moon;
    defenderNotifications.push({
      kind: "event",
      title: `Une lune est née : ${moon.name}`,
      message: `Les débris du combat se sont rassemblés en orbite. ${moon.name} veille sur ta planète : +${Math.round(MOON_RULES.shieldBonus * 100)} % de bouclier, +${Math.round(MOON_RULES.protectedStorageBonus * 100)} % d'entrepôt à l'abri.`,
      createdAtMs: now,
      read: false,
    });
    notifications.push({ kind: "event", title: `Une lune est née au-dessus de ${def.pseudo}`, message: `Les débris de ton attaque ont formé ${moon.name}, la lune de ${def.pseudo}.`, createdAtMs: now, read: false });
  }

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
    combatLog: { ...combatLogOf(combat), ...(mods ? { warlord: { side: lordSide, rank: mods.rank, notes: mods.notes } } : {}) },
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
    debris,
  };
}

/** Puissance (attaque + défense) des unités perdues. */
function lostPower(losses: Record<string, number>, units: PlayerState["units"], techLevels: PlayerState["techLevels"]): number {
  const lost = Object.fromEntries(Object.entries(losses).filter(([, n]) => n > 0).map(([id, n]) => [id, { level: units?.[id]?.level ?? 1, count: n }]));
  return computeFullPower(lost, techLevels ?? {}, Object.keys(lost), ["attack", "defense"]);
}
