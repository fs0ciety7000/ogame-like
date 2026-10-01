import { describe, expect, it } from "vitest";
import { addReportComment, applyStaffUpdate, assertReportQuota, githubIssueBody, REPORT_RULES, sanitizeNewReport, unreadStaffReplies, type GameReport } from "@/game/reports";

const NOW = 1_800_000_000_000;

describe("signalements (v2.7)", () => {
  it("valide et nettoie un nouveau signalement", () => {
    const r = sanitizeNewReport({ category: "nope", title: "  Menu bloqué  ", description: "Le menu ne se ferme plus.", context: { page: "/game", userAgent: "x".repeat(900) } });
    expect(r.category).toBe("other");
    expect(r.title).toBe("Menu bloqué");
    expect(r.context.userAgent).toHaveLength(300);
    expect(() => sanitizeNewReport({ title: "", description: "assez long pour passer" })).toThrow(/titre/);
    expect(() => sanitizeNewReport({ title: "Ok", description: "court" })).toThrow(/Décris/);
  });

  it("limite le nombre de signalements par jour", () => {
    const today = Array.from({ length: REPORT_RULES.maxPerDay }, (_, i) => NOW - i * 3600_000);
    expect(() => assertReportQuota(today, NOW)).toThrow(/aujourd'hui/);
    expect(() => assertReportQuota(today.map((t) => t - 25 * 3600_000), NOW)).not.toThrow();
  });

  it("mise à jour de l'équipe : statut, résolution, réponse, et ce qu'on notifie", () => {
    const base = { status: "new" as const, resolution: "", history: [] };
    const out = applyStaffUpdate(base, { id: "a", name: "Nicotine" }, { status: "in_progress", comment: "On regarde !" }, NOW);
    expect(out.status).toBe("in_progress");
    expect(out.history.map((h) => h.kind)).toEqual(["status", "comment"]);
    expect(out.notify).toBe("statut : En cours, nouvelle réponse");
    expect(applyStaffUpdate({ ...base, status: "in_progress" }, { id: "a", name: "N" }, { status: "in_progress" }, NOW).changed).toBe(false);
    expect(() => applyStaffUpdate(base, { id: "a", name: "N" }, { status: "bof" }, NOW)).toThrow(/Statut/);
  });

  it("compte les réponses non lues et prépare l'issue GitHub", () => {
    const history = addReportComment([], { id: "a", name: "Nico", staff: true }, "Corrigé en 2.7", NOW);
    expect(unreadStaffReplies({ history, reporterSeenAtMs: NOW - 1 })).toBe(1);
    expect(unreadStaffReplies({ history, reporterSeenAtMs: NOW })).toBe(0);
    expect(() => addReportComment([], { id: "b", name: "J", staff: false }, "   ", NOW)).toThrow(/vide/);
    const report = { id: "r1", reporterPseudo: "Joueur", category: "bug", title: "T", description: "Desc", context: { version: "2.6.1", page: "/game" }, screenshot: "" } as unknown as GameReport;
    const body = githubIssueBody(report, "https://x/admin");
    expect(body).toContain("Joueur");
    expect(body).toContain("| Version | 2.6.1 |");
  });
});
