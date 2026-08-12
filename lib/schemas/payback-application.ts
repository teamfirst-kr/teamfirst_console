import { z } from "zod";

export const PB_MEDIA_OPTIONS = [
  { value: "naver", label: "네이버 검색광고/GFA" },
  { value: "kakao", label: "카카오 광고" },
] as const;

export const paybackApplicationSchema = z.object({
  company_name: z.string().min(1, "회사명을 입력해주세요.").max(100),
  business_number: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length === 10, "사업자등록번호는 숫자 10자리입니다."),
  ceo_name: z.string().max(50).optional().or(z.literal("")),
  contact_name: z.string().min(1, "담당자 성함을 입력해주세요.").max(50),
  contact_email: z.string().email("올바른 이메일을 입력해주세요."),
  contact_phone: z.string().min(9, "연락처를 입력해주세요.").max(20),
  expected_budget: z.number().int().min(0).nullable(),
  opt_all_solutions: z.boolean(),
  opt_consulting: z.boolean(),
  bank_name: z.string().max(30).optional().or(z.literal("")),
  bank_account: z.string().max(40).optional().or(z.literal("")),
  bank_holder: z.string().max(50).optional().or(z.literal("")),
  invoice_capable: z.boolean(),
  invoice_email: z
    .string()
    .email("올바른 계산서 발행 이메일을 입력해주세요.")
    .optional()
    .or(z.literal("")),
  agreed_invoice: z.boolean(),
  solution_login_id: z
    .string()
    .max(30, "솔루션 ID는 30자 이내입니다.")
    .regex(/^[A-Za-z0-9_.-]*$/, "솔루션 ID는 영문·숫자·-_. 만 사용할 수 있습니다.")
    .optional()
    .or(z.literal("")),
  solution_login_pw: z
    .string()
    .max(50)
    .refine((v) => v === "" || v.length >= 8, "솔루션 비밀번호는 8자 이상이어야 합니다.")
    .optional()
    .or(z.literal("")),
  media_accounts: z
    .array(
      z.object({
        media: z.enum(["naver", "kakao", "google", "meta"]),
        account_id: z.string().min(1).max(100),
      }),
    )
    .min(1, "광고 계정을 1개 이상 입력해주세요."),
  agreed: z
    .boolean()
    .refine((v) => v === true, "약관 및 세무 고지에 동의해주세요."),
});

export type PaybackApplicationValues = z.infer<typeof paybackApplicationSchema>;
