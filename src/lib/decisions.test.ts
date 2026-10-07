import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { additionQid, decisionDocs, isAdditionQid, isHandled, lotDone, parseAdvice, parseChangeIndex, parsePlan, parseQuestions, parseRoadmap, plainText, roadmapOrder, roadmapQid, splitRoadmaps } from "@/lib/decisions";

/* 6.14.32 : la page /decisions lit QUESTIONS.md et decisions-a-valider.md au build. */

describe("6.14.32 : décisions à valider", () => {
  it("lit chaque question de QUESTIONS.md avec ses sept colonnes", () => {
    const qs = parseQuestions(readFileSync("docs/QUESTIONS.md", "utf8"));
    expect(qs.length).toBeGreaterThan(20);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
    for (const q of qs) {
      expect(q.question.length, q.id).toBeGreaterThan(5);
      expect(q.choice.length, q.id).toBeGreaterThan(2);
      expect(q.status.length, q.id).toBeGreaterThan(2);
    }
    expect(qs.find((q) => q.id === "Q3")?.open).toBe(false);
    // 6.14.45 : toutes les questions peuvent être traitées (aucune ouverte) ; le statut se lit quand même.
    expect(qs.find((q) => q.id === "Q12")?.status).toMatch(/^écartée/);
  });

  it("chaque question ouverte a son conseil dans decisions-a-valider.md", () => {
    const open = parseQuestions(readFileSync("docs/QUESTIONS.md", "utf8")).filter((q) => q.open);
    const advice = parseAdvice(readFileSync("docs/decisions-a-valider.md", "utf8"));
    expect(open.filter((q) => !advice[q.id]).map((q) => q.id)).toEqual([]);
  });

  it("groupes et conseils, markdown retiré", () => {
    const advice = parseAdvice("## 1. Bloquante\n\n| Q | D | E | R |\n|:--|:--|:--|:--|\n| Q12 | d | e | **Donner** le feu vert |\n\n## 4. Outillage (peu d'enjeu)\n\n| Q8 | d | valider |");
    expect(advice.Q12).toEqual({ group: "Bloquante", effect: "e", reco: "**Donner** le feu vert" });
    expect(advice.Q8).toEqual({ group: "Outillage", effect: "", reco: "valider" });
    expect(plainText("**Donner** le `feu`")).toBe("Donner le feu");
  });

  it("6.14.37 : liens vers les documents de chaque décision ouverte", () => {
    const changes = parseChangeIndex(readFileSync("docs/changes/README.md", "utf8"));
    expect(changes["6.14.32"]).toBe("docs/changes/6.14.32-page-decisions.md");
    for (const f of Object.values(changes)) expect(existsSync(f), f).toBe(true);
    const open = parseQuestions(readFileSync("docs/QUESTIONS.md", "utf8")).filter((q) => q.open);
    for (const q of open) {
      const docs = decisionDocs(q, changes);
      expect(docs.length, q.id).toBeGreaterThan(0);
      for (const d of docs) expect(existsSync(d), `${q.id} : ${d}`).toBe(true);
    }
  });

  it("6.14.41 : feuille de route en cours et plans lus depuis docs/proposals", () => {
    const files = readdirSync("docs/proposals").filter((f) => f.endsWith(".md"));
    const roadmaps = files.filter((f) => f.startsWith("feuille-de-route-")).map((f) => parseRoadmap(`docs/proposals/${f}`, readFileSync(`docs/proposals/${f}`, "utf8")));
    const { current, past } = splitRoadmaps(roadmaps);
    expect(current?.file).toBe("docs/proposals/feuille-de-route-2030-ete.md");
    expect(past.length).toBe(roadmaps.length - 1);
    expect(current!.lots.length).toBeGreaterThan(3);
    // Chaque lot a un identifiant de réponse distinct qui tient dans le champ `qid` (10 caractères).
    const qids = current!.lots.map((l) => roadmapQid(l.id));
    expect(new Set(qids).size).toBe(qids.length);
    for (const q of qids) expect(q.length).toBeLessThanOrEqual(10);
    for (const l of current!.lots) expect(l.state.length, l.id).toBeGreaterThan(2);
    for (const f of files.filter((x) => !x.startsWith("feuille-de-route-"))) expect(parsePlan(f, readFileSync(`docs/proposals/${f}`, "utf8")).title.length, f).toBeGreaterThan(3);
  });

  it("6.14.41 : ordre des saisons, actions ajoutées, réponses traitées", () => {
    expect(roadmapOrder("docs/proposals/feuille-de-route-2030-ete.md")).toBeGreaterThan(roadmapOrder("docs/proposals/feuille-de-route-2030-printemps.md"));
    expect(roadmapOrder("feuille-de-route-2029-hiver.md")).toBeLessThan(roadmapOrder("feuille-de-route-2030-printemps.md"));
    const q = additionQid(1791380000000);
    expect(q.length).toBeLessThanOrEqual(10);
    expect(isAdditionQid(q)).toBe(true);
    expect(isAdditionQid("Q12")).toBe(false);
    expect(isHandled(q, [`| 9 | É30-9 | action ${q} | S | à faire |`])).toBe(true);
    expect(lotDone("livré (6.14.39)")).toBe(true);
    expect(lotDone("à faire")).toBe(false);
  });
});
