import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEFAULT_FACTIONS, REPORT_PSEUDO_MAX } from "@/game/pirates";

/* Un rapport refusé par le schéma annule toute la transaction : le raid de
   l'Inquisition restait bloqué en approche (nom de 42 caractères pour 40). */
describe("rapports de combat et schéma", () => {
  const schema = JSON.parse(readFileSync("pocketbase/pb_schema.json", "utf8")) as { name: string; fields: { name: string; max?: number }[] }[];
  const fields = schema.find((c) => c.name === "battle_reports")!.fields;
  const max = (name: string) => fields.find((f) => f.name === name)!.max!;

  it("les pseudos du rapport tiennent dans les champs", () => {
    expect(max("attackerPseudo")).toBeGreaterThanOrEqual(REPORT_PSEUDO_MAX);
    expect(max("defenderPseudo")).toBeGreaterThanOrEqual(REPORT_PSEUDO_MAX);
    for (const f of DEFAULT_FACTIONS) {
      expect(`${f.enforcer} (${f.name})`.length).toBeLessThanOrEqual(REPORT_PSEUDO_MAX);
      expect(f.lair.name.length).toBeLessThanOrEqual(REPORT_PSEUDO_MAX);
    }
  });
});
