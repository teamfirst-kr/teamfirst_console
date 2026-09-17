import { z } from "zod";

import { SOLUTION_KEYS } from "@/lib/solution-pricing";

// 구독 등록·수정 입력 스키마 (서버 액션과 폼이 공유)
const dateStr = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식")
  .or(z.literal(""))
  .transform((v) => v || null);

export const subscriptionSchema = z.object({
  brand_name: z.string().trim().min(1, "브랜드명을 입력하세요.").max(100),
  contact_name: z.string().trim().max(50).transform((v) => v || null),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v.replace(/\D/g, "").length >= 9, "연락처를 확인하세요."),
  email: z.string().trim().max(120).transform((v) => v || null),
  solutions: z
    .array(z.enum(["log", "report", "bid"]))
    .min(1, "솔루션을 1개 이상 선택하세요.")
    .transform((arr) => SOLUTION_KEYS.filter((k) => arr.includes(k))),
  billing: z.enum(["monthly", "yearly"]),
  pv: z.number().int().positive().nullable(),
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

