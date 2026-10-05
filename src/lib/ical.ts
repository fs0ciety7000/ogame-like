import type { AgendaItem } from "@/game/agenda";

/* 5.16 : export iCalendar (.ics) des prochains rendez-vous du secteur, pour
   les ajouter à Google Agenda, Outlook ou Calendrier (Apple). Heures en UTC. */

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** Coupe les lignes à 75 octets environ (RFC 5545). */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 72) {
    out.push(rest.slice(0, 72));
    rest = ` ${rest.slice(72)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

export function agendaToIcs(items: AgendaItem[], siteUrl: string, now: number): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cosmic Empires//Agenda//FR", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Cosmic Empires"];
  for (const i of items) {
    const end = i.endMs && i.endMs > i.startMs ? i.endMs : i.startMs + 3600_000;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${i.id}@cosmic-empires`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(i.startMs)}`,
      `DTEND:${stamp(end)}`,
      fold(`SUMMARY:${escape(`${i.emoji ? `${i.emoji} ` : ""}${i.title}`)}`),
      fold(`URL:${siteUrl}${i.link}`),
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      fold(`DESCRIPTION:${escape(i.title)}`),
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function downloadIcs(content: string, filename = "cosmic-empires.ics"): void {
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
