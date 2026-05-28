"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MAX_PORTFOLIO_FILES,
  partnerApplicationSchema,
  sanitizeFileName,
  validateUploadFile,
  type PartnerApplicationMeta,
} from "@/lib/schemas/partner-application";
import type { Json } from "@/types/database";

export type ApplyState =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | null;

function getAll(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(String);
}

export async function submitPartnerApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const raw = {
    company_name: formData.get("company_name"),
    contact_person: formData.get("contact_person"),
    contact_email: formData.get("contact_email"),
    contact_phone: formData.get("contact_phone"),
    website: formData.get("website") || undefined,
    specialty: formData.get("specialty") || undefined,
    staff_size: formData.get("staff_size") || undefined,
    intro: formData.get("intro") || undefined,
    categories: formData.getAll("categories"),
    budget_ranges: getAll(formData, "budget_ranges"),
    contract_periods: getAll(formData, "contract_periods"),
    performance_based: formData.get("performance_based") === "on",
    marketing_goals: getAll(formData, "marketing_goals"),
    kpis: getAll(formData, "kpis"),
    report_cycles: getAll(formData, "report_cycles"),
    meeting_cycles: getAll(formData, "meeting_cycles"),
    tools: getAll(formData, "tools"),
    preferred_client_traits: formData.get("preferred_client_traits") || undefined,
    avoided_client_traits: formData.get("avoided_client_traits") || undefined,
    payment_methods: getAll(formData, "payment_methods"),
    fee_agreement: formData.get("fee_agreement") === "on",
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

  // 파일 추출 + 검증
  const portfolioFiles = formData
    .getAll("portfolio_files")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (portfolioFiles.length > MAX_PORTFOLIO_FILES) {
    return { error: `포트폴리오는 최대 ${MAX_PORTFOLIO_FILES}개까지 첨부할 수 있습니다.` };
  }
  for (const file of portfolioFiles) {
    const fileError = validateUploadFile(file);
    if (fileError) return { error: fileError };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const application: PartnerApplicationMeta = {
    budget_ranges: data.budget_ranges ?? [],
    contract_periods: data.contract_periods ?? [],
    performance_based: data.performance_based ?? false,
    marketing_goals: data.marketing_goals ?? [],
    kpis: data.kpis ?? [],
    report_cycles: data.report_cycles ?? [],
    meeting_cycles: data.meeting_cycles ?? [],
    tools: data.tools ?? [],
    preferred_client_traits: data.preferred_client_traits ?? null,
    avoided_client_traits: data.avoided_client_traits ?? null,
    payment_methods: data.payment_methods ?? [],
    fee_agreement: data.fee_agreement,
  };

  // RLS: partners_insert_anon 정책이 status='pending' AND user_id IS NULL인 경우 허용.
  const { data: inserted, error: insertError } = await supabase
    .from("partners")
    .insert({
      company_name: data.company_name,
      contact_person: data.contact_person,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      website: data.website || null,
      specialty: data.specialty ?? null,
      staff_size: data.staff_size,
      intro: data.intro ?? null,
      application: application as unknown as Json,
      status: "pending",
      user_id: null,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !inserted) {
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
      return {
        error:
          "등록은 접수됐지만 매체 정보 저장에 실패했습니다. 운영자에게 문의해주세요.",
      };
    }
  }

  // 파일 업로드: 익명 사용자이므로 service_role로 서버에서 처리.
  if (portfolioFiles.length > 0) {
    const admin = createAdminClient();
    const portfolioItems: { name: string; path: string }[] = [];
    for (const file of portfolioFiles) {
      const path = `${inserted.id}/portfolio/${sanitizeFileName(file.name)}`;
      const { error } = await admin.storage
        .from("partner-files")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (!error) portfolioItems.push({ name: file.name, path });
    }
    await admin
      .from("partners")
      .update({
        portfolio: { items: portfolioItems } as unknown as Json,
      })
      .eq("id", inserted.id);
  }

  redirect("/partner/apply/success");
}
