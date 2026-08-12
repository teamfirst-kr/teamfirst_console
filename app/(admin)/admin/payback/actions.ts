"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { sendPbEmail } from "@/lib/email/pb";
import { pbAgreementSentEmail } from "@/lib/email/templates";
import type { Json } from "@/types/database";

export type PbActionResult =
  | { ok: true; message?: string; tempPassword?: string; email?: string }
  | { ok: false; error: string };

function randomPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

async function assertAdmin(): Promise<string | null> {
  const role = await getCurrentRole();
  return role === "admin" ? null : "운영자 권한이 필요합니다.";
}

// 상태 전환 전부 audit_logs 기록 (하드 룰 4)
async function pbAudit(
  action: string,
  entity: string,
  entityId: string,
  diff: Record<string, unknown>,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await admin.from("pb_audit_logs").insert({
      actor_id: user?.id ?? null,
      action,
      entity,
      entity_id: entityId,
      diff: diff as unknown as Json,
    });
  } catch (e) {
    console.error("[pb-audit] 기록 실패:", e);
  }
}

function revalidate() {
  revalidatePath("/admin/payback");
}

// ── 신청(application) 단계 ──────────────────────────────────────────

export async function pbStartReview(applicationId: string): Promise<PbActionResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  const admin = createAdminClient();
  const { error } = await admin
    .from("pb_applications")
    .update({ status: "reviewing" })
    .eq("id", applicationId)
    .eq("status", "received");
  if (error) return { ok: false, error: error.message };
  await pbAudit("application.review", "pb_applications", applicationId, {
    status: "received→reviewing",
  });
  revalidate();
  return { ok: true };
}

export async function pbRejectApplication(
  applicationId: string,
  reason: string,
): Promise<PbActionResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  if (!reason.trim()) return { ok: false, error: "반려 사유를 입력해주세요." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("pb_applications")
    .update({ status: "rejected", memo: reason.trim() })
    .eq("id", applicationId);
  if (error) return { ok: false, error: error.message };
  await pbAudit("application.reject", "pb_applications", applicationId, { reason });
  revalidate();
  return { ok: true };
}

// 약정 발송 = 고객사 전환: pb_client + 매체계정 + 약정(요율표 스냅샷) 생성 (E2 발송)
export async function pbConvertAndSendAgreement(
  applicationId: string,
  glosignUrl: string,
): Promise<PbActionResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  if (!glosignUrl.trim().startsWith("http")) {
    return { ok: false, error: "글로싸인 URL을 입력해주세요." };
  }
  const admin = createAdminClient();

  const { data: app } = await admin
    .from("pb_applications")
    .select("*")
    .eq("id", applicationId)
    .single();
  if (!app) return { ok: false, error: "신청을 찾을 수 없습니다." };
  if (!["received", "reviewing"].includes(app.status)) {
    return { ok: false, error: "이미 처리된 신청입니다." };
  }

  // 최신 게시 요율표 스냅샷 (D13)
  const { data: rateTable } = await admin
    .from("pb_rate_tables")
    .select("id, version")
    .eq("published", true)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!rateTable) return { ok: false, error: "게시된 요율표가 없습니다." };

  const { data: client, error: clientError } = await admin
    .from("pb_clients")
    .insert({
      company_name: app.company_name,
      business_number: app.business_number,
      ceo_name: app.ceo_name,
      contact_name: app.contact_name,
      contact_email: app.contact_email,
      contact_phone: app.contact_phone,
      invoice_capable: app.invoice_capable,
      bank_name: app.bank_name,
      bank_account: app.bank_account,
      bank_holder: app.bank_holder,
      solution_login_id: app.solution_login_id,
      solution_login_pw: app.solution_login_pw,
      status: "agreement_sent",
    })
    .select("id")
    .single();
  if (clientError || !client) {
    return { ok: false, error: clientError?.message ?? "고객사 생성 실패" };
  }

  const mediaRows = (app.media_accounts as { media: string; account_id: string }[]) ?? [];
  if (mediaRows.length > 0) {
    await admin.from("pb_media_accounts").insert(
      mediaRows.map((m) => ({
        client_id: client.id,
        media: m.media,
        account_id: m.account_id,
        transfer_status: "pending",
      })),
    );
  }

  const { error: agreementError } = await admin.from("pb_agreements").insert({
    client_id: client.id,
    rate_table_id: rateTable.id,
    glosign_url: glosignUrl.trim(),
    all_solutions: app.opt_all_solutions,
    consulting: app.opt_consulting,
    status: "active",
  });
  if (agreementError) return { ok: false, error: agreementError.message };

  await admin
    .from("pb_applications")
    .update({ status: "converted" })
    .eq("id", applicationId);

  await pbAudit("client.create", "pb_clients", client.id, {
    from_application: applicationId,
    rate_table: rateTable.version,
    status: "agreement_sent",
  });

  // E2: 약정/온보딩 안내
  const mail = pbAgreementSentEmail({
    companyName: app.company_name,
    contactName: app.contact_name,
    glosignUrl: glosignUrl.trim(),
  });
  await sendPbEmail({ clientId: client.id, to: app.contact_email, type: "E2", ...mail });

  revalidate();
  return { ok: true, message: "약정 발송 처리 완료 (고객사로 전환됨)" };
}

// ── 고객사(client) 단계 ────────────────────────────────────────────

export async function pbMarkSigned(clientId: string): Promise<PbActionResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("pb_clients")
    .update({ status: "transferring", updated_at: now })
    .eq("id", clientId)
    .eq("status", "agreement_sent");
  if (error) return { ok: false, error: error.message };
  await admin
    .from("pb_agreements")
    .update({ signed_at: now })
    .eq("client_id", clientId)
    .is("signed_at", null);
  await pbAudit("client.signed", "pb_clients", clientId, {
    status: "agreement_sent→transferring",
  });
  revalidate();
  return { ok: true };
}

export async function pbSetMediaTransfer(
  mediaAccountId: string,
  status: "pending" | "in_progress" | "completed",
): Promise<PbActionResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  const admin = createAdminClient();
  const { error } = await admin
    .from("pb_media_accounts")
    .update({
      transfer_status: status,
      transferred_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", mediaAccountId);
  if (error) return { ok: false, error: error.message };
  await pbAudit("media.transfer", "pb_media_accounts", mediaAccountId, { status });
  revalidate();
  return { ok: true };
}

// 활성화: 전 매체 이관 완료 확인 → 계정 발급 + 엔타이틀먼트 + active (E3 발송)
export async function pbActivateClient(clientId: string): Promise<PbActionResult> {
  const guard = await assertAdmin();
  if (guard) return { ok: false, error: guard };
  const admin = createAdminClient();

  const { data: client } = await admin
    .from("pb_clients")
    .select("*")
    .eq("id", clientId)
    .single();
  if (!client) return { ok: false, error: "고객사를 찾을 수 없습니다." };
  if (client.status !== "transferring") {
    return { ok: false, error: "이관 진행 중 상태에서만 활성화할 수 있습니다." };
  }

  const { data: medias } = await admin
    .from("pb_media_accounts")
    .select("id, transfer_status")
    .eq("client_id", clientId);
  const incomplete = (medias ?? []).filter((m) => m.transfer_status !== "completed");
  if (incomplete.length > 0) {
    return {
      ok: false,
      error: `이관 미완료 매체가 ${incomplete.length}건 있습니다. 전 매체 이관 완료 후 활성화하세요.`,
    };
  }

  // 로그인 계정 발급 (리포 표준: 임시 비번 + 첫 로그인 변경 강제 — D-057 결정 4)
  let tempPassword: string | null = null;
  if (!client.user_id) {
    tempPassword = randomPassword();
    const { data: created, error: authError } = await admin.auth.admin.createUser({
      email: client.contact_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        role: "payback",
        name: client.contact_name,
        company_name: client.company_name,
      },
      app_metadata: { role: "payback", must_change_password: true },
    });
    if (authError || !created.user) {
      return {
        ok: false,
        error: `계정 생성 실패: ${authError?.message ?? "unknown"}`,
      };
    }
    // users 미러가 트리거로 생성되지 않았을 경우 대비
    await admin.from("users").upsert(
      {
        id: created.user.id,
        email: client.contact_email,
        role: "payback",
        name: client.contact_name ?? client.company_name,
      },
      { onConflict: "id" },
    );
    await admin
      .from("pb_clients")
      .update({ user_id: created.user.id })
      .eq("id", clientId);
  }

  // 엔타이틀먼트: 전체 옵션이면 4종, 아니면 기본 2종 (§12 기본값)
  const { data: agreement } = await admin
    .from("pb_agreements")
    .select("id, all_solutions")
    .eq("client_id", clientId)
    .eq("status", "active")
    .maybeSingle();
  const { data: solutions } = await admin
    .from("pb_solutions")
    .select("id, sort")
    .order("sort", { ascending: true });
  const grantCount = agreement?.all_solutions ? (solutions ?? []).length : 2;
  const grants = (solutions ?? []).slice(0, grantCount);
  if (grants.length > 0) {
    await admin.from("pb_entitlements").upsert(
      grants.map((s) => ({ client_id: clientId, solution_id: s.id, active: true })),
      { onConflict: "client_id,solution_id" },
    );
  }

  const { error } = await admin
    .from("pb_clients")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", clientId);
  if (error) return { ok: false, error: error.message };

  await pbAudit("client.activate", "pb_clients", clientId, {
    status: "transferring→active",
    entitlements: grants.length,
    account_issued: tempPassword !== null,
  });

  revalidate();
  return {
    ok: true,
    message: "활성화 완료",
    tempPassword: tempPassword ?? undefined,
    email: client.contact_email,
  };
}
