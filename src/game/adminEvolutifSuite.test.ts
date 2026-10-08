import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, contentSectionErrors, defaultGameContent, validateGameContent, validateRules } from "@/game/content";
import { getTechTime, RESEARCH_RULES, TECHNOLOGIES, techTimeGrowth, type TechDef } from "@/game/technologies";
import { ALLIANCE_CHALLENGES, allianceChallengeRotation, challengeOfWeek, DEFAULT_ALLIANCE_CHALLENGES, findAllianceChallenge, type AllianceChallengeDef } from "@/game/allianceChallenge";
import { DAILY_POOL, dailyTasksFor, DEFAULT_DAILY_POOL } from "@/game/dailyMissions";
import { ARCHETYPES, chapterArchetypes, DEFAULT_ARCHETYPES, generateChapter, worldDigest, type Archetype } from "@/game/procedural";
import { DEFAULT_WARLORD_ORIGINS, validateWarlords, warlordOrigins, warlordPublic, warlordsConfig } from "@/game/warlords";
import { BALANCE_EXCLUSION_RULES, countsForBalance } from "@/game/staff";
import { formatRatio, previewChanges, valueDelta } from "@/game/adminPreview";

/* 6.14.154 (AU27, lot R6, constats AA-12, AA-20, AA-23, AA-28, AA-31) : reste de l'évolutivité de l'admin.
   À contenu par défaut, rien ne change : la comparaison complète (durées et coûts de chaque niveau de chaque techno,
   120 semaines de défis d'alliance, 90 jours de missions du jour, archétypes, 36 chapitres et 36 sagas générés, fiches
   publiques des seigneurs, comptes écartés de l'équilibrage) a été faite sur l'arbre d'avant et d'après : 0 différence.
   Ce fichier fige les points clés et vérifie que chaque nouveau réglage agit. */

const NOW = Date.UTC(2026, 9, 7, 12);
const STATE = { byId: {}, hits: {}, contacted: {}, lastMsg: {}, vendettas: [] } as never;

afterEach(() => {
  applyGameContent({});
});

describe("R6 : à contenu par défaut, rien ne change", () => {
  it("défis, missions du jour, archétypes, origines, exclusions : valeurs d'avant", () => {
    applyGameContent({}, NOW);
    const weeks = Array.from({ length: 8 }, (_, i) => new Date(Date.UTC(2026, 9, 5) + i * 7 * 86400_000).toISOString().slice(0, 10));
    expect(weeks.map((w) => challengeOfWeek(w).id)).toEqual(["pillards", "explorateurs", "arsenal", "ferrailleurs", "conquerants", "negociants", "vigies", "pillards"]);
    expect(findAllianceChallenge("inconnu").id).toBe("pillards");
    expect(ALLIANCE_CHALLENGES.map((c) => c.metric)).toEqual(["loot", "missions", "unitsBuilt", "recycled", "victories", "contracts", "vigil"]);
    expect(["2026-10-01", "2026-10-02", "2026-10-03"].map((d) => dailyTasksFor(d, 3).map((t) => t.key))).toEqual([
      ["contract", "market", "spy"],
      ["spy", "mission", "victory"],
      ["mission", "contract", "spy"],
    ]);
    expect(dailyTasksFor("2026-10-01")).toEqual([]);
    expect(chapterArchetypes()).toBe(ARCHETYPES);
    expect(ARCHETYPES.map((a) => a.id)).toEqual(["confrerie", "cartel", "choeur", "gravhorn", "culte", "inquisition", "meute"]);
    const digest = worldDigest([], NOW);
    expect(["2027-01", "2027-02", "2027-03", "2027-04"].map((m) => generateChapter({ monthId: m, digest, existing: [], now: NOW }).auto?.archetype)).toEqual(["gravhorn", "cartel", "confrerie", "meute"]);
    const pub = warlordPublic(warlordsConfig().defs[0], null, undefined, STATE, NOW);
    expect([pub.origin, pub.originLabel, pub.color, pub.fallbackArt]).toEqual(["kesh", "Kesh'Vaar renégats", "#ffb347", "/assets/bounties/hunters.webp"]);
    expect(warlordOrigins().map((o) => o.id)).toEqual(["kesh", "choeur", "confrerie", "gravhorn", "leviathan"]);
    // Ancienne formule du serveur : pas de l'équipe, pas en test, pas un des trois pseudos (casse exacte).
    for (const pseudo of ["Tartiflex", "Nicotine", "Tomdindon", "Autre", "tartiflex"])
      for (const testMode of [false, true])
        for (const uid of ["a", "b"]) expect(countsForBalance({ uid, pseudo, testMode }, { a: true }), `${uid} ${pseudo} ${testMode}`).toBe(uid !== "a" && !testMode && !["Tartiflex", "Nicotine", "Tomdindon"].includes(pseudo));
    // Les listes par défaut passent leur propre validation.
    expect(validateGameContent(defaultGameContent())).toEqual([]);
  });
});

describe("AA-12 : croissance de la durée par techno", () => {
  it("absente : le réglage commun ; présente : la sienne ; bornée", () => {
    const t = TECHNOLOGIES.find((x) => x.maxLevel >= 5 && x.timeGrowth === undefined)!;
    expect(techTimeGrowth(t)).toBe(RESEARCH_RULES.timeGrowth);
    expect(getTechTime(t, 4)).toBe(Math.floor(t.baseTime * Math.pow(1.67, 3)));
    const own: TechDef = { ...t, timeGrowth: 2 };
    expect(getTechTime(own, 4)).toBe(Math.floor(t.baseTime * 8));
    // Le réglage commun ne touche pas une techno qui a la sienne.
    applyGameContent({ rules: { research: { timeGrowth: 3 } } as never, technologies: defaultGameContent().technologies.map((x) => (x.id === t.id ? own : x)) });
    expect(getTechTime(TECHNOLOGIES.find((x) => x.id === t.id)!, 4)).toBe(Math.floor(t.baseTime * 8));
    expect(getTechTime(TECHNOLOGIES.find((x) => x.id !== t.id && x.timeGrowth === undefined)!, 2)).toBe(Math.floor(TECHNOLOGIES.find((x) => x.id !== t.id && x.timeGrowth === undefined)!.baseTime * 3));
    const bad = defaultGameContent();
    bad.technologies[0] = { ...bad.technologies[0], timeGrowth: 0.5 };
    expect(validateGameContent(bad).join(" ")).toMatch(/croissance de la durée entre 1 et 5/);
    expect(contentSectionErrors("technologies", bad.technologies, {}).join(" ")).toMatch(/croissance de la durée/);
  });
});

describe("AA-23 : défis d'alliance, missions du jour et archétypes en sections", () => {
  const traders: AllianceChallengeDef = { id: "marchands", name: "Les marchands", emoji: "🪙", metric: "contracts", hint: "Contrats des membres." };

  it("défi ajouté dans la rotation, défi retiré hors rotation mais retrouvé par son identifiant", () => {
    applyGameContent({ allianceChallenges: [...structuredClone(DEFAULT_ALLIANCE_CHALLENGES), traders] });
    expect(allianceChallengeRotation()).toHaveLength(8);
    const weeks = Array.from({ length: 8 }, (_, i) => new Date(Date.UTC(2026, 9, 5) + i * 7 * 86400_000).toISOString().slice(0, 10));
    expect(weeks.map((w) => challengeOfWeek(w).id)).toContain("marchands");
    applyGameContent({ allianceChallenges: structuredClone(DEFAULT_ALLIANCE_CHALLENGES).map((c) => (c.id === "pillards" ? { ...c, retired: true } : c)) });
    expect(allianceChallengeRotation().map((c) => c.id)).not.toContain("pillards");
    expect(findAllianceChallenge("pillards").name).toBe("Les pillards");
  });

  it("un défi livré absent revient, retiré (la rotation ne bouge pas) ; la garde refuse la suppression d'un défi enregistré", () => {
    applyGameContent({ allianceChallenges: structuredClone(DEFAULT_ALLIANCE_CHALLENGES).filter((c) => c.id !== "vigies") });
    expect(ALLIANCE_CHALLENGES.find((c) => c.id === "vigies")).toMatchObject({ retired: true });
    expect(allianceChallengeRotation()).toHaveLength(6);
    const stored = { allianceChallenges: [...structuredClone(DEFAULT_ALLIANCE_CHALLENGES), traders] };
    expect(contentSectionErrors("allianceChallenges", structuredClone(DEFAULT_ALLIANCE_CHALLENGES), stored).join(" ")).toMatch(/marchands/);
    expect(contentSectionErrors("allianceChallenges", [...structuredClone(DEFAULT_ALLIANCE_CHALLENGES), { ...traders, retired: true }], stored)).toEqual([]);
    const errs = contentSectionErrors("allianceChallenges", [...structuredClone(DEFAULT_ALLIANCE_CHALLENGES), { ...traders, metric: "nope" }], {}).join(" ");
    expect(errs).toMatch(/mesure « nope » inconnue/);
  });

  it("réserve des missions du jour : liste réglée tirée, validation", () => {
    applyGameContent({ dailyMissionPool: [{ id: "spy" as never, count: 5 }, { id: "market" as never, count: 3 }] });
    expect(DAILY_POOL).toHaveLength(2);
    expect(dailyTasksFor("2026-10-01", 3).map((t) => [t.key, t.count]).sort()).toEqual([["market", 3], ["spy", 5]]);
    const errs = validateGameContent({ ...defaultGameContent(), dailyMissionPool: [{ id: "nope" as never, count: 1 }, { id: "spy" as never, count: 0 }, { id: "spy" as never, count: 2 }] }).join(" ");
    expect(errs).toMatch(/« nope » : action inconnue/);
    expect(errs).toMatch(/quantité entière entre 1 et 50/);
    expect(errs).toMatch(/« spy » en double/);
    expect(validateGameContent({ ...defaultGameContent(), dailyMissionPool: [] }).join(" ")).toMatch(/au moins une tâche/);
    expect(DEFAULT_DAILY_POOL.map((e) => e.id)).toEqual(["mission", "spy", "victory", "contract", "market"]);
  });

  it("archétype ajouté tiré par les chapitres ; retiré hors tirage ; validation", () => {
    const ordre: Archetype = { ...structuredClone(DEFAULT_ARCHETYPES[0]), id: "ordre", factionId: undefined, faction: "l'Ordre du Néant", bossNames: ["Le Néant-Roi"] };
    delete ordre.factionId;
    applyGameContent({ chronicleArchetypes: [...structuredClone(DEFAULT_ARCHETYPES), ordre], rules: { chronicleGen: { followPassTheme: false } } } as never);
    expect(chapterArchetypes().map((a) => a.id)).toContain("ordre");
    const digest = worldDigest([], NOW);
    const months = Array.from({ length: 48 }, (_, i) => `${2027 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`);
    expect(months.some((m) => generateChapter({ monthId: m, digest, existing: [], now: NOW }).auto?.archetype === "ordre")).toBe(true);
    applyGameContent({ chronicleArchetypes: structuredClone(DEFAULT_ARCHETYPES).map((a) => (a.id === "meute" ? { ...a, retired: true } : a)), rules: { chronicleGen: { followPassTheme: false } } } as never);
    expect(chapterArchetypes().map((a) => a.id)).not.toContain("meute");
    expect(months.some((m) => generateChapter({ monthId: m, digest, existing: [], now: NOW }).auto?.archetype === "meute")).toBe(false);
    const errs = validateGameContent({ ...defaultGameContent(), chronicleArchetypes: [{ ...ordre, accent: "rouge", ally: "nope" as never, bossNames: [] }] }).join(" ");
    expect(errs).toMatch(/couleur « rouge » invalide/);
    expect(errs).toMatch(/allié « nope » inconnu/);
    expect(errs).toMatch(/« bossNames » : au moins une ligne/);
    expect(validateGameContent({ ...defaultGameContent(), chronicleArchetypes: DEFAULT_ARCHETYPES.map((a) => ({ ...a, retired: true })) }).join(" ")).toMatch(/au moins un archétype tiré/);
    // Un seul archétype tiré, déjà pris les deux mois d'avant : le tirage retombe sur la liste entière (plantait la route).
    applyGameContent({ chronicleArchetypes: [...structuredClone(DEFAULT_ARCHETYPES).map((a) => ({ ...a, retired: true })), ordre] });
    const prev = generateChapter({ monthId: "2027-11", digest, existing: [], now: NOW });
    expect(prev.auto?.archetype).toBe("ordre");
    expect(generateChapter({ monthId: "2027-12", digest, existing: [prev], now: NOW }).auto?.archetype).toBe("ordre");
  });
});

describe("AA-20 : origine d'un seigneur réglable", () => {
  it("origine ajoutée portée par un seigneur ; origine livrée renommée ; origine inconnue refusée", () => {
    const cfg = structuredClone(defaultGameContent().warlords);
    cfg.origins = [{ id: "nebula", label: "Pirates de la Nébuleuse", art: "/assets/story/nebula.webp", emblem: "/assets/story/nebula-sceau.webp", color: "#7fd1ff" }, { ...DEFAULT_WARLORD_ORIGINS[1], label: "Transfuges du Chœur" }];
    cfg.defs[0] = { ...cfg.defs[0], origin: "nebula" };
    expect(validateWarlords(cfg)).toEqual([]);
    applyGameContent({ warlords: cfg });
    expect(warlordOrigins().map((o) => o.id)).toEqual(["kesh", "choeur", "confrerie", "gravhorn", "leviathan", "nebula"]);
    const pub = warlordPublic(warlordsConfig().defs[0], null, undefined, STATE, NOW);
    expect([pub.originLabel, pub.color, pub.fallbackArt]).toEqual(["Pirates de la Nébuleuse", "#7fd1ff", "/assets/story/nebula.webp"]);
    expect(warlordOrigins().find((o) => o.id === "choeur")?.label).toBe("Transfuges du Chœur");
    const bad = structuredClone(cfg);
    bad.defs[1] = { ...bad.defs[1], origin: "inconnue" };
    bad.origins = [...(bad.origins ?? []), { id: "x y", label: "", art: "img", emblem: "/e", color: "bleu" }];
    const errs = validateWarlords(bad).join(" ");
    expect(errs).toMatch(/origine « inconnue » inconnue/);
    expect(errs).toMatch(/identifiant invalide/);
    expect(errs).toMatch(/couleur « bleu » invalide/);
    expect(contentSectionErrors("warlords", bad, {}).join(" ")).toMatch(/origine « inconnue » inconnue/);
  });
});

describe("AA-31 : exclusion des statistiques d'équilibre réglable", () => {
  it("pseudos, équipe et comptes de test réglables dans les règles", () => {
    applyGameContent({ rules: { balanceExclusion: { pseudos: ["Essai"], excludeStaff: false } } as never });
    expect(BALANCE_EXCLUSION_RULES.excludeTestMode).toBe(true);
    expect(countsForBalance({ uid: "a", pseudo: "Tartiflex" }, { a: true })).toBe(true);
    expect(countsForBalance({ uid: "b", pseudo: "Essai" }, {})).toBe(false);
    expect(countsForBalance({ uid: "b", pseudo: "Autre", testMode: true }, {})).toBe(false);
    expect(validateRules({ balanceExclusion: { pseudos: ["A", "A", ""] } } as never).join(" ")).toMatch(/pseudos non vides/);
  });
});

describe("AA-28 : aperçu avant / après", () => {
  it("écart, ordre de grandeur et alerte au-delà de ×2", () => {
    expect(valueDelta(100, 150)).toMatchObject({ ratio: 1.5, alert: false });
    expect(valueDelta(100, 250)).toMatchObject({ ratio: 2.5, alert: true });
    expect(valueDelta(100, 40).alert).toBe(true);
    expect(valueDelta(0, 10)).toMatchObject({ ratio: null, alert: true });
    expect([formatRatio(1.5), formatRatio(0.25), formatRatio(1), formatRatio(null)]).toEqual(["×1,5", "÷4", "=", "nouveau"]);
  });

  it("changements des règles : libellé du registre, avant, après, écart", () => {
    const saved = defaultGameContent().rules;
    const draft = structuredClone(saved);
    (draft.research as { timeGrowth: number }).timeGrowth = 3.5;
    const lines = previewChanges(saved, draft);
    expect(lines).toEqual([{ path: "research.timeGrowth", label: "Croissance de la durée par niveau", before: "1,67", after: "3,5", ratio: 3.5 / 1.67, alert: true }]);
    expect(previewChanges(saved, saved)).toEqual([]);
  });
});
