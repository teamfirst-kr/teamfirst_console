import { z } from "zod";

import { APP_KEY_RE, PLAN_KEYS } from "@/lib/solution-market";

// 구독 등록·수정 입력 스키마 (서버 액션과 폼이 공유).
// 플랜 한도(앱 수·직원 수)와 앱 키 존재 여부는 플랜 설정·카탈로그가 필요해 서버 액션에서 추가 검증한다.
const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식")
  .or(z.literal(""))
  .transform((v) => v || null);

const unique = <T,>(arr: T[]) => Array.from(new Set(arr));

export const subscriptionSchema = z.object({
  brand_name: z.string().trim().min(1, "브랜드명을 입력하세요.").max(100),
  contact_name: z.string().trim().max(50).transform((v) => v || null),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v.replace(/\D/g, "").length >= 9, "연락처를 확인하세요."),
  email: z.string().trim().max(120).transform((v) => v || null),
  plan: z.enum(PLAN_KEYS).nullable(), // null = 기존 개별 요금제(레거시) 구독
  solutions: z
    .array(z.string().regex(APP_KEY_RE, "잘못된 앱입니다."))
    .min(1, "앱을 1개 이상 선택하세요.")
    .transform(unique),
  member_emails: z
    .array(z.string().trim().toLowerCase().email("직원 이메일 형식을 확인하세요."))
    .max(999)
    .transform(unique),
  billing: z.enum(["monthly", "yearly"]),
  amount: z.number().int().min(0).max(10_000_000_000),
  status: z.enum(["pending", "active", "paused", "ended"]),
  starts_at: dateStr,
  next_billing_at: dateStr,
  ends_at: dateStr,
  solution_login_id: z.string().trim().max(100).transform((v) => v || null),
  memo: z.string().trim().max(1000).transform((v) => v || null),
  lead_id: z.string().uuid().nullable(),
});
export type SubscriptionInput = z.input<typeof subscriptionSchema>;
export type SubscriptionData = z.output<typeof subscriptionSchema>;
