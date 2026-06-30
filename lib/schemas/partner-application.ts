import { z } from "zod";

// 광고대행 가능 매체 — RFP 매칭의 핵심 기준 (partner_categories에 저장)
export const PARTNER_CATEGORIES = [
  { value: "naver", label: "네이버 SA & GFA" },
  { value: "kakao", label: "카카오 SA & DA" },
  { value: "google", label: "Google Ads" },
  { value: "meta", label: "META Ads" },
  { value: "tiktok", label: "틱톡" },
  { value: "network", label: "네트워크 채널 (타겟팅게이츠/모비온/크리테오 등)" },
  { value: "press", label: "언론송출 광고" },
  { value: "ooh", label: "옥외광고" },
  { value: "viral", label: "바이럴마케팅" },
  { value: "influencer", label: "인플루언서 마케팅 (공동구매 포함)" },
  { value: "shortform", label: "숏폼 마케팅 (영상기획 & 제작)" },
] as const;

export const STAFF_SIZE_OPTIONS = [
  "1인 대행사",
  "2명~5명",
  "6명~20명",
  "20명~50명",
  "50명 이상",
] as const;

export const BUDGET_RANGE_OPTIONS = [
  "상관없음",
  "300만원 이상",
  "500만원 이상",
  "1,000만원 이상",
  "3,000만원 이상",
  "5,000만원 이상",
] as const;

export const CONTRACT_PERIOD_OPTIONS = [
  "상관없음",
  "3개월 미만 or 프로젝트성",
  "1년 미만 단기대행",
  "연간대행",
  "장기대행",
] as const;

export const MARKETING_GOAL_OPTIONS = [
  "매출액 증대",
  "신규 고객 확보",
  "재구매율 향상",
  "브랜드 인지도 강화",
  "앱 설치",
  "회원가입",
  "SNS 활성화",
  "기타",
] as const;

export const KPI_OPTIONS = [
  "ROAS or ROI",
  "CPA",
  "CTR",
  "전환수",
  "앱 설치 수",
  "SNS 팔로워 증가",
  "콘텐츠 조회수",
] as const;

export const REPORT_CYCLE_OPTIONS = ["주간", "월간", "분기", "연간"] as const;

export const MEETING_CYCLE_OPTIONS = [
  "주간",
  "월간",
  "분기",
  "연간",
  "별도 요청시 진행",
] as const;

export const TOOL_OPTIONS = [
  "GA4",
  "GTM (구글 태그 매니저)",
  "CRM 툴",
  "MMP 툴",
  "해당없음 또는 기타",
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  "공식광고 대행 or 대대행 (무료대행)",
  "월 광고비용의 일정 비율(%) 대행비용 지급",
  "월 관리비 정액제",
  "대행기간 관리비용 선지급 방식",
  "대행사측 광고비 선결제, 이후 광고비용 + 대행비용 지불",
] as const;

const optionalText = (max: number) =>
  z.string().max(max).optional().or(z.literal("").transform(() => undefined));

export const partnerApplicationSchema = z.object({
  // 1. 회사 기본정보
  company_name: z.string().min(1, "대행사명을 입력해주세요.").max(200),
  biz_reg_no: z
    .string()
    .min(1, "사업자등록번호를 입력해주세요.")
    .regex(
      /^\d{3}-?\d{2}-?\d{5}$/,
      "사업자등록번호 형식이 올바르지 않습니다. (000-00-00000)",
    ),
  contact_person: z.string().min(1, "담당자 성함/직책을 입력해주세요.").max(100),
  contact_email: z.string().email("올바른 이메일을 입력해주세요."),
  contact_phone: z.string().min(1, "직통 연락처를 입력해주세요.").max(30),
  website: z
    .union([z.string().url("올바른 URL을 입력해주세요."), z.literal("")])
    .optional(),
  specialty: optionalText(300),
  staff_size: z.enum(STAFF_SIZE_OPTIONS, {
    message: "직원수를 선택해주세요.",
  }),
  intro: optionalText(3000),

  // 광고대행 가능 매체 (partner_categories)
  categories: z
    .array(z.enum(PARTNER_CATEGORIES.map((c) => c.value) as [string, ...string[]]))
    .min(1, "광고대행 가능 매체를 한 개 이상 선택해주세요."),

  // 매칭 희망사항 (application JSONB)
  budget_ranges: z.array(z.enum(BUDGET_RANGE_OPTIONS)).optional(),
  contract_periods: z.array(z.enum(CONTRACT_PERIOD_OPTIONS)).optional(),
  performance_based: z.boolean().optional(),
  marketing_goals: z.array(z.enum(MARKETING_GOAL_OPTIONS)).optional(),
  kpis: z.array(z.enum(KPI_OPTIONS)).optional(),
  report_cycles: z.array(z.enum(REPORT_CYCLE_OPTIONS)).optional(),
  meeting_cycles: z.array(z.enum(MEETING_CYCLE_OPTIONS)).optional(),
  tools: z.array(z.enum(TOOL_OPTIONS)).optional(),
  preferred_client_traits: optionalText(1000),
  avoided_client_traits: optionalText(1000),
  payment_methods: z.array(z.enum(PAYMENT_METHOD_OPTIONS)).optional(),

  // 동의
  fee_agreement: z.literal(true, {
    message: "수수료 발생에 대한 동의가 필요합니다.",
  }),
  privacy_consent: z.literal(true, {
    message: "개인정보 처리방침에 동의해주세요.",
  }),
});

export type PartnerApplicationInput = z.input<typeof partnerApplicationSchema>;
export type PartnerApplicationOutput = z.output<typeof partnerApplicationSchema>;

// application JSONB로 직렬화되는 매칭 희망사항 구조
export type PartnerApplicationMeta = {
  budget_ranges: string[];
  contract_periods: string[];
  performance_based: boolean;
  marketing_goals: string[];
  kpis: string[];
  report_cycles: string[];
  meeting_cycles: string[];
  tools: string[];
  preferred_client_traits: string | null;
  avoided_client_traits: string | null;
  payment_methods: string[];
  fee_agreement: boolean;
  // 사업자등록증 첨부 (partner-files 버킷 경로)
  business_license?: { name: string; path: string } | null;
};

// 파일 업로드 제약
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
];
export const MAX_PORTFOLIO_FILES = 5;

export function validateUploadFile(file: File): string | null {
  if (file.size === 0) return null;
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: 파일 크기는 10MB 이하여야 합니다.`;
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return `${file.name}: PDF·이미지·ZIP만 업로드할 수 있습니다.`;
  }
  return null;
}

export function sanitizeFileName(name: string): string {
  const base = name.replace(/[^\w.\-가-힣]/g, "_");
  return base.slice(0, 120) || "file";
}
