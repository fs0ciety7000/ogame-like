import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { applyGameContent, currentGameContent, defaultGameContent, validateGameContent, validateRules } from "@/game/content";
import { generateChapter, seededRandom, worldDigest } from "@/game/procedural";
import { applyLibraryChapter, archiveOldMonths, bossEmblems, librarySeason, librarySeasonWarning, mergeChronicleArchive, monthSeason, setChronicles, type ChronicleMonth, type ChroniclesConfig } from "@/game/chronicles";
import { CHRONICLE_GEN_RULES, chronicleGenRules } from "@/game/chronicleGen";
import { generateBudgetTiers, PASS_GEN_RULES, passGenRules, spreadRemainder, tiersValue } from "@/game/passGen";
import { DEFAULT_WORLD_BOSSES, worldBossOfWeek } from "@/game/worldBosses";
import { dailyRandom } from "@/game/contracts";
import type { PassReward } from "@/game/seasonPass";

/* 6.14.149 (AU27, AP-L13 ; constats AP-12, AP-13, AP-15, AP-16) : hygiène des générateurs. */

const NOW = Date.UTC(2026, 9, 20, 12);
const digest = worldDigest([], NOW);

afterEach(() => {
  applyGameContent({});
});

const shift = (id: string, d: number) => {
  const [y, m] = id.split("-").map(Number);
  const k = y * 12 + (m - 1) + d;
  return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`;
};

describe("AP-12 : month.pass plus écrit dès le catalogue, mois anciens allégés", () => {
  it("chapitre de novembre 2026 et après : pas de passe du mois ; octobre 2026 : passe gardé ; le reste du chapitre ne change pas", () => {
    const oct = generateChapter({ monthId: "2026-10", digest, existing: [], now: NOW });
    expect(oct.pass?.tiers.length).toBe(30);
    for (const id of ["2026-11", "2027-06", "2030-01"]) expect(generateChapter({ monthId: id, digest, existing: [], now: NOW }).pass).toBeUndefined();
    // Le passe était le dernier tirage : titre, boss et épisodes identiques avec ou sans lui.
    const withPass = generateChapter({ monthId: "2026-12", digest, existing: [], now: NOW, settings: { pass: true } });
    const without = generateChapter({ monthId: "2026-12", digest, existing: [], now: NOW, settings: { pass: false } });
    expect(withPass).toEqual(without);
  });

  it("allègement après 12 mois : scénario et raisons retirés, épisodes, boss, sceau, bannière et Codex gardés ; copie entière archivée", () => {
    const months: ChronicleMonth[] = [];
    for (let i = 0; i < 18; i++) months.push(generateChapter({ monthId: shift("2025-05", i), digest, existing: [...months], now: NOW }));
    const cfg: ChroniclesConfig = { ...defaultGameContent().chronicles, months };
    const res = archiveOldMonths(cfg, NOW, 12)!;
    // Octobre 2026 : seuls les mois avant octobre 2025 sont allégés.
    expect(res.archived.map((m) => m.id)).toEqual(["2025-05", "2025-06", "2025-07", "2025-08", "2025-09"]);
    for (const m of res.cfg.months) {
      const src = months.find((x) => x.id === m.id)!;
      if (m.id < "2025-10") {
        expect(m.archivedAtMs).toBe(NOW);
        expect(m.synopsis).toBeUndefined();
        expect(m.auto?.reasons).toEqual([]);
        // Avant le catalogue, le passe du chapitre reste (activePass le lit encore).
        expect(m.pass).toEqual(src.pass);
        expect(m.episodes).toEqual(src.episodes);
        expect(m.boss).toEqual(src.boss);
        expect(m.completion).toEqual(src.completion);
        expect(m.codex).toEqual(src.codex);
        expect(m.title).toBe(src.title);
      } else expect(m).toEqual(src);
    }
    expect(res.archived).toEqual(months.filter((m) => m.id < "2025-10"));
    expect(JSON.stringify(res.cfg.months).length).toBeLessThan(JSON.stringify(months).length);
    // Contenu toujours valide, sceaux toujours là.
    expect(validateGameContent({ ...currentGameContent(), chronicles: res.cfg }).filter((e) => /^Chroniques/.test(e))).toEqual([]);
    setChronicles(res.cfg);
    expect(bossEmblems({ chronicle: { emblems: ["2025-05"] } as never }).find((b) => b.id === "boss:2025-05")?.unlocked).toBe(true);
    // Deuxième passage : rien de plus ; réglage à 0 : jamais.
    expect(archiveOldMonths(res.cfg, NOW, 12)).toBeNull();
    expect(archiveOldMonths(cfg, NOW, 0)).toBeNull();
    // Archive sans doublon, triée.
    const merged = mergeChronicleArchive(mergeChronicleArchive(null, res.archived), res.archived.slice(0, 2));
    expect(merged.months.map((m) => m.id)).toEqual(res.archived.map((m) => m.id));
  });

  it("passe d'un mois du catalogue retiré à l'allègement (plus lu depuis I17)", () => {
    const m = { ...generateChapter({ monthId: "2026-10", digest, existing: [], now: NOW }), id: "2026-11" };
    const res = archiveOldMonths({ months: [m] }, Date.UTC(2028, 0, 15), 12)!;
    expect(res.cfg.months[0].pass).toBeUndefined();
    expect(res.archived[0].pass).toBeTruthy();
  });

  it("serveur : archive hors du contenu relu à chaque requête et hors du téléchargement du jeu", () => {
    const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
    expect(db).toMatch(/findRecordsByFilter\("game_config", "key != 'chronicles_archive'"/);
    expect(readFileSync("src/services/contentService.ts", "utf8")).toMatch(/key != "\$\{CHRONICLES_ARCHIVE_KEY\}"/);
    expect(currentGameContent()).not.toHaveProperty("chronicles_archive");
  });

  it("réglage dans les règles : bornes vérifiées", () => {
    expect(chronicleGenRules().archiveAfterMonths).toBe(12);
    const rules = currentGameContent().rules;
    expect(validateRules({ ...rules, chronicleGen: { ...CHRONICLE_GEN_RULES, archiveAfterMonths: 2 } }).join()).toMatch(/archivage/);
    expect(validateRules({ ...rules, chronicleGen: { ...CHRONICLE_GEN_RULES, archiveAfterMonths: 0 } }).filter((e) => /archivage/.test(e))).toEqual([]);
  });
});

describe("AP-13 : rotation des boss par identifiant, tirage du jour renommé", () => {
  const before = (week: number, ids: string[]) => ids[((week % ids.length) + ids.length) % ids.length];

  it("catalogue entièrement activé : calendrier identique à l'ancien", () => {
    const ids = DEFAULT_WORLD_BOSSES.map((b) => b.id);
    for (let w = -10; w < 200; w++) expect(worldBossOfWeek(w).id).toBe(before(w, ids));
  });

  it("boss désactivé : seules ses semaines changent, jamais deux fois le même boss de suite", () => {
    applyGameContent({ worldBosses: [{ id: "titan", enabled: false } as never] });
    const ids = DEFAULT_WORLD_BOSSES.map((b) => b.id);
    let changed = 0;
    for (let w = 0; w < 120; w++) {
      const id = worldBossOfWeek(w).id;
      expect(id).not.toBe("titan");
      if (before(w, ids) !== "titan") expect(id).toBe(before(w, ids));
      else changed++;
      expect(worldBossOfWeek(w + 1).id).not.toBe(id);
    }
    expect(changed).toBe(20);
    // Deux boss voisins désactivés : toujours un boss activé.
    applyGameContent({ worldBosses: [{ id: "titan", enabled: false } as never, { id: "spectre", enabled: false } as never] });
    for (let w = 0; w < 60; w++) expect(["titan", "spectre"]).not.toContain(worldBossOfWeek(w).id);
  });

  it("dailyRandom (ex-contracts.seededRandom) : même algorithme, mêmes tirages", () => {
    const old = (seed: string) => {
      let h = 2166136261;
      for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
      return () => {
        h = Math.imul(h ^ (h >>> 15), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
      };
    };
    for (const seed of ["u1:2026-10-08", "x:bounty:2", ""]) {
      const a = dailyRandom(seed);
      const b = old(seed);
      for (let i = 0; i < 20; i++) expect(a()).toBe(b());
    }
    // Plus aucun export `seededRandom` dans contracts.ts : un seul nom par algorithme.
    expect(readFileSync("src/game/contracts.ts", "utf8")).not.toMatch(/export function seededRandom/);
  });
});

describe("AP-16 : reste du budget du passe réparti ; trois transactions", () => {
  it("aucune récompense de production au-dessus du plafond sur 1 000 tirages ; budget tenu", () => {
    const r = passGenRules();
    for (let i = 0; i < 1000; i++) {
      const { tiers } = generateBudgetTiers(seededRandom(`ap16:${i}`), 30);
      for (const t of tiers) for (const x of t) if (x.kind === "production") expect(x.hours).toBeLessThanOrEqual(r.productionMaxHours);
      expect(tiersValue(tiers)).toBeLessThanOrEqual(r.budgetHours * 1.05);
    }
  });

  it("reste réparti sur les 3 derniers paliers ordinaires (hors jalons), plafonné", () => {
    const out: PassReward[][] = Array.from({ length: 29 }, () => [{ kind: "production", hours: 10 } as PassReward]);
    spreadRemainder(out, 9, PASS_GEN_RULES);
    // Paliers 29, 28, 27 (ordinaires) : +2 chacun au plus (plafond 12), puis le reste sur les mêmes jusqu'au plafond.
    const hours = (t: number) => (out[t - 1][0] as Extract<PassReward, { kind: "production" }>).hours;
    expect([hours(27), hours(28), hours(29)]).toEqual([12, 12, 12]);
    expect(hours(26)).toBe(10);
    expect(hours(25)).toBe(10);
    // Ancien comportement : tout sur le palier 29 (19 h).
    const small: PassReward[][] = Array.from({ length: 29 }, () => [{ kind: "amber", amount: 50 } as PassReward]);
    spreadRemainder(small, 7, PASS_GEN_RULES);
    expect(small.slice(26).map((t) => t.find((x) => x.kind === "production"))).toEqual([
      { kind: "production", hours: 2 },
      { kind: "production", hours: 2 },
      { kind: "production", hours: 3 },
    ]);
    expect(small[24].length).toBe(1);
  });

  it("réglage remainderTiers borné", () => {
    const rules = currentGameContent().rules;
    expect(validateRules({ ...rules, passGen: { ...PASS_GEN_RULES, remainderTiers: 0 } }).join()).toMatch(/reste du budget/);
  });

  it("proceduralTick : chapitre, succès et passe dans trois transactions, reste de la configuration gardé", () => {
    const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
    const body = db.slice(db.indexOf("function proceduralTick("), db.indexOf("function archiveOldChronicles("));
    expect(body.match(/step\("(Chapitres|Succès|Passes)"/g)).toEqual(['step("Chapitres"', 'step("Succès"', 'step("Passes"']);
    expect(body.match(/\$app\.runInTransaction/g)?.length).toBe(2);
    expect(body).toMatch(/writeConfig\(txApp, "chronicles", Object\.assign\(\{\}, content\.chronicles, \{ months \}\)\)/);
    const archive = db.slice(db.indexOf("function archiveOldChronicles("), db.indexOf("/** v5.13 : passes de saison procéduraux"));
    expect(archive).toMatch(/Object\.assign\(\{\}, content\.chronicles, \{ months: res\.cfg\.months \}\)/);
  });
});

describe("AP-15 : bibliothèque (saison, rebudget, titres comptés)", () => {
  it("saison de chaque chapitre et avertissement hors saison", () => {
    expect(monthSeason("2026-12")).toBe("hiver");
    expect(monthSeason("2027-03")).toBe("printemps");
    expect(monthSeason("2027-07")).toBe("ete");
    expect(monthSeason("2026-11")).toBe("automne");
    const lib = defaultGameContent().chronicles.library!;
    expect(lib.every((m) => librarySeason(m) !== null)).toBe(true);
    const winter = lib.find((m) => m.id === "2026-12")!;
    expect(librarySeasonWarning(winter, "2027-01")).toBeNull();
    expect(librarySeasonWarning(winter, "2027-07")).toMatch(/l'hiver.*en été/);
  });

  it("récompenses rebudgétées à l'application (même résultat partout), écrites si le réglage est coupé", () => {
    const cfg = defaultGameContent().chronicles;
    const src = cfg.library!.find((m) => m.id === "2026-12")!;
    const a = applyLibraryChapter(cfg, src.id, "2027-12").months.find((m) => m.id === "2027-12")!;
    const b = applyLibraryChapter(cfg, src.id, "2027-12").months.find((m) => m.id === "2027-12")!;
    expect(a).toEqual(b);
    expect(a.auto).toBeUndefined();
    expect(a.title).toBe(src.title);
    expect(a.episodes.map((e) => e.lines)).toEqual(src.episodes.map((e) => e.lines));
    const gen = chronicleGenRules();
    const value = tiersValue(a.episodes.map((e) => e.reward ?? []));
    expect(value).toBeLessThanOrEqual(gen.episodeBudgetHours * 1.05);
    expect(value).toBeGreaterThan(0);
    // Chapitre écrit sans fin de chapitre : rien d'ajouté ; avec une fin : récompenses du gabarit généré (difficulté 1).
    expect(a.completion).toEqual(src.completion);
    const withEnd = { ...cfg, library: [{ ...src, completion: { title: "Fin", banner: "x", rewards: [{ kind: "amber", amount: 500 } as PassReward] } }] };
    expect(applyLibraryChapter(withEnd, src.id, "2027-12").months.find((m) => m.id === "2027-12")!.completion?.rewards).toEqual([{ kind: "relic", rarity: "rare" }, { kind: "amber", amount: gen.completionAmber }]);
    // La bibliothèque garde le chapitre (réutilisable).
    expect(applyLibraryChapter(cfg, src.id, "2027-12").library).toEqual(cfg.library);
    applyGameContent({ rules: { ...currentGameContent().rules, chronicleGen: { ...CHRONICLE_GEN_RULES, libraryRebudget: false } } });
    const kept = applyLibraryChapter(cfg, src.id, "2027-12").months.find((m) => m.id === "2027-12")!;
    expect(kept.episodes.map((e) => e.reward)).toEqual(src.episodes.map((e) => e.reward));
    expect(kept.completion).toEqual(src.completion);
  });

  it("titres de la bibliothèque comptés comme déjà pris par le générateur", () => {
    const free = generateChapter({ monthId: "2027-05", digest, existing: [], library: [], now: NOW });
    const taken = { ...free, id: "lib-x", auto: undefined } as ChronicleMonth;
    const next = generateChapter({ monthId: "2027-05", digest, existing: [], library: [taken], now: NOW });
    expect(next.title).not.toBe(free.title);
    expect(next.boss.name).not.toBe(free.boss.name);
    // Sans option : la bibliothèque en vigueur.
    expect(generateChapter({ monthId: "2027-05", digest, existing: [], now: NOW }).title).toBe(generateChapter({ monthId: "2027-05", digest, existing: [], library: currentGameContent().chronicles.library, now: NOW }).title);
  });
});
