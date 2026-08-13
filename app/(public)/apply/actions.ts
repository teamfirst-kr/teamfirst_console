"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sanitizeFileName,
  validateUploadFile,
  MAX_FILE_SIZE,
} from "@/lib/schemas/partner-application";
import { notifyAdmins } from "@/lib/email/admin-alert";
import { sendPbEmail } from "@/lib/email/pb";
import { pbApplicationReceivedEmail } from "@/lib/email/templates";
import { paybackApplicationSchema } from "@/lib/schemas/payback-application";
import type { Json } from "@/types/database";

export type PbApplyState =
  | { error: string; fieldErrors?: Record<string, string[]> }
  | null;

// 베스트에포트 rate limit (서버리스 인스턴스 단위, 외부 서비스 불필요 — 스펙 §6.1)
const recentByIp = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (recentByIp.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (list.length >= 5) return true;
  list.push(now);
  recentByIp.set(ip, list);
  return false;
}

export async function submitPaybackApplication(
  _prev: PbApplyState,
  formData: FormData,
): Promise<PbApplyState> {
  // 허니팟: 봇이 채우는 숨김 필드 — 채워져 있으면 조용히 성공 처리
  if (String(formData.get("website_url") ?? "").trim() !== "") {
    redirect("/apply/success");
  }
  // 최소 작성 시간 3초 (봇 방어)
  const startedAt = Number(formData.get("started_at") ?? 0);
  if (startedAt > 0 && Date.now() - startedAt < 3000) {
    return { error: "잠시 후 다시 시도해주세요." };
  }
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return { error: "요청이 너무 잦습니다. 잠시 후 다시 시도해주세요." };
  }

  // 매체 계정 (동적 행)
  const medias = formData.getAll("media[]").map(String);
  const accountIds = formData.getAll("account_id[]").map(String);
  const media_accounts = medias
    .map((m, i) => ({ media: m, account_id: (accountIds[i] ?? "").trim() }))
    .filter((r) => r.account_id !== "");

  const budgetRaw = String(formData.get("expected_budget") ?? "").replace(/\D/g, "");

  const parsed = paybackApplicationSchema.safeParse({
    company_name: String(formData.get("company_name") ?? "").trim(),
    business_number: String(formData.get("business_number") ?? ""),
    ceo_name: String(formData.get("ceo_name") ?? "").trim(),
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    contact_phone: String(formData.get("contact_phone") ?? "").trim(),
    expected_budget: budgetRaw ? Number(budgetRaw) : null,
    opt_all_solutions: formData.get("opt_all_solutions") === "on",
    opt_consulting: formData.get("opt_consulting") === "on",
    bank_name: String(formData.get("bank_name") ?? "").trim(),
    bank_account: String(formData.get("bank_account") ?? "").trim(),
    bank_holder: String(formData.get("bank_holder") ?? "").trim(),
    invoice_capable: formData.get("invoice_capable") !== "no",
    invoice_email: String(formData.get("invoice_email") ?? "").trim(),
    agreed_invoice: formData.get("agreed_invoice") === "on",
    solution_login_id: String(formData.get("solution_login_id") ?? "").trim(),
    solution_login_pw: String(formData.get("solution_login_pw") ?? ""),
    media_accounts,
    agreed: formData.get("agreed") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() || "_form";
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return { error: "입력값을 다시 확인해주세요.", fieldErrors };
  }
  const data = parsed.data;

  // 사업자등록증 첨부 (필수 — 세금계산서 발행 검증용)
  const licenseFile = formData.get("business_license");
  if (!(licenseFile instanceof File) || licenseFile.size === 0) {
    return {
      error: "사업자등록증을 첨부해주세요. (필수)",
      fieldErrors: { business_license: ["사업자등록증 첨부는 필수입니다."] },
    };
  }
  if (licenseFile.size > MAX_FILE_SIZE) {
    return { error: "사업자등록증 파일은 10MB 이하여야 합니다." };
  }
  const licenseError = validateUploadFile(licenseFile);
  if (licenseError) return { error: licenseError };

  // 계산서 발행 가능 사업자: 발행 이메일 + 발행 의무 이해 확인 필수
  const invoiceCapable = formData.get("invoice_capable") !== "no";
  if (invoiceCapable) {
    if (!String(formData.get("invoice_email") ?? "").trim()) {
      return {
        error: "세금계산서 발행 이메일을 입력해주세요. (필수)",
        fieldErrors: { invoice_email: ["계산서 발행 이메일은 필수입니다."] },
      };
    }
    if (formData.get("agreed_invoice") !== "on") {
      return {
        error: "세금계산서 발행 의무 안내를 확인하고 동의해주세요.",
        fieldErrors: { agreed_invoice: ["발행 의무 이해 확인이 필요합니다."] },
      };
    }
  }

  // 컨설팅 자격 (D3): 예상 광고비 700만 미만이면 서버에서도 거부
  if (data.opt_consulting && (data.expected_budget ?? 0) < 7_000_000) {
    return {
      error: "주간/월간 전문가 컨설팅 옵션은 월 광고비 700만 원 이상 구간에서 선택 가능합니다.",
      fieldErrors: { opt_consulting: ["700만 원 이상 구간 전용 옵션입니다."] },
    };
  }

  const supabase = await createClient();

  // 중복 안내 (D15): 기존 신청/고객사에 같은 사업자번호 존재 여부
  const [{ data: dupApp }, { data: dupClient }] = await Promise.all([
    supabase
      .from("pb_applications")
      .select("id")
      .eq("business_number", data.business_number)
      .in("status", ["received", "reviewing", "agreement_sent"])
      .limit(1),
    supabase
      .from("pb_clients")
      .select("id")
      .eq("business_number", data.business_number)
      .limit(1),
  ]);
  if ((dupApp && dupApp.length > 0) || (dupClient && dupClient.length > 0)) {
    return {
      error:
        "이미 접수되었거나 등록된 사업자번호입니다. 진행 상황은 담당자 메일로 안내드리며, 문의는 team1st2025@gmail.com 으로 부탁드립니다.",
      fieldErrors: { business_number: ["이미 접수된 사업자번호입니다."] },
    };
  }

  // 사업자등록증 업로드 (private 버킷, service_role)
  const admin = createAdminClient();
  const licensePath = `applications/${Date.now()}_${crypto.randomUUID().slice(0, 8)}/${sanitizeFileName(licenseFile.name)}`;
  const { error: uploadError } = await admin.storage
    .from("pb-files")
    .upload(licensePath, licenseFile, {
      upsert: false,
      contentType: licenseFile.type || undefined,
    });
  if (uploadError) {
    return { error: `사업자등록증 업로드 실패: ${uploadError.message}` };
  }

  const { error: insertError } = await supabase.from("pb_applications").insert({
    business_license: { name: licenseFile.name, path: licensePath } as unknown as Json,
    invoice_email: data.invoice_email || null,
    agreed_invoice_at:
      data.invoice_capable && data.agreed_invoice ? new Date().toISOString() : null,
    company_name: data.company_name,
    business_number: data.business_number,
    ceo_name: data.ceo_name || null,
    contact_name: data.contact_name,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone,
    media_accounts: data.media_accounts as unknown as Json,
    expected_budget: data.expected_budget,
    opt_all_solutions: data.opt_all_solutions,
    opt_consulting: data.opt_consulting,
    bank_name: data.bank_name || null,
    bank_account: data.bank_account || null,
    bank_holder: data.bank_holder || null,
    invoice_capable: data.invoice_capable,
    solution_login_id: data.solution_login_id || null,
    solution_login_pw: data.solution_login_pw || null,
    agreed_terms_at: new Date().toISOString(),
    status: "received",
  });
  if (insertError) {
    // 고아 파일 정리
    await admin.storage.from("pb-files").remove([licensePath]);
    return { error: `접수 중 오류가 발생했습니다: ${insertError.message}` };
  }

  // E1: 접수 확인 (광고주)
  const mail = pbApplicationReceivedEmail({
    companyName: data.company_name,
    contactName: data.contact_name,
  });
  await sendPbEmail({
    to: data.contact_email,
    type: "E1",
    ...mail,
    payload: { business_number: data.business_number } as unknown as Json,
  });

  // E9: 관리자 알림 (메일 + 인앱)
  await notifyAdmins({
    type: "pb_apply",
    title: "새 페이백 신청",
    rows: [
      ["회사명", data.company_name],
      ["사업자번호", data.business_number],
      ["담당자", `${data.contact_name} (${data.contact_email})`],
      [
        "월 예상 광고비",
        data.expected_budget ? `${data.expected_budget.toLocaleString()}원` : "미입력",
      ],
      [
        "옵션",
        [
          data.opt_all_solutions ? "솔루션 전체" : null,
          data.opt_consulting ? "컨설팅" : null,
        ]
          .filter(Boolean)
          .join(", ") || "없음",
      ],
    ],
    link: "/admin/payback",
    linkLabel: "신청 검토하기",
  });

  redirect("/apply/success");
}
