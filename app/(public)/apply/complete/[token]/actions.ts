"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  sanitizeFileName,
  validateUploadFile,
  MAX_FILE_SIZE,
} from "@/lib/schemas/partner-application";
import { notifyAdmins } from "@/lib/email/admin-alert";
import type { Json } from "@/types/database";

export type FollowupState = { ok: true } | { ok: false; error: string } | null;

const EDITABLE_STATUSES = ["received", "reviewing", "agreement_sent"];

// 추가 정보 제출: 토큰으로 신청 건을 찾아 등록증/계산서 이메일/계좌/솔루션 ID 저장
export async function submitApplyFollowup(
  _prev: FollowupState,
  formData: FormData,
): Promise<FollowupState> {
  const token = String(formData.get("token") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    return { ok: false, error: "잘못된 링크입니다." };
  }

  const admin = createAdminClient();
  const { data: app } = await admin
    .from("pb_applications")
    .select("id, company_name, contact_name, business_license, status")
    .eq("followup_token", token)
    .maybeSingle();
  if (!app) return { ok: false, error: "신청 정보를 찾을 수 없습니다. 링크를 다시 확인해주세요." };
  if (!EDITABLE_STATUSES.includes(app.status)) {
    return { ok: false, error: "이미 처리 완료된 신청입니다. 변경이 필요하면 메일로 회신해주세요." };
  }

  const hasExistingLicense = !!(app.business_license as { path?: string } | null)?.path;

  // 사업자등록증 (기존 미첨부면 필수)
  const licenseFile = formData.get("business_license");
  const hasNewFile = licenseFile instanceof File && licenseFile.size > 0;
  if (!hasExistingLicense && !hasNewFile) {
    return { ok: false, error: "사업자등록증을 첨부해주세요. (필수)" };
  }
  let licenseMeta: { name: string; path: string } | null = null;
  if (hasNewFile) {
    const file = licenseFile as File;
    if (file.size > MAX_FILE_SIZE) {
      return { ok: false, error: "사업자등록증 파일은 10MB 이하여야 합니다." };
    }
    const fileError = validateUploadFile(file);
    if (fileError) return { ok: false, error: fileError };
    const path = `applications/${Date.now()}_${crypto.randomUUID().slice(0, 8)}/${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await admin.storage
      .from("pb-files")
      .upload(path, file, { upsert: false, contentType: file.type || undefined });
    if (uploadError) {
      return { ok: false, error: `파일 업로드 실패: ${uploadError.message}` };
    }
    licenseMeta = { name: file.name, path };
  }

  const invoiceEmail = String(formData.get("invoice_email") ?? "").trim().slice(0, 100);
  if (invoiceEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoiceEmail)) {
    return { ok: false, error: "계산서 발행 이메일 형식을 확인해주세요." };
  }
  const bankName = String(formData.get("bank_name") ?? "").trim().slice(0, 30);
  const bankAccount = String(formData.get("bank_account") ?? "")
    .replace(/[^\d-]/g, "")
    .slice(0, 40);
  const bankHolder = String(formData.get("bank_holder") ?? "").trim().slice(0, 50);
  const solutionId = String(formData.get("solution_login_id") ?? "").trim().slice(0, 30);
  if (solutionId && !/^[A-Za-z0-9_.-]+$/.test(solutionId)) {
    return { ok: false, error: "솔루션 ID는 영문·숫자·-_. 만 사용할 수 있습니다." };
  }

  const patch = {
    followup_submitted_at: new Date().toISOString(),
    ...(licenseMeta ? { business_license: licenseMeta as unknown as Json } : {}),
    ...(invoiceEmail ? { invoice_email: invoiceEmail } : {}),
    ...(bankName ? { bank_name: bankName } : {}),
    ...(bankAccount ? { bank_account: bankAccount } : {}),
    ...(bankHolder ? { bank_holder: bankHolder } : {}),
    ...(solutionId ? { solution_login_id: solutionId } : {}),
  };

  const { error: updateError } = await admin
    .from("pb_applications")
    .update(patch)
    .eq("id", app.id);
  if (updateError) {
    if (licenseMeta) await admin.storage.from("pb-files").remove([licenseMeta.path]);
    return { ok: false, error: `저장 중 오류가 발생했습니다: ${updateError.message}` };
  }

  await notifyAdmins({
    type: "pb_apply",
    title: "페이백 신청 추가 정보 접수",
    rows: [
      ["회사명", app.company_name],
      ["담당자", app.contact_name],
      ["사업자등록증", licenseMeta ? "새로 첨부됨" : hasExistingLicense ? "기존 첨부" : "미첨부"],
      ["계산서 이메일", invoiceEmail || "미입력"],
      ["입금 계좌", bankName ? `${bankName} ${bankAccount} (${bankHolder})` : "미입력"],
    ],
    link: "/admin/payback",
    linkLabel: "신청 확인하기",
  });

  return { ok: true };
}
