import { describe, expect, it } from "vitest";
import { sameWeekdayNextMonth } from "@/lib/calendarShift";

describe("copie d'un mois vers le suivant (5.16)", () => {
  it("garde le jour de la semaine, son rang et l'heure", () => {
    const sat = new Date(2026, 9, 10, 18, 0).getTime(); // 2e samedi d'octobre 2026
    const out = new Date(sameWeekdayNextMonth(sat));
    expect([out.getMonth(), out.getDate(), out.getDay(), out.getHours()]).toEqual([10, 14, 6, 18]); // 2e samedi de novembre
    const fifth = new Date(2026, 9, 31, 18).getTime(); // 5e samedi d'octobre → dernier samedi de novembre
    const o2 = new Date(sameWeekdayNextMonth(fifth));
    expect([o2.getMonth(), o2.getDate(), o2.getDay()]).toEqual([10, 28, 6]);
  });
});
