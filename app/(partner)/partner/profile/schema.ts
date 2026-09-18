import { z } from "zod";

import { PARTNER_CATEGORIES, STAFF_SIZE_OPTIONS } from "@/lib/schemas/partner-application";

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((v) => v || null);

// 콤마·줄바꿈 구분 목록 → 배열
const list = (max: number) =>
  z
    .string()
    .trim()
    .max(2000)
    .transform((v) =>
      v
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, max),
    );

// 파트너가 직접 수정 가능한 대행사 정보 (사업자번호·입점 상태·운영자 메모는 제외)
export const partnerProfileSchema = z.object({
  company_name: z.string().trim().min(1, "대행사명을 입력해주세요.").max(200),
  representative: optionalText(100),
  established_year: z
    .string()
    .trim()
    .regex(/^(\d{4})?$/, "설립연도는 4자리 숫자로 입력해주세요.")
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (v >= 1950 && v <= 2100), "설립연도를 확인해주세요."),
  staff_size: z.enum(STAFF_SIZE_OPTIONS, { message: "직원수를 선택해주세요." }),
  website: z
    .union([z.string().trim().url("올바른 URL을 입력해주세요."), z.literal("")])
    .transform((v) => v || null),
  contact_person: z.string().trim().min(1, "담당자 성함/직책을 입력해주세요.").max(100),
  contact_email: z.string().trim().email("올바른 이메일을 입력해주세요."),
  contact_phone: z.string().trim().min(1, "연락처를 입력해주세요.").max(30),
  address: optionalText(300),
  specialty: optionalText(300),
  intro: optionalText(3000),
  strengths: list(20),
  notable_clients: list(50),
  categories: z
    .array(z.enum(PARTNER_CATEGORIES.map((c) => c.value) as [string, ...string[]]))
    .min(1, "광고대행 가능 매체를 1개 이상 선택해주세요."),
});
export type PartnerProfileInput = z.input<typeof partnerProfileSchema>;
export type PartnerProfileData = z.output<typeof partnerProfileSchema>;
