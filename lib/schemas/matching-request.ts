import { z } from "zod";

import {
  KPI_OPTIONS,
  MARKETING_GOAL_OPTIONS,
  MEETING_CYCLE_OPTIONS,
  PARTNER_CATEGORIES,
  PAYMENT_METHOD_OPTIONS,
  REPORT_CYCLE_OPTIONS,
  TOOL_OPTIONS,
} from "@/lib/schemas/partner-application";

// 요청 가능 매체 = 파트너 가능 매체와 동일 목록 (RFP 매칭 일관성)
export const REQUEST_MEDIA = PARTNER_CATEGORIES;

// 광고주 KPI에는 콘텐츠 마케팅 활성화가 추가됨
export const REQUEST_KPI_OPTIONS = [
  ...KPI_OPTIONS,
  "콘텐츠 마케팅 활성화",
] as const;

export {
  MARKETING_GOAL_OPTIONS,
  MEETING_CYCLE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  REPORT_CYCLE_OPTIONS,
  TOOL_OPTIONS,
};

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal("").transform(() => undefined));

export const matchingRequestSchema = z.object({
  // 1. 매칭 기본정보
  brand_name: z.string().min(1, "브랜드명을 입력해주세요.").max(200),
  contact_title: z.string().min(1, "담당자 직책을 입력해주세요.").max(100),
  email: z.string().email("올바른 이메일을 입력해주세요."),
  phone: z.string().min(1, "직통 연락처를 입력해주세요.").max(30),
  website: z
    .union([z.string().url("올바른 URL을 입력해주세요."), z.literal("")])
    .optional(),
  category: z.string().min(1, "추진 카테고리를 입력해주세요.").max(200),
  product_intro: z.string().min(1, "주력 제품/서비스를 소개해주세요.").max(1000),
  reason: z.string().min(1, "신규 대행사 모집 이유를 작성해주세요.").max(1000),

  // 2. 마케팅 목표 (최대 2개)
  marketing_goals: z
    .array(z.enum(MARKETING_GOAL_OPTIONS))
    .min(1, "마케팅 목표를 선택해주세요.")
    .max(2, "마케팅 목표는 최대 2개까지 선택할 수 있습니다."),

  // 3. 요청 매체
  channels: z
    .array(z.enum(REQUEST_MEDIA.map((m) => m.value) as [string, ...string[]]))
    .min(1, "광고대행을 요청할 매체를 한 개 이상 선택해주세요."),

  // 4. 월 예산
  budget_monthly: z.coerce
    .number({ message: "월 예산을 숫자로 입력해주세요." })
    .int()
    .min(0, "0 이상 숫자를 입력해주세요."),

  // 5. 희망 대행 기간
  duration: z.string().min(1, "희망 대행 기간을 입력해주세요.").max(100),

  // 6. KPI
  kpis: z
    .array(z.enum(REQUEST_KPI_OPTIONS))
    .min(1, "중요 성과지표를 한 개 이상 선택해주세요."),

  // 7~9
  report_cycles: z
    .array(z.enum(REPORT_CYCLE_OPTIONS))
    .min(1, "리포트 주기를 선택해주세요."),
  meeting_cycles: z
    .array(z.enum(MEETING_CYCLE_OPTIONS))
    .min(1, "미팅 주기를 선택해주세요."),
  tools: z.array(z.enum(TOOL_OPTIONS)).min(1, "운영 툴을 선택해주세요."),

  // 10~11
  preferred_agency: z
    .string()
    .min(1, "매칭을 희망하는 대행사 기준을 작성해주세요.")
    .max(1000),
  avoided_agency: optionalText(1000),

  // 12. 계약 방식
  payment_methods: z
    .array(z.enum(PAYMENT_METHOD_OPTIONS))
    .min(1, "희망 계약 방식을 선택해주세요."),
});

export type MatchingRequestInput = z.input<typeof matchingRequestSchema>;
export type MatchingRequestOutput = z.output<typeof matchingRequestSchema>;

// matching_requests.brief(JSONB)에 저장되는 구조
export type MatchingBrief = {
  brand_name: string;
  contact_title: string;
  email: string;
  phone: string;
  website: string | null;
  category: string;
  product_intro: string;
  reason: string;
  marketing_goals: string[];
  channels: string[];
  duration: string;
  kpis: string[];
  report_cycles: string[];
  meeting_cycles: string[];
  tools: string[];
  preferred_agency: string;
  avoided_agency: string | null;
  payment_methods: string[];
  ad_spend_proof: { name: string; path: string } | null;
};

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
