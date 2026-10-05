import { describe, expect, it } from "vitest";
import { agendaToIcs } from "@/lib/ical";

describe("export iCal de l'agenda (5.16)", () => {
  it("un VEVENT par rendez-vous, heures UTC, rappel 30 min, texte échappé", () => {
    const ics = agendaToIcs(
      [{ id: "lev-1", kind: "leviathan", title: "Le Léviathan, réveillé", startMs: Date.UTC(2026, 9, 9, 16), endMs: Date.UTC(2026, 9, 11, 16), link: "/game/uber", emoji: "🐋" }],
      "https://empire.fs0ciety.org",
      Date.UTC(2026, 9, 5),
    );
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20261009T160000Z");
    expect(ics).toContain("SUMMARY:🐋 Le Léviathan\\, réveillé");
    expect(ics).toContain("TRIGGER:-PT30M");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });
});
