import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/* 6.14.112 (AU27, AC-11, Q79) : une seule garde des vacances. Le moteur tient la liste blanche (`vacation.allowed`) et le
   message (`vacationBlock`) ; le serveur l'interroge dans chaque route qui rapporte ou dépense (`vacationGuard`). */

const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");

function topFunctions(src: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const part of src.split(/\n(?=function [A-Za-z0-9_]+\()/)) {
    const m = /^function ([A-Za-z0-9_]+)\(/.exec(part);
    if (m) out.set(m[1], part);
  }
  return out;
}
const fns = topFunctions(db);

/** Routes qui rapportent ou dépensent : elles passent par la garde commune. */
const GUARDED = ["phalanxScanRequest", "fleetJumpRequest", "bountyRequest", "casinoRequest", "piratesRequest", "renameRequest", "allianceRequest", "tradeContractRequest", "launchFleetRequest", "marketCreate", "marketAccept", "warlordsRequest", "auctionRequest"];

describe("garde de vacances unique (AC-11)", () => {
  it("chaque route qui rapporte ou dépense interroge la garde commune", () => {
    const missing = GUARDED.filter((name) => !/vacationGuard\(game, /.test(fns.get(name) ?? ""));
    expect(missing).toEqual([]);
  });

  it("6.14.113 : défi, Codex et jeton du casino passent par l'action (garde de l'action, même liste)", () => {
    for (const name of ["challengeClaim", "codexClaim", "casinoRequest"]) expect(fns.get(name), name).toContain("claimByAction(");
    expect(fns.get("claimByAction")).toContain("game.performPlayerAction(");
  });

  it("aucune route ne refuse les vacances avec son propre test (un seul message, une seule liste)", () => {
    const own: string[] = [];
    for (const [name, body] of fns) if (/game\.onVacation\([^)]*\)\) throw/.test(body)) own.push(name);
    expect(own).toEqual([]);
    expect(fns.get("vacationGuard")).toContain("game.vacationBlock(");
  });
});
