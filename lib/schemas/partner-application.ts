import { z } from "zod";

export const PARTNER_CATEGORIES = [
  { value: "performance", label: "퍼포먼스" },
  { value: "branding", label: "브랜딩" },
  { value: "sns", label: "SNS" },
  { value: "search", label: "검색광고" },
  { value: "youtube", label: "유튜브" },
  { value: "influencer", label: "인플루언서" },
] as const;

export const STAFF_SIZE_OPTIONS = [
  "20명 미만",
  "20-50명",
  "51-100명",
  "100명 이상",
] as const;

// 사업자등록번호 표기 정규화: 숫자 10자리 또는 'XXX-XX-XXXXX'
const bizRegNoRegex = /^(\d{3}-?\d{2}-?\d{5})$/;

export const partnerApplicationSchema = z.object({
  company_name: z.string().min(1, "회사명을 입력해주세요.").max(200),
  biz_reg_no: z
    .string()
    .regex(bizRegNoRegex, "사업자등록번호 형식이 올바르지 않습니다. (000-00-00000)"),
  representative: z.string().max(50).optional(),
  established_year: z
    .union([
      z.coerce
        .number()
        .int()
        .min(1900, "올바른 연도를 입력해주세요.")
        .max(new Date().getFullYear(), "올바른 연도를 입력해주세요."),
      z.literal("").transform(() => undefined),
    ])
    .optional(),
  staff_size: z.enum(STAFF_SIZE_OPTIONS).optional(),
  website: z
    .union([z.string().url("올바른 URL을 입력해주세요."), z.literal("")])
    .optional(),
  contact_person: z.string().max(50).optional(),
  contact_email: z.string().email("올바른 이메일을 입력해주세요."),
  contact_phone: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
  intro: z.string().max(2000).optional(),
  strengths: z.string().max(500).optional(), // 콤마 구분 입력 → 서버에서 split
  notable_clients: z.string().max(1000).optional(), // 콤마 구분 입력
  categories: z
    .array(z.enum(PARTNER_CATEGORIES.map((c) => c.value) as [string, ...string[]]))
    .min(1, "전문 분야를 한 개 이상 선택해주세요."),
  privacy_consent: z
    .literal(true, {
      message: "개인정보 처리방침에 동의해주세요.",
    }),
});

export type PartnerApplicationInput = z.input<typeof partnerApplicationSchema>;
export type PartnerApplicationOutput = z.output<typeof partnerApplicationSchema>;

export function normalizeBizRegNo(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 10) return value;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function splitCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// 파일 업로드 제약
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
export const MAX_PORTFOLIO_FILES = 5;

export function validateUploadFile(file: File): string | null {
  if (file.size === 0) return null; // 빈 입력은 무시
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: 파일 크기는 10MB 이하여야 합니다.`;
  }
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return `${file.name}: PDF 또는 이미지(PNG/JPG/WEBP)만 업로드할 수 있습니다.`;
  }
  return null;
}

export function sanitizeFileName(name: string): string {
  // 경로/특수문자 제거, 한글·영문·숫자·일부 기호만 유지
  const base = name.replace(/[^\w.\-가-힣]/g, "_");
  return base.slice(0, 120) || "file";
}

