import { timingSafeEqual } from "node:crypto";

// 예약 발송 크론 인증 — Authorization: Bearer <토큰>
// 허용 토큰: Vercel 크론의 CRON_SECRET, 또는 DB(pg_cron, 037)가 보관한 newsletter_send 토큰

export function bearerFrom(header: string | null): string {
  const h = (header ?? "").trim();
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : "";
}

export function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function matchesAny(given: string, candidates: (string | null | undefined)[]): boolean {
  return candidates.some((c) => !!c && safeEqual(given, c));
}
