/* =====================================================
   6.14.44 (É30-1a, proposals/phalange-porte-de-saut.md, option J1) : porte de
   saut lunaire. Dès le niveau 3 de la lune, une flotte du joueur en patrouille,
   en garnison ou en base avancée rentre d'un coup à la planète mère. Gratuit ;
   la recharge est la limite. Le serveur (lot É30-1b) fait rentrer la flotte par
   `resolveFleetReturn` (I8) puis appelle `markJump`. Invariant I23.
   J3 (saut de garnison vers un allié à lune) : réglages livrés, désactivé
   (`allyJump: false`, Q35) ; aucune route ne l'utilise encore.
   Règles : valeurs littérales seulement (CLAUDE.md « Initialisation des modules »).
===================================================== */
import { GameActionError } from "@/game/errors";
import type { Fleet, FleetMission } from "@/game/fleets";
import { playerModifiers } from "@/game/modifiers";
import { moonLevel, playerMoon } from "@/game/moon";
import { formatWait } from "@/game/phalanx";
import { bumpStat } from "@/game/stats";
import { setActionAvailability, trackAction } from "@/game/trackedActions";
import type { PlayerState } from "@/types/game";

/** Réglages (Admin → Règles → Lunes : porte de saut ; registre « jumpGate »). */
export const JUMP_GATE_RULES = {
  /** false : plus aucun saut. */
  enabled: true,
  /** Niveau de lune qui ouvre la porte. */
  minMoonLevel: 3,
  /** Recharge au niveau minimal, en heures. */
  cooldownHours: 24,
  /** Heures de recharge en moins par niveau au-delà du minimum. */
  cooldownCutPerLevel: 2,
  /** Recharge minimale, en heures (effets compris). */
  cooldownMinHours: 6,
  /** Missions que la porte peut rapatrier (l'admin peut seulement en retirer : voir JUMPABLE_MISSIONS). */
  missions: ["patrol", "garrison", "colonybase"] as string[],
  /** J3 (niveau 5) : saut de garnison vers un allié qui a aussi une lune. Désactivé par défaut (Q35). */
  allyJump: false,
  allyJumpMinMoonLevel: 5,
  allyJumpArrivalMinutes: 5,
  /** 6.14.48 : une attaque repoussée moins de N minutes après un saut compte comme un sauvetage (`gateSaves`, succès secret). */
  saveWindowMinutes: 10,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const JUMP_GATE_RULES_META = {
  enabled: { label: "Porte de saut activée", hint: "Décoché : plus aucun saut." },
  minMoonLevel: { label: "Niveau de lune qui ouvre la porte", unit: "niveau", min: 1, max: 20 },
  cooldownHours: { label: "Recharge au niveau minimal", unit: "h", min: 0, max: 168 },
  cooldownCutPerLevel: { label: "Recharge en moins par niveau au-delà du minimum", unit: "h", min: 0, max: 48 },
  cooldownMinHours: { label: "Recharge minimale, effets compris", unit: "h", min: 0, max: 168 },
  missions: { label: "Missions que la porte rapatrie", hint: "patrol, garrison, colonybase : on peut seulement en retirer." },
  allyJump: { label: "Saut de garnison vers un allié", hint: "L'allié doit aussi avoir une lune." },
  allyJumpMinMoonLevel: { label: "Saut vers un allié : niveau de lune requis", unit: "niveau", min: 1, max: 20 },
  allyJumpArrivalMinutes: { label: "Saut vers un allié : arrivée après", unit: "min", min: 0, max: 1440 },
  saveWindowMinutes: { label: "Fenêtre d'un sauvetage", unit: "min", min: 0, max: 1440, hint: "Une attaque repoussée dans ce délai après un saut compte comme un sauvetage (succès secret)." },
};

/** Missions qu'un saut peut rapatrier, au plus (I23) : jamais une attaque ni un retour de raid (pas de pillage « aller simple »),
 *  ni un transport ou une livraison (pas de convoi instantané), ni une expédition, une sonde, un recyclage, un boss ou une prime. */
export const JUMPABLE_MISSIONS: readonly FleetMission[] = ["patrol", "garrison", "colonybase"];

/** Statuts d'une flotte que la porte peut rapatrier (pas « done », pas « decision »). */
const JUMPABLE_STATUS: readonly Fleet["status"][] = ["outbound", "stationed", "returning"];

type GatePlayer = Partial<Pick<PlayerState, "moon" | "commanders" | "relics" | "ascensions" | "territory" | "talents" | "modules" | "empireClass">>;

const num = (v: unknown, d = 0): number => (Number.isFinite(Number(v)) ? Number(v) : d);

/** Missions permises en vigueur (réglage ∩ liste sûre). */
export function jumpMissions(): FleetMission[] {
  const allowed = new Set(Array.isArray(JUMP_GATE_RULES.missions) ? JUMP_GATE_RULES.missions : []);
  return JUMPABLE_MISSIONS.filter((m) => allowed.has(m));
}

/** Niveau de lune requis pour ouvrir la porte (1 au moins). */
export function gateMinLevel(): number {
  return Math.max(1, Math.floor(num(JUMP_GATE_RULES.minMoonLevel, 3)));
}

/** La porte est-elle ouverte pour ce joueur (lune au niveau requis) ? */
export function gateUnlocked(player: Pick<GatePlayer, "moon"> | null | undefined): boolean {
  const m = playerMoon(player);
  return !!m && JUMP_GATE_RULES.enabled === true && moonLevel(m) >= gateMinLevel();
}

/** Recharge de la porte à un niveau de lune, effet `jumpGateCooldown` compris (null : porte fermée à ce niveau). */
export function gateCooldownMs(level: number, player?: GatePlayer | null): number | null {
  const lvl = Math.floor(num(level));
  if (!JUMP_GATE_RULES.enabled || lvl < gateMinLevel()) return null;
  const min = Math.max(0, num(JUMP_GATE_RULES.cooldownMinHours));
  const base = num(JUMP_GATE_RULES.cooldownHours) - Math.max(0, num(JUMP_GATE_RULES.cooldownCutPerLevel)) * (lvl - gateMinLevel());
  const mods = player ? playerModifiers(player) : null;
  const cut = Math.max(0, Math.min(1, mods ? mods.jumpGateCooldown : 0));
  return Math.round(Math.max(min, base * (1 - cut)) * 3_600_000);
}

/** Heure à laquelle la porte sera prête (0 : prête). */
export function gateReadyAtMs(player: Pick<GatePlayer, "moon"> | null | undefined): number {
  return Math.max(0, num(playerMoon(player)?.gateReadyAtMs));
}

/** Raison du refus d'un saut, ou null s'il est permis (I23). */
export function jumpRefusal(
  player: GatePlayer & Pick<PlayerState, "uid">,
  fleet: Pick<Fleet, "ownerUid" | "mission" | "status"> & { loot?: Fleet["loot"] },
  now: number,
): string | null {
  if (!JUMP_GATE_RULES.enabled) return "La porte de saut est désactivée.";
  const m = playerMoon(player);
  if (!m) return "Il te faut une lune pour ouvrir une porte de saut.";
  if (moonLevel(m) < gateMinLevel()) return `Ta lune doit atteindre le niveau ${gateMinLevel()} pour ouvrir la porte de saut.`;
  if (fleet.ownerUid !== player.uid) return "Cette flotte n'est pas à toi.";
  if (!jumpMissions().includes(fleet.mission)) return "La porte ne ramène que les patrouilles, garnisons et bases avancées.";
  if (!JUMPABLE_STATUS.includes(fleet.status)) return fleet.status === "done" ? "Cette flotte est déjà rentrée." : "Cette flotte attend ta décision : la porte ne peut pas la ramener.";
  // Rien ne voyage par la porte que les vaisseaux (aucune ressource créée ni déplacée, I23).
  if (Object.values(fleet.loot ?? {}).some((n) => Number(n) > 0)) return "La porte ne ramène pas une flotte chargée.";
  const ready = gateReadyAtMs(player);
  if (ready > now) return `Ta porte de saut se recharge : encore ${formatWait(ready - now)}.`;
  return null;
}

export function canJump(...args: Parameters<typeof jumpRefusal>): boolean {
  return jumpRefusal(...args) === null;
}

/** Vérifie un saut (refus en `GameActionError`, tutoiement). */
export function checkJump(...args: Parameters<typeof jumpRefusal>): void {
  const why = jumpRefusal(...args);
  if (why) throw new GameActionError(why);
}

/** Flotte prête pour `resolveFleetReturn` : retour dû maintenant. Les unités ne changent pas (I1, I23). */
export function jumpedFleet<F extends Pick<Fleet, "status" | "returnAtMs">>(fleet: F, now: number): F {
  return { ...fleet, status: "returning", returnAtMs: now } as F;
}

/** Après un saut : recharge posée (`moon.gateReadyAtMs`) et compteur `gateJumps`. Rend l'heure du prochain saut. */
export function markJump(player: PlayerState, now: number): number {
  const m = playerMoon(player);
  const ms = m ? gateCooldownMs(moonLevel(m), player) : null;
  if (!m || ms === null) throw new GameActionError("Ta porte de saut est fermée.");
  const readyAtMs = now + ms;
  player.moon = { ...m, gateReadyAtMs: readyAtMs, lastJumpAtMs: now };
  bumpStat(player, "gateJumps");
  // 6.14.119 (AP-L7) : action suivie (épisodes, défis du passe, saga, objectif du jour « porte de saut »).
  trackAction(player, "gateJump", now);
  return readyAtMs;
}

const MISSION_PHRASE: Partial<Record<FleetMission, string>> = { patrol: "ta patrouille", garrison: "ta garnison", colonybase: "ta base avancée" };

/** Texte du saut réussi (§5.5). */
export function jumpText(mission: FleetMission, readyAtMs: number, now: number): { title: string; message: string } {
  return { title: "Saut réussi", message: `Saut réussi : ${MISSION_PHRASE[mission] ?? "ta flotte"} est à quai. Prochain saut dans ${formatWait(readyAtMs - now)}.` };
}

/** J3 : le saut de garnison vers un allié est-il ouvert à ce joueur ? (désactivé par défaut) */
export function allyJumpAllowed(player: Pick<GatePlayer, "moon"> | null | undefined): boolean {
  const m = playerMoon(player);
  return !!m && JUMP_GATE_RULES.enabled === true && JUMP_GATE_RULES.allyJump === true && moonLevel(m) >= Math.max(1, Math.floor(num(JUMP_GATE_RULES.allyJumpMinMoonLevel, 5)));
}

/** 6.14.48 : l'attaque repoussée à `now` l'a-t-elle été par une flotte rapatriée dans la fenêtre `saveWindowMinutes` ?
 *  Un saut ne compte qu'une fois : le sauvetage efface `lastJumpAtMs`, puis le compteur `gateSaves` monte. */
export function markGateSave(player: PlayerState, now: number): boolean {
  const m = playerMoon(player);
  const at = num(m?.lastJumpAtMs);
  const windowMs = Math.max(0, num(JUMP_GATE_RULES.saveWindowMinutes)) * 60_000;
  if (!m || at <= 0 || now < at || now - at > windowMs) return false;
  player.moon = { ...m, lastJumpAtMs: 0 };
  bumpStat(player, "gateSaves");
  return true;
}

// 6.14.119 (AP-L7) : l'objectif du jour « Ramener une flotte par la porte de saut » n'est proposé qu'à un joueur dont la porte est ouverte.
setActionAvailability("gateJump", (p) => JUMP_GATE_RULES.enabled === true && gateUnlocked(p));
