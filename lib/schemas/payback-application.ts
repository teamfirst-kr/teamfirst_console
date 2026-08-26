import { z } from "zod";

export const PB_MEDIA_OPTIONS = [
  { value: "naver", label: "네이버 검색광고/GFA" },
  { value: "kakao", label: "카카오 광고" },
] as const;

// 경량 신청 폼 (021): 사업자등록번호·대표자는 사업자등록증 파일로 대체,
// 계산서 발행 이메일·페이백 계좌·솔루션 계정은 접수 후 메일 회신으로 수집.
export const paybackApplicationSchema = z.object({
  company_name: z.string().min(1, "회사명을 입력해주세요.").max(100),
  contact_name: z.string().min(1, "담당자 성함을 입력해주세요.").max(50),
  contact_email: z.string().email("올바른 이메일을 입력해주세요."),
  contact_phone: z.string().min(9, "연락처를 입력해주세요.").max(20),
  expected_budget: z.number().int().min(0).nullable(),
  opt_all_solutions: z.boolean(),
  opt_consulting: z.boolean(),
  media_accounts: z
    .array(
      z.object({
        media: z.enum(["naver", "kakao", "google", "meta"]),
        account_id: z.string().min(1).max(100),
      }),
    )
    .min(1, "광고 계정을 1개 이상 입력해주세요."),
});

export type PaybackApplicationValues = z.infer<typeof paybackApplicationSchema>;
