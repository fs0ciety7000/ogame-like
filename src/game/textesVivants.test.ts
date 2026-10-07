import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState } from "@/game/defaults";
import { linkReferrer, referralGoalLabel, referralWindowText } from "@/game/referral";
import { bountyBoardText, bountyRank, findShopItem } from "@/game/bounties";
import { dailyOrders } from "@/game/dailyOrders";
import { allianceBossCallText, allianceBossDurationText } from "@/game/allianceBoss";
import { MUTATORS, mutatorEffects, MUTATOR_RULES, validateMutatorRules } from "@/game/mutators";
import { GUIDE_STEPS } from "@/game/advancedGuide";
import { expeditionRelicChanceText } from "@/game/relics";
import { CAPSULES } from "@/game/synthesis";
import { COMMANDER_SOURCES } from "@/game/commanders";
import { PAGE_TIPS } from "@/components/game/PageTip";
import type { PlayerState } from "@/types/game";

/* =====================================================
   6.14.105 (AU27, lot AA4 : constats AA-21 et AA-22) : un texte montré au
   joueur qui cite un chiffre de règle le lit dans la règle en vigueur.
   1. À règles par défaut, les textes sont identiques mot pour mot à ceux
      d'avant le lot (relevé du 2026-10-07).
   2. Un réglage de l'admin (applyGameContent) change le texte.
   3. Garde légère : les chiffres retirés ne reviennent pas en dur dans les
      fichiers relevés.
===================================================== */

afterEach(() => applyGameContent({}));

const NOW = Date.UTC(2026, 9, 7, 12);
const player = () => ({ ...defaultPlayerState("u1", "Matinal"), uid: "u1", createdAt: null }) as unknown as PlayerState;
const order = (id: string, p = player()) => dailyOrders(p, NOW).find((o) => o.id === id)!;
const step = (id: string) => GUIDE_STEPS.find((s) => s.id === id)!.learn;
const mutator = (id: string) => MUTATORS.find((m) => m.id === id)!;

describe("textes de règle vivants (6.14.105, AA4)", () => {
  it("à règles par défaut, les textes sont ceux d'avant le lot", () => {
    applyGameContent({});
    // Parrainage.
    expect(referralWindowText()).toBe("48 h");
    expect(referralGoalLabel()).toBe("Bronze I");
    const recruit = { ...player(), uid: "r1", createdAtMs: NOW - 49 * 3600_000 } as PlayerState;
    expect(() => linkReferrer(recruit, { uid: "s1", pseudo: "Parrain" }, NOW)).toThrow("Le parrainage se déclare dans les 48 h qui suivent l'inscription.");
    // Primes.
    expect(bountyBoardText()).toBe("4 contrats toutes les 8 h");
    expect(order("bounties").period).toBe("8 h");
    expect(order("bounties").detail).toBe("Ouvre le tableau : 4 contrats toutes les 8 h.");
    expect(order("expedition").detail).toBe("Jusqu'à 3 par jour, une à la fois.");
    expect([0, 1, 9, 10, 29, 30, 69, 70, 149, 150, 999].map(bountyRank)).toEqual([1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    // Boss d'alliance.
    expect(allianceBossDurationText()).toBe("24 h pour l'abattre");
    expect(allianceBossCallText()).toBe("24 h pour l'abattre, un assaut toutes les 4 h");
    // Comptoir.
    expect(findShopItem("blueprint")?.description).toBe("Débloque le Traqueur Kesh au chantier : rapide, +50 % d'attaque contre tous les PNJ (seigneurs, menaces, primes, boss, Léviathan).");
    // Mutateurs : mêmes phrases et mêmes effets qu'avant.
    expect(MUTATORS.map((m) => m.description)).toEqual([
      "Les forges tournent à plein : +10 % de production de toutes les ressources.",
      "Les équipes se relaient jour et nuit : −15 % de temps de construction.",
      "Les laboratoires s'emballent : −15 % de temps de recherche.",
      "Les courants stellaires portent les flottes : −15 % de temps de vol.",
      "Le secteur s'embrase : +10 % d'attaque et +20 % de butin pillé.",
      "Les ingénieurs renforcent les coques : +10 % de défense et +10 % de vaisseaux réparés.",
      "Les comptoirs baissent leurs taxes : −50 % de taxe au marché et sur les cadeaux.",
      "Les arsenaux accélèrent : −20 % de temps de production des unités.",
      "Des soutes repensées : +25 % de cargaison pour les flottes.",
      "Les géants sont vulnérables : +15 % de dégâts contre les boss.",
    ]);
    expect(MUTATORS.map((m) => m.grants.map((g) => g.value))).toEqual([[0.1], [0.15], [0.15], [0.15], [0.1, 0.2], [0.1, 0.1], [0.5], [0.2], [0.25], [0.15]]);
    // Carnet du commandant (astuces de progression).
    expect(step("dailyGoal")).toBe("Chaque jour, 4 objectifs tirés pour toi : ressources rares, XP et jetons. Ils se renouvellent à minuit, heure de Paris, et ta série grimpe si tu fais les 4.");
    expect(step("colonyRoute")).toBe("Une route fait voyager les ressources sans flotte : rapatrier le stock de la colonie, ou la ravitailler depuis ta planète mère. 10 % se perdent en route.");
    expect(step("moonWatch")).toBe("Un gros combat chez toi peut faire naître une lune. Sa phalange signale les attaques sur tes alliés proches ; au niveau 3, sa porte de saut ramène une flotte d'un coup. Sans lune, envoie une garnison à un allié menacé.");
    // Seul écart voulu : le texte disait « un point de talent » alors qu'une Ascension en donne 3 (TALENT_RULES.pointsPerAscension).
    expect(step("ascend")).toBe("Tous les bâtiments au maximum : l'Ascension les remet au niveau 1 contre +10 % de production et −5 % de temps de construction, pour toujours, et 3 points de talent.");
    // Reliques, capsules, officiers.
    expect(expeditionRelicChanceText()).toBe("jusqu'à 15 % à 8 h");
    expect(CAPSULES.armor.description(5)).toBe("+5 % de défense contre la première attaque de joueur subie (12 h).");
    expect(COMMANDER_SOURCES.admiral[0]).toEqual({ label: "Attaque gagnée", xp: 20 });
  });

  it("un réglage de l'admin change le texte (parrainage, primes, boss d'alliance, Comptoir, mutateur, astuce)", () => {
    applyGameContent({
      rules: {
        referral: { linkWindowHours: 72 },
        bounties: { dailyLimit: 5, refreshHours: 6, ranks: [{ name: "Larve", at: 0 }, { name: "Éclaireur", at: 5 }, { name: "Traqueur", at: 30 }, { name: "Lame de l'Essaim", at: 70 }, { name: "Main de la Reine", at: 150 }] },
        allianceBoss: { durationHours: 36, cooldownHours: 3 },
        combat: { keshPveBonus: 0.6 },
        mutators: { values: { ruee: [0.12], guerre: [0.1, 0.3] } },
        dailyContracts: { perDay: 5 },
        colonyRoutes: { feePct: 0.15 },
        jumpGate: { minMoonLevel: 4 },
        synthesis: { activeHours: 8 },
        commanderXp: { attackWin: 25 },
        pvp: { newbieProtectionMs: 96 * 3600_000 },
        expeditions: { maxPerDay: 4 },
      },
      relicSettings: { expeditionMax: 0.2 },
    } as never);
    // Parrainage.
    expect(referralWindowText()).toBe("72 h");
    const recruit = { ...player(), uid: "r1", createdAtMs: NOW - 73 * 3600_000 } as PlayerState;
    expect(() => linkReferrer(recruit, { uid: "s1", pseudo: "Parrain" }, NOW)).toThrow("dans les 72 h qui suivent");
    // Primes (texte, rythme et rang de la fiche publique, AA-22).
    expect(bountyBoardText()).toBe("5 contrats toutes les 6 h");
    expect(order("bounties").period).toBe("6 h");
    expect(bountyRank(5)).toBe(2);
    expect(order("expedition").detail).toBe("Jusqu'à 4 par jour, une à la fois.");
    // Boss d'alliance (texte de la notification serveur).
    expect(allianceBossCallText()).toBe("36 h pour l'abattre, un assaut toutes les 3 h");
    // Comptoir.
    expect(findShopItem("blueprint")?.description).toContain("+60 % d'attaque contre tous les PNJ");
    // Mutateur : texte et effet suivent la valeur réglée, l'autre effet garde son défaut.
    expect(mutator("ruee").description).toBe("Les forges tournent à plein : +12 % de production de toutes les ressources.");
    expect(mutator("guerre").description).toBe("Le secteur s'embrase : +10 % d'attaque et +30 % de butin pillé.");
    MUTATOR_RULES.enabled = true;
    MUTATOR_RULES.overrides = { "2026-10": "ruee" };
    expect(mutatorEffects(NOW)[0].value).toBe(0.12);
    // Astuces (Carnet, bulle de page).
    expect(step("dailyGoal")).toContain("5 objectifs");
    expect(step("colonyRoute")).toContain("15 % se perdent");
    expect(step("moonWatch")).toContain("au niveau 4,");
    expect(PAGE_TIPS["/game/joueurs"]).toContain("protégés 96 h");
    expect(expeditionRelicChanceText()).toBe("jusqu'à 20 % à 11 h");
    expect(CAPSULES.armor.description(5)).toContain("(8 h)");
    expect(COMMANDER_SOURCES.admiral[0].xp).toBe(25);
  });

  it("refuse une force de mutateur hors bornes ou mal formée", () => {
    expect(validateMutatorRules({ values: { ruee: [0.1] } })).toEqual([]);
    expect(validateMutatorRules({ values: { chantiers: [0.95] } })).toHaveLength(1);
    expect(validateMutatorRules({ values: { guerre: [0.1] } })).toHaveLength(1);
    expect(validateMutatorRules({ values: { inconnu: [0.1] } })).toHaveLength(1);
    expect(validateMutatorRules({ values: { soutes: [-0.1] } })).toHaveLength(1);
  });

  it("garde : les chiffres de règle retirés ne reviennent pas en dur", () => {
    const read = (f: string) => readFileSync(resolve(__dirname, "../..", f), "utf8");
    const forbidden: [string, RegExp][] = [
      ["src/game/referral.ts", /"Le parrainage se déclare dans les 48 h/],
      ["src/game/dailyOrders.ts", /"8 h"|4 contrats|toutes les 8 h|Jusqu'à 3 par jour|jusqu'à 10 h/],
      ["src/game/allianceCalendar.ts", /"24 h pour l'abattre"/],
      ["src/components/game/AllianceBossTab.tsx", /<b>24 h<\/b>/],
      ["pocketbase/pb_hooks/cosmic_db.js", /: 24 h pour l'abattre|un assaut toutes les 4 h|\[0, 10, 30, 70, 150\]/],
      ["src/game/bounties.ts", /production \+20 %|pendant 6 h\.|"Atelier : 2 h|pendant 24 h\.|\+50 % d'attaque/],
      ["src/game/mutators.ts", /description: "/],
      ["src/game/advancedGuide.ts", /learn: "[^"]*[0-9]+ ?%/],
      ["src/game/synthesis.ts", /\(12 h\)/],
      ["src/components/game/ReferralCard.tsx", /\(48 h après|>Bronze I<|à Bronze I"/],
      ["src/pages/BountiesPage.tsx", /\+50 % PNJ|\/5\)/],
      ["src/pages/CommandPage.tsx", /\(40 Ambre\)|15 % à 8 h|un 4e à/],
      ["src/pages/CasinoPage.tsx", /: 12 h de production à la place/],
      ["src/pages/GazettePage.tsx", /"Chaque lundi à 9 h/],
    ];
    const hits = forbidden.filter(([f, re]) => re.test(read(f))).map(([f, re]) => `${f} : ${re}`);
    expect(hits).toEqual([]);
  });
});
