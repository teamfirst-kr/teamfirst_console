import { z } from "zod";

export const AD_PLATFORMS = [
  { value: "naver", label: "네이버" },
  { value: "kakao", label: "카카오" },
  { value: "google", label: "구글" },
  { value: "meta", label: "메타" },
  { value: "tiktok", label: "틱톡" },
  { value: "youtube", label: "유튜브" },
  { value: "other", label: "기타" },
] as const;

export type AdPlatform = (typeof AD_PLATFORMS)[number]["value"];

export const matchingRequestSchema = z.object({
  title: z.string().min(1, "요청 제목을 입력해주세요.").max(120),
  campaign_goal: z.string().min(1, "캠페인 목적을 입력해주세요.").max(1000),
  target_audience: z.string().max(1000).optional(),
  channels: z
    .array(z.enum(AD_PLATFORMS.map((p) => p.value) as [string, ...string[]]))
    .min(1, "운영 희망 채널을 한 개 이상 선택해주세요."),
  budget_monthly: z
    .union([
      z.coerce.number().int().min(0, "0 이상 숫자를 입력해주세요."),
      z.literal("").transform(() => undefined),
    ])
    .optional(),
  duration_months: z
    .union([
      z.coerce.number().int().min(1).max(120),
      z.literal("").transform(() => undefined),
    ])
    .optional(),
  current_agency: z.string().max(200).optional(),
  kpi: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export type MatchingRequestInput = z.input<typeof matchingRequestSchema>;
export type MatchingRequestOutput = z.output<typeof matchingRequestSchema>;

export const REQUEST_STATUS_LABEL: Record<
  string,
  { label: string; variant: "default" | "warning" | "success" | "muted" | "destructive" }
> = {
  draft: { label: "작성 중", variant: "muted" },
  submitted: { label: "제출 완료", variant: "warning" },
  rfp_sent: { label: "RFP 발송됨", variant: "default" },
  collecting: { label: "지원 수집 중", variant: "default" },
  curating: { label: "후보 선정 중", variant: "default" },
  candidates_sent: { label: "후보 전달됨", variant: "default" },
  meeting_scheduled: { label: "미팅 예정", variant: "default" },
  closed_won: { label: "성사", variant: "success" },
  closed_lost: { label: "종료", variant: "muted" },
  cancelled: { label: "취소", variant: "destructive" },
};
