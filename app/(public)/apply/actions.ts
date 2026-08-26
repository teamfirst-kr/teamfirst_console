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

// 신청 실패/차단 지점 서버 로그 (PII 없이) — 유실 원인 추적용
async function logApplyIssue(
  reason: string,
  diff: Record<string, unknown>,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("pb_audit_logs").insert({
      actor_id: null,
      action: `application.${reason}`,
      entity: "pb_applications",
      entity_id: null,
      diff: diff as unknown as Json,
    });
  } catch {
    // 로그 실패 무시
  }
}

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
  // 허니팟: 봇이 채우는 숨김 필드 — 채워져 있으면 조용히 성공 처리.
  // (필드명은 자동완성이 채우지 않도록 무의미한 이름 사용 — 과거 website_url은
  //  브라우저 자동완성이 채워 실사용자 신청이 유실될 수 있어 교체)
  if (String(formData.get("hp_field_x9") ?? "").trim() !== "") {
    await logApplyIssue("honeypot", {});
    redirect("/apply/success");
  }
  // 최소 작성 시간 3초 (봇 방어)
  const startedAt = Number(formData.get("started_at") ?? 0);
  if (startedAt > 0 && Date.now() - startedAt < 3000) {
    await logApplyIssue("too_fast", { elapsed_ms: Date.now() - startedAt });
    return { error: "잠시 후 다시 시도해주세요." };
  }
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    await logApplyIssue("rate_limited", {});
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
    contact_name: String(formData.get("contact_name") ?? "").trim(),
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    contact_phone: String(formData.get("contact_phone") ?? "").trim(),
    expected_budget: budgetRaw ? Number(budgetRaw) : null,
    opt_all_solutions: formData.get("opt_all_solutions") === "on",
    opt_consulting: formData.get("opt_consulting") === "on",
    media_accounts,
  });

  if (!parsed.success) {
    await logApplyIssue("validation_failed", {
      fields: parsed.error.issues.map((i) => i.path[0]?.toString() || "_form"),
    });
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() || "_form";
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return { error: "입력값을 다시 확인해주세요.", fieldErrors };
  }
  const data = parsed.data;

  // 사업자등록증: 첨부 또는 '추후 제출'(접수 메일 회신으로 수집)
  const licenseLater = formData.get("license_later") === "on";
  const licenseFile = formData.get("business_license");
  const hasLicenseFile = licenseFile instanceof File && licenseFile.size > 0;
  if (!licenseLater) {
    if (!hasLicenseFile) {
      return {
        error: "사업자등록증을 첨부하거나 '추후 제출'을 선택해주세요.",
        fieldErrors: { business_license: ["첨부 또는 추후 제출을 선택해주세요."] },
      };
    }
    if (licenseFile.size > MAX_FILE_SIZE) {
      return { error: "사업자등록증 파일은 10MB 이하여야 합니다." };
    }
    const licenseError = validateUploadFile(licenseFile);
    if (licenseError) return { error: licenseError };
  }

  const supabase = await createClient();

  // 컨설팅 자격 (D3): 게시 요율표 기준 최소 광고비 미만이면 서버에서도 거부
  if (data.opt_consulting) {
    const { data: rt } = await supabase
      .from("pb_rate_tables")
      .select("consulting_min_spend")
      .eq("published", true)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();
    const minSpend = rt?.consulting_min_spend ?? 5_000_000;
    if ((data.expected_budget ?? 0) < minSpend) {
      const label = `${Math.floor(minSpend / 10_000).toLocaleString("ko-KR")}만`;
      return {
        error: `월간 전문가 컨설팅 옵션은 월 광고비 ${label} 원 이상 구간에서 선택 가능합니다.`,
        fieldErrors: { opt_consulting: [`${label} 원 이상 구간 전용 옵션입니다.`] },
      };
    }
  }

  // 중복 안내 (D15): 진행 중 신청/기존 고객사에 같은 담당자 이메일 존재 여부
  // (사업자번호는 등록증으로 대체 수집되어 접수 시점에는 이메일로 판별)
  const [{ data: dupApp }, { data: dupClient }] = await Promise.all([
    supabase
      .from("pb_applications")
      .select("id")
      .eq("contact_email", data.contact_email)
      .in("status", ["received", "reviewing", "agreement_sent"])
      .limit(1),
    supabase
      .from("pb_clients")
      .select("id")
      .eq("contact_email", data.contact_email)
      .limit(1),
  ]);
  if ((dupApp && dupApp.length > 0) || (dupClient && dupClient.length > 0)) {
    await logApplyIssue("duplicate_contact", {});
    return {
      error:
        "이미 접수 중이거나 등록된 담당자 이메일입니다. 진행 상황은 담당자 메일로 안내드리며, 문의는 team1st2025@gmail.com 으로 부탁드립니다.",
      fieldErrors: { contact_email: ["이미 접수된 이메일입니다."] },
    };
  }

  // 사업자등록증 업로드 (private 버킷, service_role) — 추후 제출이면 생략
  const admin = createAdminClient();
  let licenseMeta: { name: string; path: string } | null = null;
  if (!licenseLater && hasLicenseFile) {
    const file = licenseFile as File;
    const licensePath = `applications/${Date.now()}_${crypto.randomUUID().slice(0, 8)}/${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await admin.storage
      .from("pb-files")
      .upload(licensePath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
    if (uploadError) {
      await logApplyIssue("license_upload_failed", { message: uploadError.message });
      return { error: `사업자등록증 업로드 실패: ${uploadError.message}` };
    }
    licenseMeta = { name: file.name, path: licensePath };
  }

  // 경량 접수(021): 사업자번호·대표자는 등록증으로 대체, 계산서 이메일·계좌·
  // 솔루션 계정은 추가 정보 페이지(022 토큰 링크) 또는 메일 회신으로 후속 수집.
  // 토큰은 서버에서 생성해 INSERT (anon은 SELECT/RETURNING 불가 — RLS).
  let followupToken: string | null = crypto.randomUUID();
  const basePayload = {
    business_license: licenseMeta as unknown as Json,
    company_name: data.company_name,
    business_number: null,
    contact_name: data.contact_name,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone,
    media_accounts: data.media_accounts as unknown as Json,
    expected_budget: data.expected_budget,
    opt_all_solutions: data.opt_all_solutions,
    opt_consulting: data.opt_consulting,
    invoice_capable: true,
    status: "received" as const,
  };
  let { error: insertError } = await supabase
    .from("pb_applications")
    .insert({ ...basePayload, followup_token: followupToken });
  if (insertError && /followup_token/.test(insertError.message)) {
    // 022 마이그레이션 미실행 폴백 — 토큰 없이 접수 (E1은 회신 안내만)
    followupToken = null;
    ({ error: insertError } = await supabase.from("pb_applications").insert(basePayload));
  }
  if (insertError) {
    await logApplyIssue("insert_failed", { message: insertError.message });
    // 고아 파일 정리
    if (licenseMeta) await admin.storage.from("pb-files").remove([licenseMeta.path]);
    return { error: `접수 중 오류가 발생했습니다: ${insertError.message}` };
  }

  // E1: 접수 확인 + 추가 정보 회신 요청 (광고주)
  const mail = pbApplicationReceivedEmail({
    companyName: data.company_name,
    contactName: data.contact_name,
    licenseAttached: licenseMeta !== null,
    followupToken,
  });
  await sendPbEmail({ to: data.contact_email, type: "E1", ...mail });

  // E9: 관리자 알림 (메일 + 인앱)
  await notifyAdmins({
    type: "pb_apply",
    title: "새 페이백 신청",
    rows: [
      ["회사명", data.company_name],
      ["담당자", `${data.contact_name} (${data.contact_email})`],
      ["사업자등록증", licenseMeta ? "첨부됨" : "추후 제출 (메일 회신 대기)"],
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

  // 전환 추적: 접수 완료 = 구매 전환, 전환값 = 월 예상 광고비
  redirect(
    `/apply/success?v=${data.expected_budget ?? 0}${followupToken ? `&t=${followupToken}` : ""}`,
  );
}
