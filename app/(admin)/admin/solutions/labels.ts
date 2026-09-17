import type { LeadStatus, SolutionSubscriptionStatus } from "@/types/database";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "muted";

export const LEAD_STATUS_LABEL: Record<LeadStatus, { label: string; variant: BadgeVariant }> = {
  new: { label: "신규", variant: "warning" },
  contacted: { label: "연락 완료", variant: "default" },
  converted: { label: "구독 전환", variant: "success" },
  closed: { label: "종료", variant: "muted" },
};

export const SUB_STATUS_LABEL: Record<SolutionSubscriptionStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "세팅 중", variant: "warning" },
  active: { label: "구독 중", variant: "success" },
  paused: { label: "일시정지", variant: "muted" },
  ended: { label: "종료", variant: "destructive" },
};

// 월 환산 매출 (연간 결제는 ÷12) — 대시보드·요약 카드 공용
export function monthlyEquivalent(amount: number, billing: "monthly" | "yearly"): number {
  return billing === "yearly" ? Math.floor(amount / 12) : amount;
}
