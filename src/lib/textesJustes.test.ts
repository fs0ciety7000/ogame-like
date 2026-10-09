import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { formatCompact, formatDecimal, formatNumber, formatPerSecond } from "@/lib/utils";
import { PAGE_TIPS } from "@/components/game/PageTip";
import { ALLIANCE_RULES } from "@/game/alliances";
import { PVP_RULES } from "@/game/pvp";

/* 6.14.54 (UX-3, AD-5 et AD-7) : nombres lisibles dans la police de titre, textes de règle lus dans les règles. */

describe("6.14.54 : séparateur des milliers", () => {
  it("formatNumber, formatDecimal et formatCompact n'émettent jamais U+202F, absent des polices de titre", () => {
    for (const s of [formatNumber(32_919), formatNumber(-1_234_567), formatDecimal(12_345.67), formatCompact(32_919), formatCompact(4_500_000)]) {
      expect(s).not.toContain(" ");
    }
    expect(formatNumber(32_919)).toBe("32 919");
    expect(formatNumber(1_234_567)).toBe("1 234 567");
    expect(formatDecimal(12_345.5, 1)).toBe("12 345,5");
    expect(formatNumber(999)).toBe("999");
  });

  it("formatPerSecond garde le même séparateur", () => {
    expect(formatPerSecond(3_600 * 1_500)).not.toContain(" ");
  });
});

describe("6.14.54 : astuces de page construites depuis les règles", () => {
  const saved = { maxMembers: ALLIANCE_RULES.maxMembers, membersPerQuarter: ALLIANCE_RULES.membersPerQuarter, ms: PVP_RULES.newbieProtectionMs };
  afterEach(() => {
    ALLIANCE_RULES.maxMembers = saved.maxMembers;
    ALLIANCE_RULES.membersPerQuarter = saved.membersPerQuarter;
    PVP_RULES.newbieProtectionMs = saved.ms;
  });

  it("l'astuce de l'Alliance suit maxMembers et membersPerQuarter réglés dans l'admin", () => {
    expect(PAGE_TIPS["/game/alliance"]).toContain(`${ALLIANCE_RULES.maxMembers} commandants`);
    ALLIANCE_RULES.maxMembers = 11;
    ALLIANCE_RULES.membersPerQuarter = 3;
    expect(PAGE_TIPS["/game/alliance"]).toContain("11 commandants au départ, +3 par niveau");
  });

  it("l'astuce des Joueurs suit la protection des débutants", () => {
    PVP_RULES.newbieProtectionMs = 48 * 3_600_000;
    expect(PAGE_TIPS["/game/joueurs"]).toContain("protégé 48 h");
  });

  it("aucune astuce ne demande seulement de survoler (le survol n'existe pas au toucher)", () => {
    for (const tip of Object.values(PAGE_TIPS)) {
      if (/survole/i.test(tip)) expect(tip).toMatch(/touche ou survole/i);
    }
  });

  it("les toasts de vendetta et de boss d'alliance ne citent plus de durée en dur", () => {
    const warlords = readFileSync("src/pages/WarlordsPage.tsx", "utf8");
    expect(warlords).not.toMatch(/["`']72 h pour/);
    const boss = readFileSync("src/components/game/AllianceBossTab.tsx", "utf8");
    expect(boss).not.toMatch(/approche : 24 h/);
  });
});
