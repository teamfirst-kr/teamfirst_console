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

const PHONE_REGEX = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
const BIZ_REG_REGEX = /^\d{3}-?\d{2}-?\d{5}$/;

export const matchingRequestSchema = z.object({
  // 1. 매칭 기본정보 (브랜드사 정보)
  company_name: z.string().min(1, "상호(사업자명)를 입력해주세요.").max(200),
  biz_reg_no: z
    .string()
    .regex(BIZ_REG_REGEX, "사업자등록번호 형식이 올바르지 않습니다. (000-00-00000)"),
  representative: z.string().min(1, "대표자명을 입력해주세요.").max(50),
  brand_name: z.string().min(1, "브랜드명을 입력해주세요.").max(200),
  contact_name: z.string().min(1, "담당자명을 입력해주세요.").max(50),
  contact_title: z.string().min(1, "담당자 직책을 입력해주세요.").max(100),
  email: z.string().email("올바른 이메일을 입력해주세요."),
  phone: z
    .string()
    .regex(PHONE_REGEX, "올바른 연락처 형식이 아닙니다. (예: 010-1234-5678)"),
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

  // 4. 예산은 매체별 집행 예정 광고예산(planned_budgets)으로 별도 처리 (action에서)

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

  // 성과조회(분석) 권한 부여 의향
  analysis_access_intent: z.boolean().optional(),
});

export type MatchingRequestInput = z.input<typeof matchingRequestSchema>;
export type MatchingRequestOutput = z.output<typeof matchingRequestSchema>;

export function normalizeBizRegNo(value: string): string {
  const d = value.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : value;
}

// matching_requests.brief(JSONB)에 저장되는 구조
export type MatchingBrief = {
  company_name: string;
  biz_reg_no: string;
  representative: string;
  brand_name: string;
  contact_name: string;
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
  analysis_access_intent: boolean;
  // 협업 후 집행 예정 월평균 광고예산 (요청 매체별, 원)
  planned_budgets: Record<string, number>;
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
