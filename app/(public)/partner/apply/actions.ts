"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  MAX_PORTFOLIO_FILES,
  normalizeBizRegNo,
  partnerApplicationSchema,
  sanitizeFileName,
  splitCsv,
  validateUploadFile,
} from "@/lib/schemas/partner-application";
import type { Json } from "@/types/database";

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

  // 파일 추출 + 검증 (insert 전에 먼저 막아 불완전 데이터 방지)
  const bizRegFile = formData.get("biz_reg_file");
  const portfolioFiles = formData
    .getAll("portfolio_files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  const filesToCheck: File[] = [];
  if (bizRegFile instanceof File && bizRegFile.size > 0) {
    filesToCheck.push(bizRegFile);
  }
  filesToCheck.push(...portfolioFiles);

  if (portfolioFiles.length > MAX_PORTFOLIO_FILES) {
    return { error: `포트폴리오는 최대 ${MAX_PORTFOLIO_FILES}개까지 첨부할 수 있습니다.` };
  }
  for (const file of filesToCheck) {
    const fileError = validateUploadFile(file);
    if (fileError) return { error: fileError };
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

  // 파일 업로드: 익명 사용자이므로 service_role로 서버에서 처리.
  // 업로드 실패는 신청 자체를 무효화하지 않고 운영자가 별도 요청하도록 둔다.
  if (filesToCheck.length > 0) {
    const admin = createAdminClient();
    const portfolioItems: { name: string; path: string }[] = [];
    let bizRegPath: string | null = null;

    if (bizRegFile instanceof File && bizRegFile.size > 0) {
      const path = `${inserted.id}/biz-reg/${sanitizeFileName(bizRegFile.name)}`;
      const { error } = await admin.storage
        .from("partner-files")
        .upload(path, bizRegFile, { upsert: true, contentType: bizRegFile.type });
      if (!error) bizRegPath = path;
    }

    for (const file of portfolioFiles) {
      const path = `${inserted.id}/portfolio/${sanitizeFileName(file.name)}`;
      const { error } = await admin.storage
        .from("partner-files")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (!error) portfolioItems.push({ name: file.name, path });
    }

    const portfolio = {
      business_registration: bizRegPath,
      items: portfolioItems,
    } satisfies Record<string, Json>;

    await admin
      .from("partners")
      .update({ portfolio })
      .eq("id", inserted.id);
  }

  redirect("/partner/apply/success");
}
