"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import {
  PARTNER_CATEGORIES,
  STAFF_SIZE_OPTIONS,
  type PartnerApplicationMeta,
} from "@/lib/schemas/partner-application";
import type { Json } from "@/types/database";

export type CreatePartnerResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((v) => v || null);

// 운영자 직접 등록 입력 — 공개 등록신청서의 핵심 필드만 (파일 첨부·매칭 희망사항 없음)
const adminPartnerSchema = z.object({
  company_name: z.string().trim().min(1, "대행사명을 입력하세요.").max(200),
  biz_reg_no: z
    .string()
    .trim()
    .regex(/^\d{3}-?\d{2}-?\d{5}$/, "사업자등록번호 형식이 올바르지 않습니다. (000-00-00000)"),
  contact_person: z.string().trim().min(1, "담당자 성함을 입력하세요.").max(100),
  contact_email: z.string().trim().email("올바른 이메일을 입력하세요."),
  contact_phone: z.string().trim().min(1, "연락처를 입력하세요.").max(30),
  website: z
    .union([z.string().trim().url("올바른 URL을 입력하세요."), z.literal("")])
    .transform((v) => v || null),
  specialty: optionalText(300),
  staff_size: z.enum(STAFF_SIZE_OPTIONS).nullable(),
  intro: optionalText(3000),
  categories: z
    .array(z.enum(PARTNER_CATEGORIES.map((c) => c.value) as [string, ...string[]]))
    .min(1, "광고대행 가능 매체를 한 개 이상 선택하세요."),
  status: z.enum(["pending", "reviewing", "contracted"]),
  admin_memo: optionalText(1000),
});

export type AdminPartnerInput = z.input<typeof adminPartnerSchema>;

// 운영자가 대행사를 직접 등록 — 공개 신청서를 거치지 않은 기존/오프라인 협의 대행사용.
// RLS partners_admin_all 정책으로 운영자 세션 insert 허용. 계정 발급은 상세 화면에서 별도 진행.
export async function createPartnerByAdmin(input: AdminPartnerInput): Promise<CreatePartnerResult> {
  const role = await getCurrentRole();
  if (role !== "admin") return { ok: false, error: "운영자 권한이 필요합니다." };

  const parsed = adminPartnerSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return { ok: false, error: "입력값을 다시 확인해주세요.", fieldErrors };
  }
  const data = parsed.data;

  // 공개 신청서의 application JSONB와 같은 구조를 비워서 유지 (상세 화면 렌더 호환).
  // fee_agreement=true: 운영자 직접 등록은 수수료 조건이 오프라인에서 합의된 대행사를 전제.
  const application: PartnerApplicationMeta = {
    budget_ranges: [],
    contract_periods: [],
    performance_based: false,
    marketing_goals: [],
    kpis: [],
    report_cycles: [],
    meeting_cycles: [],
    tools: [],
    preferred_client_traits: null,
    avoided_client_traits: null,
    payment_methods: [],
    fee_agreement: true,
  };

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("partners")
    .insert({
      company_name: data.company_name,
      biz_reg_no: data.biz_reg_no.replace(/\D/g, ""),
      contact_person: data.contact_person,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      website: data.website,
      specialty: data.specialty,
      staff_size: data.staff_size,
      intro: data.intro,
      admin_memo: data.admin_memo,
      application: application as unknown as Json,
      status: data.status,
      reviewed_at: data.status !== "pending" ? now : null,
      contracted_at: data.status === "contracted" ? now : null,
      user_id: null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !inserted) {
    if (error?.code === "23505") {
      return {
        ok: false,
        error: "이미 등록된 사업자등록번호입니다.",
        fieldErrors: { biz_reg_no: ["이미 등록된 사업자등록번호입니다."] },
      };
    }
    return { ok: false, error: error?.message ?? "등록 중 오류가 발생했습니다." };
  }

  const { error: catError } = await supabase.from("partner_categories").insert(
    data.categories.map((category) => ({ partner_id: inserted.id, category })),
  );
  if (catError) {
    return {
      ok: false,
      error: "대행사는 등록됐지만 매체 저장에 실패했습니다. 상세 화면에서 확인해주세요.",
    };
  }

  revalidatePath("/admin/partners");
  return { ok: true, id: inserted.id };
}
