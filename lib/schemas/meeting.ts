export const MEETING_STATUS_LABEL: Record<
  string,
  { label: string; variant: "default" | "warning" | "success" | "muted" | "destructive" }
> = {
  requested: { label: "일정 제안됨", variant: "warning" },
  pending: { label: "파트너 응답 대기", variant: "warning" },
  confirmed: { label: "확정", variant: "success" },
  rescheduling: { label: "재조율 중", variant: "default" },
  completed: { label: "완료", variant: "muted" },
  cancelled: { label: "취소", variant: "destructive" },
  no_show: { label: "노쇼", variant: "destructive" },
};

// 미팅 후 대행 결정 데드라인 (CLAUDE.md §4.1)
export const DECISION_DEADLINE_DAYS = 7;
export const REMINDER_DAY = 5;
