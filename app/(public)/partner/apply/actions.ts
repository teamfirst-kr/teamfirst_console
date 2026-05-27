"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  normalizeBizRegNo,
  partnerApplicationSchema,
  splitCsv,
} from "@/lib/schemas/partner-application";

export type ApplyState =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | null;

export async function submitPartnerApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const raw = {
    company_name: formData.get("company_name"),
    biz_reg_no: formData.get("biz_reg_no"),
    representative: formData.get("representative") || undefined,
    established_year: formData.get("established_year") || undefined,
    staff_size: formData.get("staff_size") || undefined,
    website: formData.get("website") || undefined,
    contact_person: formData.get("contact_person") || undefined,
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone") || undefined,
    address: formData.get("address") || undefined,
    intro: formData.get("intro") || undefined,
    strengths: formData.get("strengths") || undefined,
    notable_clients: formData.get("notable_clients") || undefined,
    categories: formData.getAll("categories"),
    privacy_consent: formData.get("privacy_consent") === "on",
  };

  const parsed = partnerApplicationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return { error: "입력값을 다시 확인해주세요.", fieldErrors };
  }

  const data = parsed.data;
  const supabase = await createClient();

  // RLS: partners_insert_anon 정책이 status='pending' AND user_id IS NULL인 경우 허용.
  const { data: inserted, error: insertError } = await supabase
    .from("partners")
    .insert({
      company_name: data.company_name,
      biz_reg_no: normalizeBizRegNo(data.biz_reg_no),
      representative: data.representative ?? null,
      established_year: data.established_year ?? null,
      staff_size: data.staff_size ?? null,
      website: data.website || null,
      contact_person: data.contact_person ?? null,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone ?? null,
      address: data.address ?? null,
      intro: data.intro ?? null,
      strengths: splitCsv(data.strengths),
      notable_clients: splitCsv(data.notable_clients),
      status: "pending",
      user_id: null,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !inserted) {
    if (insertError?.code === "23505") {
      return {
        error:
          "이미 등록 신청된 사업자등록번호입니다. 운영자에게 문의해주세요.",
      };
    }
    return {
      error:
        insertError?.message ??
        "등록 신청 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  if (data.categories.length > 0) {
    const { error: catError } = await supabase
      .from("partner_categories")
      .insert(
        data.categories.map((category) => ({
          partner_id: inserted.id,
          category,
        })),
      );

    if (catError) {
      // 카테고리 실패는 치명적이지 않음 — 운영자가 어드민에서 수동 보완 가능.
      // 그러나 사용자에게는 알려야 함.
      return {
        error:
          "등록은 접수됐지만 카테고리 저장에 실패했습니다. 운영자에게 문의해주세요.",
      };
    }
  }

  redirect("/partner/apply/success");
}
