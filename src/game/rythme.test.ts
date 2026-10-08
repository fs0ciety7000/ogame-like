import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { ascend, ascensionCount, ASCENSION_RULES, canAscend } from "@/game/ascension";
import { BUILD_TIME_RULES, BUILDINGS, DOCK_BUILDING_ID, getBuildingUpgradeCost, getBuildingUpgradeTime, requiredForAscension } from "@/game/buildings";
import { applyGameContent, defaultGameContent, resolveGameContent, type GameContent } from "@/game/content";
import { ECONOMY_RULES } from "@/game/economy";
import { MOON_RULES } from "@/game/moon";
import { EXCHANGE_RULES } from "@/game/resources";
import { applyRhythmSwitch, RHYTHM_PREVIOUS, RHYTHM_RULES, rhythmAnnounceAt, rhythmPhase, rhythmSwitched } from "@/game/rhythm";
import { getTechTime, RESEARCH_RULES, TECHNOLOGIES } from "@/game/technologies";
import { ANNOUNCEMENTS, ANNOUNCEMENTS_ALL, announcementOpen } from "@/components/game/Announcement";
import { defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

/* 6.14.88 (RL-3, proposals/rythme-long-terme.md §5) : bascule datée du rythme.
   Avant la date, le jeu garde exactement les valeurs d'avant ; à la date, chaque réglage resté à son ancien défaut prend la
   valeur du groupe `rhythm` ; un réglage de l'admin est gardé ; rien n'est retiré aux comptes existants. */

const AT = RHYTHM_RULES.switchAt;
const DAY = 86_400_000;
const T2 = "extracteur_ferraille";
const fresh = () => structuredClone(defaultGameContent());

afterEach(() => applyGameContent({}));

describe("6.14.88 (RL-3) bascule du rythme", () => {
  it("date par défaut : 1er novembre 2026 à 0 h, heure de Paris ; annonce 7 jours avant", () => {
    expect(new Date(AT).toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(rhythmAnnounceAt()).toBe(AT - 7 * DAY);
    expect(rhythmPhase(RHYTHM_RULES, AT - 8 * DAY)).toBe("later");
    expect(rhythmPhase(RHYTHM_RULES, AT - 7 * DAY)).toBe("announced");
    expect(rhythmPhase(RHYTHM_RULES, AT)).toBe("switched");
    expect(rhythmPhase({ ...RHYTHM_RULES, enabled: false }, AT + DAY)).toBe("off");
  });

  it("avant la date : contenu et règles exactement ceux d'avant (sans heure, avec l'heure d'une seconde avant)", () => {
    const before = resolveGameContent({});
    expect(resolveGameContent({}, AT - 1000)).toEqual(before);
    expect(resolveGameContent({}, Date.UTC(2026, 9, 7))).toEqual(before);
    applyGameContent({}, AT - 1000);
    expect(ASCENSION_RULES).toMatchObject({ cooldownDays: 7, maxAscensions: 5 });
    expect(RESEARCH_RULES).toMatchObject({ lateFromLevel: 0, lateTimeFactor: 1, maxLevelSeconds: 0 });
    expect(EXCHANGE_RULES.commonToRare).toBe(0.01);
    expect(ECONOMY_RULES).toMatchObject({ missionProductionMultiplier: 1.5, missionRareProductionRef: 150_000 });
    expect(MOON_RULES).toMatchObject({ upgradeCost: { scrap: 500_000, energy: 250_000 }, costGrowth: 2, debrisPerPercent: 100_000 });
    const b = BUILDINGS.find((x) => x.id === T2)!;
    expect(getBuildingUpgradeTime(b, 11)).toBe(10_800);
    expect(getBuildingUpgradeTime(b, 20)).toBe(10_800 + 9 * 3_600);
  });

  it("à la date : nouvelles valeurs (second palier, recherche, Ascension, comptoir, missions, lune)", () => {
    const defaults = defaultGameContent().buildings;
    const costBefore = getBuildingUpgradeCost(BUILDINGS.find((x) => x.id === T2)!, 15);
    applyGameContent({}, AT);
    expect(ASCENSION_RULES).toMatchObject({ cooldownDays: 30, maxAscensions: 10 });
    expect(RESEARCH_RULES).toMatchObject({ lateFromLevel: 7, lateTimeFactor: 25, maxLevelSeconds: 604_800, costGrowth: 2.7, timeGrowth: 1.67 });
    expect(EXCHANGE_RULES.commonToRare).toBe(0.004);
    expect(ECONOMY_RULES).toMatchObject({ missionProductionMultiplier: 0.75, missionRareProductionRef: 400_000 });
    expect(MOON_RULES).toMatchObject({ upgradeCost: { scrap: 20_000_000, energy: 10_000_000 }, costGrowth: 3, debrisPerPercent: 2_000_000 });
    // Second palier : 36 h au niveau 11, 279 h au niveau 20, pour les 8 bâtiments exigés par l'Ascension (6.14.89, RL-5 ; 30 h et 246 h en RL-3).
    const required = BUILDINGS.filter((b) => requiredForAscension(b) && b.upgrade.tier2);
    expect(required).toHaveLength(8);
    for (const b of required) {
      expect(getBuildingUpgradeTime(b, 11), b.id).toBe(129_600);
      expect(getBuildingUpgradeTime(b, 20), b.id).toBe(129_600 + 9 * 97_200);
      // Premier palier : coûts inchangés ; durées de la courbe du départ (6.14.159, RD-1) : niveaux 2 à 7 inchangés par la bascule,
      // jonction lissée au niveau 10 (36 h ÷ 4 = 9 h au lieu de 1 h 30 puis 36 h).
      const d = defaults.find((x) => x.id === b.id)!;
      for (let l = 2; l <= 7; l++) expect(getBuildingUpgradeTime(b, l), `${b.id} ${l}`).toBe(getBuildingUpgradeTime(d, l));
      expect(getBuildingUpgradeTime(b, 10), b.id).toBe(Math.max((10 - 1) * d.upgrade.secondsPerLevel, 129_600 / BUILD_TIME_RULES.junctionMaxRatio));
      expect(getBuildingUpgradeCost(b, 10), b.id).toEqual(getBuildingUpgradeCost(d, 10));
    }
    // Coûts ×4 (AE-L2) sur tout bâtiment à second palier, Cale sèche comprise ; la Cale garde ses durées (§5.1).
    const cost = getBuildingUpgradeCost(BUILDINGS.find((x) => x.id === T2)!, 15);
    for (const [k, v] of Object.entries(costBefore)) {
      // Même courbe, base et maximum ×4 : à l'arrondi près.
      expect(cost[k as keyof typeof cost]!, k).toBeGreaterThanOrEqual(v! * 4);
      expect(cost[k as keyof typeof cost]!, k).toBeLessThanOrEqual(v! * 4 + 4);
    }
    const dock = BUILDINGS.find((x) => x.id === DOCK_BUILDING_ID)!;
    expect(getBuildingUpgradeTime(dock, 11)).toBe(10_800);
    expect(dock.upgrade.tier2!.baseCost.nano).toBe(4 * defaults.find((x) => x.id === DOCK_BUILDING_ID)!.upgrade.tier2!.baseCost.nano!);
    // Recherche : niveaux 1 à 6 inchangés, ×25 dès le 7, 7 jours au plus avant réductions (6.14.89 ; dès le 6, ×30 en RL-3).
    const t = TECHNOLOGIES.find((x) => x.maxLevel >= 8 && x.costGrowth === undefined)!;
    expect(getTechTime(t, 6)).toBe(Math.floor(t.baseTime * Math.pow(1.67, 5)));
    expect(getTechTime(t, 7)).toBe(Math.min(604_800, Math.floor(t.baseTime * Math.pow(1.67, 6) * 25)));
  });

  it("un réglage modifié par l'admin est gardé ; les valeurs visées sont elles-mêmes réglables", () => {
    const content: Partial<GameContent> = {
      rules: { ascension: { cooldownDays: 14 }, exchange: { commonToRare: 0.02 }, rhythm: { maxAscensions: 8, tier2BaseSeconds: 72_000 } } as never,
      buildings: fresh().buildings.map((b) => (b.id === T2 ? { ...b, upgrade: { ...b.upgrade, tier2: { ...b.upgrade.tier2!, baseCost: { ...b.upgrade.tier2!.baseCost, scrap: 1_000 } } } } : b)),
    };
    applyGameContent(content, AT + DAY);
    expect(ASCENSION_RULES.cooldownDays).toBe(14);
    expect(ASCENSION_RULES.maxAscensions).toBe(8);
    expect(EXCHANGE_RULES.commonToRare).toBe(0.02);
    const b = BUILDINGS.find((x) => x.id === T2)!;
    // Coûts réglés à la main : gardés tels quels ; durées restées au défaut : basculées (valeur réglée dans `rhythm`).
    expect(b.upgrade.tier2!.baseCost.scrap).toBe(1_000);
    expect(getBuildingUpgradeTime(b, 11)).toBe(72_000);
  });

  it("bascule coupée ou décalée : anciennes valeurs ; jamais moins d'Ascensions qu'avant", () => {
    applyGameContent({ rules: { rhythm: { enabled: false } } as never }, AT + DAY);
    expect(ASCENSION_RULES).toMatchObject({ cooldownDays: 7, maxAscensions: 5 });
    applyGameContent({ rules: { rhythm: { switchAt: AT + 30 * DAY } } as never }, AT + DAY);
    expect(ASCENSION_RULES).toMatchObject({ cooldownDays: 7, maxAscensions: 5 });
    expect(rhythmSwitched({ enabled: true, switchAt: AT + 30 * DAY }, AT + DAY)).toBe(false);
    applyGameContent({ rules: { rhythm: { maxAscensions: 3 } } as never }, AT + DAY);
    expect(ASCENSION_RULES.maxAscensions).toBe(RHYTHM_PREVIOUS.maxAscensions);
  });

  it("idempotente : un contenu déjà basculé (enregistré par l'admin après la date) ne bascule pas deux fois", () => {
    const switched = resolveGameContent({}, AT);
    const again = applyRhythmSwitch(switched, defaultGameContent().buildings, AT + DAY);
    expect(again.buildings).toEqual(switched.buildings);
    expect(again.rules).toEqual(switched.rules);
    // Pur : le contenu d'entrée n'est pas modifié.
    const raw = resolveGameContent({});
    const copy = structuredClone(raw);
    applyRhythmSwitch(raw, defaultGameContent().buildings, AT);
    expect(raw).toEqual(copy);
  });

  it("comptes existants : rien n'est retiré, un chantier lancé garde sa fin, l'Ascension passe de 5 à 10", () => {
    const player = { buildings: {}, resources: {}, ascensions: 5, ascendedAtMs: AT - 40 * DAY, techLevels: {}, stats: {} } as unknown as PlayerState;
    for (const b of BUILDINGS) (player.buildings as Record<string, unknown>)[b.id] = { unlocked: true, level: b.maxLevel };
    const queues = defaultQueues();
    // Avant : maximum de 5 atteint.
    applyGameContent({}, AT - DAY);
    expect(canAscend(player, queues, AT - DAY).ok).toBe(false);
    // Un chantier lancé la veille garde la fin écrite au lancement.
    const b = BUILDINGS.find((x) => x.id === T2)!;
    const endTime = AT - DAY + getBuildingUpgradeTime(b, 11) * 1000;
    // Après : 6e Ascension possible (délai de 30 jours compté depuis la dernière, ici 40 jours).
    applyGameContent({}, AT);
    expect(endTime).toBe(AT - DAY + 10_800_000);
    expect(canAscend(player, queues, AT).ok).toBe(true);
    ascend(player, { ...queues, buildingUpgrades: {} }, AT);
    expect(ascensionCount(player)).toBe(6);
    // Le délai de 30 jours s'applique ensuite (bâtiments remontés au maximum).
    for (const b of BUILDINGS) (player.buildings as Record<string, unknown>)[b.id] = { unlocked: true, level: b.maxLevel };
    expect(canAscend(player, queues, AT + 10 * DAY).reason).toMatch(/20 jour/);
    expect(canAscend(player, queues, AT + 30 * DAY).ok).toBe(true);
  });

  it("annonce en jeu : datée 7 jours avant, illustrée (6.14.92)", () => {
    const a = ANNOUNCEMENTS_ALL.find((x) => x.id === "v6.14-rythme")!;
    expect(a).toBeTruthy();
    expect(a.pendingArt).toBeFalsy();
    expect(a.artSlot).toBe("annonce-rythme");
    expect(ANNOUNCEMENTS.some((x) => x.id === "v6.14-rythme")).toBe(true);
    expect(announcementOpen(a, rhythmAnnounceAt() - 1)).toBe(false);
    expect(announcementOpen(a, rhythmAnnounceAt())).toBe(true);
    expect(a.eyebrow).toContain("1er novembre");
    expect(a.features?.[0].text).toContain("36 h");
  });

  it("le groupe `rhythm` est dans GameRules et chaque valeur a son champ dans l'admin", () => {
    expect(defaultGameContent().rules.rhythm).toEqual(RHYTHM_RULES);
    const fields = readFileSync("src/pages/admin/RhythmRulesFields.tsx", "utf8");
    for (const key of Object.keys(RHYTHM_RULES)) expect(fields, key).toMatch(new RegExp(`setRhythm\\(\\{ ${key}:`));
    // Le serveur et le client résolvent le contenu avec l'heure du moment.
    expect(readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8")).toContain("game.applyGameContent(overrides, Date.now());");
    expect(readFileSync("src/services/contentService.ts", "utf8")).toContain("applyGameContent(overrides, now);");
  });
});
