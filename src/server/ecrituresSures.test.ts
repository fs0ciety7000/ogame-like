import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/* 6.14.52 (AC-A, revue AU27) : écritures sûres de la fiche joueur dans les hooks.
   - AC-4 : un rattrapage sauvé (`loadFlushed`, `game.flushPlayer`) écrit ses notifications dans la même fonction ;
   - AC-1, AC-9 : aucune fiche lue hors transaction n'est réécrite (`$app.save` d'un joueur, `bumpPlayerStat($app, …)`) ;
   - AC-13 : un raid de faction a toujours une date de départ. */

const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
const pb = readFileSync("pocketbase/pb_hooks/cosmic.pb.js", "utf8");

/** Fonctions de premier niveau de cosmic_db.js : nom → corps. */
function topFunctions(src: string): Map<string, string> {
  const out = new Map<string, string>();
  const parts = src.split(/\n(?=function [A-Za-z0-9_]+\()/);
  for (const part of parts) {
    const m = /^function ([A-Za-z0-9_]+)\(/.exec(part);
    if (m) out.set(m[1], part);
  }
  return out;
}

const fns = topFunctions(db);

/** Rattrapages sans notification, justifiés. */
const FLUSH_WITHOUT_NOTIFY: Record<string, string> = {
  loadFlushed: "l'outil lui-même : l'appelant écrit les notifications",
  warlordTick: "seigneurs de guerre (PNJ) : notify les ignore de toute façon",
};

describe("écritures sûres de la fiche joueur (AC-A)", () => {
  it("le balayage trouve les fonctions du serveur", () => {
    expect(fns.size).toBeGreaterThan(300);
    for (const name of ["catchupTick", "renameRequest", "tradeContractRequest", "adminDeletePlayer", "queueCampaign", "sendCampaignMail", "mailQueueTick", "ensureMailTokens", "unsubscribe"]) {
      expect(fns.has(name), name).toBe(true);
    }
  });

  it("AC-4 : tout rattrapage sauvé écrit ses notifications dans la même fonction", () => {
    const missing: string[] = [];
    for (const [name, body] of fns) {
      if (FLUSH_WITHOUT_NOTIFY[name]) continue;
      if (!/loadFlushed\(|game\.flushPlayer\(/.test(body)) continue;
      if (!/notify\(/.test(body) || !/\.notifications\b/.test(body)) missing.push(name);
    }
    expect(missing).toEqual([]);
  });

  it("AC-4 : les quatre chemins corrigés notifient le rattrapage", () => {
    expect(fns.get("catchupTick")).toContain("notify(txApp, p.uid, flushed.notifications)");
    expect(fns.get("renameRequest")).toContain("notify(txApp, uid, me.notifications)");
    expect((fns.get("tradeContractRequest")!.match(/notify\(txApp, uid, me\.notifications\)/g) ?? []).length).toBe(3);
    // 6.14.66 (AC-C) : le ménage de la suppression est partagé par l'admin et le joueur (`purgePlayer`).
    expect(fns.get("purgePlayer")).toContain("notify(txApp, bidderId, b.notifications");
    expect(fns.get("adminDeletePlayer")).toContain("purgePlayer(txApp, game, uid");
    expect(fns.get("accountDelete")).toContain("purgePlayer(txApp, game, uid");
  });

  it("AC-1 : la campagne d'e-mails ne sauve jamais une fiche lue avant l'envoi", () => {
    // 6.14.111 (AC-7) : mise en file puis envoi par lots ; aucune des deux étapes ne sauve une fiche joueur.
    const queue = fns.get("queueCampaign")!;
    expect(queue).not.toMatch(/\.save\((?:player|r\.player)\b/);
    expect(queue).toContain("ensureMailTokens(recipients.list)");
    const send = fns.get("sendCampaignMail")!;
    expect(send).not.toMatch(/\.save\(/);
    expect(send).not.toMatch(/\.set\("/);
    expect(fns.get("mailQueueTick")).not.toMatch(/\.save\((?:player|rec)\b/);
    expect(fns.get("mailRecipients")).not.toMatch(/\.save\(/);
    // Les jetons manquants sont posés dans une transaction qui relit la fiche, et seulement eux.
    const tokens = fns.get("ensureMailTokens")!;
    expect(tokens).toContain("runInTransaction");
    expect(tokens).toContain('findOrNull(txApp, "players", uid)');
    expect(tokens.match(/\.set\("/g)).toEqual(['.set("']);
    expect(tokens).toContain('fresh.set("mailToken", token)');
    expect(fns.has("mailToken")).toBe(false);
  });

  it("AC-1, AC-9 : aucune fiche joueur lue hors transaction n'est réécrite", () => {
    const offenders: string[] = [];
    for (const [name, body] of fns) {
      const re = /(?:const|let)\s+([A-Za-z0-9_]+)\s*=\s*(?:[^;]*\?\s*)?(?:findOrNull\(\$app,\s*"players"|\$app\.findRecordById\("players")/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(body))) {
        if (new RegExp(`\\$app\\.save\\(${m[1]}\\)`).test(body)) offenders.push(`${name}:${m[1]}`);
      }
    }
    expect(offenders).toEqual([]);
    expect(db).not.toMatch(/bumpPlayerStat\(\$app\b/);
    expect(fns.get("unsubscribe")).toContain("runInTransaction");
  });

  it("AC-13 : chaque raid de faction reçoit l'heure de départ", () => {
    const calls: string[] = [];
    const re = /createPirateRaid\(([^;]*?)\);/g;
    let m: RegExpExecArray | null;
    for (const src of [db, pb]) {
      while ((m = re.exec(src))) if (!m[1].startsWith("txApp, game, player, raid")) calls.push(m[1]);
      re.lastIndex = 0;
    }
    expect(calls.length).toBeGreaterThanOrEqual(3);
    for (const args of calls) expect(args.trim().endsWith(", now"), args).toBe(true);
  });
});
