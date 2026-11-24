"use server";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/email/admin-alert";
import { ipRateLimited, isHoneypotHit, phoneBurstBlocked } from "@/lib/lead-guard";
import { maskEmail, maskPhone, previewText } from "@/lib/pii";
import { CONSULT_OTHER_MIN, CONSULT_TYPES, CONSULT_TYPE_KEYS } from "@/lib/consult";

export type ConsultResult = { ok: true } | { ok: false; error: string };

const schema = z
  .object({
    email: z.string().trim().max(120).email("이메일 형식을 확인해주세요."),
    phone: z
      .string()
      .trim()
      .max(20)
      .refine((v) => v.replace(/\D/g, "").length >= 9, "전화번호를 확인해주세요."),
    brand: z.string().trim().min(1, "브랜드명을 입력해주세요.").max(100),
    type: z.enum(CONSULT_TYPE_KEYS, { message: "상담 종류를 선택해주세요." }),
    message: z.string().trim().max(2000),
    hp: z.string().max(200).optional(), // 허니팟
  })
  .refine((d) => d.type !== "other" || d.message.length >= CONSULT_OTHER_MIN, {
    message: `기타 문의 내용을 ${CONSULT_OTHER_MIN}자 이상 입력해주세요.`,
    path: ["message"],
  });

// 솔루션 마켓 하단 상담 신청 → pb_leads (+ 운영자 즉시 알림)
export async function submitConsultation(input: z.input<typeof schema>): Promise<ConsultResult> {
  // 봇: 저장·알림 없이 성공처럼 응답
  if (isHoneypotHit(input?.hp)) return { ok: true };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." };
  const d = parsed.data;
  const type = CONSULT_TYPES.find((t) => t.key === d.type)!;
  const phone = d.phone.replace(/[^\d+-]/g, "");
  const message = d.type === "other" ? d.message : null;

  if (await ipRateLimited("consult", 5)) return { ok: false, error: "잠시 후 다시 시도해주세요." };

  try {
    const admin = createAdminClient();
    if (await phoneBurstBlocked(admin, phone)) return { ok: false, error: "이미 접수되었습니다. 담당자가 곧 연락드립니다." };
    const base = { brand_name: d.brand, phone, source: type.source };
    const { error } = await admin.from("pb_leads").insert({ ...base, email: d.email, message });
    if (error) {
      // 039(email·message 컬럼) 적용 전이면 메모에 담아 접수는 유지
      const { error: fallbackError } = await admin.from("pb_leads").insert({
        ...base,
        memo: [`이메일: ${d.email}`, message ? `문의: ${message}` : null].filter(Boolean).join(" / ").slice(0, 1000),
      });
      if (fallbackError) return { ok: false, error: "접수에 실패했습니다. 잠시 후 다시 시도해주세요." };
    }
  } catch {
    return { ok: false, error: "접수에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }

  await notifyAdmins({
    type: "pb_lead",
    title: `📨 상담 신청 — ${type.label}`,
    rows: [
      ["브랜드", d.brand],
      // 알림 메일·벨에는 마스킹 값만 — 원문은 콘솔에서 열람 기록과 함께 확인 (D-093)
      ["전화번호", maskPhone(phone)],
      ["이메일", maskEmail(d.email)],
      ["상담 종류", type.label],
      ...(message ? ([["문의 내용", previewText(message)]] as [string, string][]) : []),
    ],
    link: d.type === "solution" ? "/admin/solutions#leads" : "/admin/payback",
    linkLabel: "상담 신청 확인하기",
  });
  return { ok: true };
}
