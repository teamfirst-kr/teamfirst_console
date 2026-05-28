// 최소 RFC5545 VEVENT 생성. 캘린더 첨부(.ics)용.
function fmt(date: Date): string {
  // UTC 기준 YYYYMMDDTHHMMSSZ
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function buildIcs(params: {
  uid: string;
  title: string;
  description?: string;
  start: Date;
  durationMinutes: number;
  url?: string;
}): string {
  const end = new Date(params.start.getTime() + params.durationMinutes * 60000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TeamFirst//Meeting//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(params.start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${escapeText(params.title)}`,
    params.description ? `DESCRIPTION:${escapeText(params.description)}` : "",
    params.url ? `URL:${params.url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
