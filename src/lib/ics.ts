import { PerthEvent } from "./types";

const EVENT_DURATION_MS = 2 * 60 * 60 * 1000;

function icsEscape(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 line folding: lines longer than 75 octets continue with a leading space. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = " " + rest.slice(73);
  }
  out.push(rest);
  return out.join("\r\n");
}

/** UTC timestamp in ICS basic format, e.g. 20260726T110000Z. */
function icsDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Events must have a confirmed start date to be exportable. */
export function calendarReady(events: PerthEvent[]): PerthEvent[] {
  return events.filter((e) => e.start !== null && !isNaN(Date.parse(e.start)));
}

export function buildICS(events: PerthEvent[]): string {
  const now = icsDate(Date.now());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventsMeet//Perth Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:EventsMeet — Perth",
  ];

  for (const event of calendarReady(events)) {
    const startMs = Date.parse(event.start as string);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${icsEscape(event.id)}@eventsmeet`,
      `DTSTAMP:${now}`,
      `DTSTART:${icsDate(startMs)}`,
      `DTEND:${icsDate(startMs + EVENT_DURATION_MS)}`,
      fold(`SUMMARY:${icsEscape(`${event.emoji} ${event.title}`)}`),
      fold(
        `DESCRIPTION:${icsEscape(
          `${event.description}\n\nPrice: ${event.price}\n${event.url}`
        )}`
      ),
      fold(`LOCATION:${icsEscape(event.venue)}`),
      fold(`URL:${icsEscape(event.url)}`),
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

/** Triggers a browser download of an .ics file, which opens in Apple Calendar. */
export function downloadICS(events: PerthEvent[], filename: string): void {
  const blob = new Blob([buildICS(events)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
