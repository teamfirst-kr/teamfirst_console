import type { Billing } from "@/lib/solution-market";

// 레거시 — 솔루션별 개별 요금제(D-083) 시절의 키·문의 source 해석만 남긴다.
// 현재 요금 구조는 플랜 기반 솔루션 마켓(lib/solution-market.ts, D-088).
// 남은 용도: 기존 3종 앱의 상세 콘텐츠 키(solution-catalog.ts), 개편 전 접수된 구독 문의 리드 표시.

export type SolutionKey = "log" | "report" | "bid";

export const SOLUTION_KEYS: SolutionKey[] = ["log", "report", "bid"];
export const SOLUTION_BRAND: Record<SolutionKey, string> = { log: "CatchLog", report: "AUTO REPORT", bid: "AUTO BID" };

// 개편 전 pb_leads.source 형식: "sub:log+report+bid/Y/pv10"
export type SubscriptionSource = { keys: SolutionKey[]; billing: Billing; pv: number | null };

export function parseSubscriptionSource(source: string | null | undefined): SubscriptionSource | null {
  const m = /^sub:([a-z+]+)\/(Y|M)(?:\/pv(\d+))?$/.exec(source ?? "");
  if (!m) return null;
  const keys = m[1].split("+").filter((k): k is SolutionKey => (SOLUTION_KEYS as string[]).includes(k));
  if (keys.length === 0) return null;
  return { keys, billing: m[2] === "Y" ? "yearly" : "monthly", pv: m[3] ? Number(m[3]) * 10_000 : null };
}

// 관리자 표시용: "개별 요금(이전) · CatchLog+AUTO REPORT · 연간 · 10만 PV"
export function describeSubscriptionSource(source: string | null | undefined): string | null {
  const p = parseSubscriptionSource(source);
  if (!p) return null;
  const parts = ["개별 요금(이전)", p.keys.map((k) => SOLUTION_BRAND[k]).join("+"), p.billing === "yearly" ? "연간" : "월간"];
  if (p.pv) parts.push(`${Math.round(p.pv / 10_000)}만 PV`);
  return parts.join(" · ");
}
