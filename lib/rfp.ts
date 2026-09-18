import { addBusinessDays } from "./payback-domain";

// RFP 지원 기한 규칙: 발행일(KST) + 5영업일 (주말·공휴일 제외). 마감일 당일 23:59 KST까지 지원 가능.
export const RFP_APPLY_BUSINESS_DAYS = 5;

// KST 기준 오늘 (YYYY-MM-DD)
export function todayKst(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function rfpDeadlineFrom(issuedKstDate: string): string {
  return addBusinessDays(issuedKstDate, RFP_APPLY_BUSINESS_DAYS);
}

// 마감 여부 (deadline 없으면 열려 있음)
export function isRfpClosed(deadline: string | null | undefined, now: Date = new Date()): boolean {
  if (!deadline) return false;
  return todayKst(now) > deadline;
}

// D-day 표기: "D-3" / "D-Day" / "마감"
export function rfpDday(deadline: string | null | undefined, now: Date = new Date()): string | null {
  if (!deadline) return null;
  const today = todayKst(now);
  const diff = Math.round((Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000);
  if (diff < 0) return "마감";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}

export function formatDeadline(deadline: string): string {
  return deadline.replace(/-/g, ".");
}
