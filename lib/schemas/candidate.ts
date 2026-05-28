export const CANDIDATE_STATUS_LABEL: Record<
  string,
  { label: string; variant: "default" | "warning" | "success" | "muted" | "destructive" }
> = {
  proposed: { label: "제안됨", variant: "warning" },
  viewed: { label: "열람", variant: "default" },
  interested: { label: "관심 표시", variant: "success" },
  declined_by_client: { label: "광고주 거절", variant: "muted" },
  declined_by_partner: { label: "대행사 거절", variant: "muted" },
  meeting_set: { label: "미팅 예정", variant: "default" },
  won: { label: "최종 선정", variant: "success" },
  lost: { label: "미선정", variant: "muted" },
};

export const MAX_CANDIDATES = 3;
