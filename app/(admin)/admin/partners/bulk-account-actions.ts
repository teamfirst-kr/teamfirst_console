"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import {
  partnerApprovedEmail,
  partnerCredentialsResetEmail,
} from "@/lib/email/templates";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function randomPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

export type BulkIssueResult =
  | { ok: true; issued: number; failed: number; skipped: number; total: number }
  | { ok: false; error: string };

// 이미 contracted 이지만 로그인 계정(user_id)이 없는 파트너에게 일괄 계정 발급 + 안내 메일.
// CSV 임포트로 만든 파트너처럼 운영자 UI를 거치지 않은 케이스를 메우는 용도.
export async function issueAccountsForContracted(): Promise<BulkIssueResult> {
  const role = await getCurrentRole();
  if (role !== "admin") return { ok: false, error: "운영자 권한이 필요합니다." };

  const admin = createAdminClient();
  const { data: partners, error } = await admin
    .from("partners")
    .select("id, company_name, contact_email, user_id")
    .eq("status", "contracted")
    .is("user_id", null);

  if (error) return { ok: false, error: error.message };
  if (!partners || partners.length === 0) {
    return { ok: true, issued: 0, failed: 0, skipped: 0, total: 0 };
  }

  let issued = 0;
  let failed = 0;
  let skipped = 0;

  for (const p of partners) {
    if (!p.contact_email) {
      skipped++;
      continue;
    }

    // 임시 비밀번호는 항상 난수로 발급 (특정 값을 비밀번호로 쓰지 않음).
    const password = randomPassword();
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: p.contact_email,
        password,
        email_confirm: true,
        user_metadata: { role: "partner", name: p.company_name },
        app_metadata: { role: "partner", must_change_password: true },
      });

    let userId = created?.user?.id ?? null;

    // 이미 auth 사용자가 있으면(이메일 중복) 기존 user_id를 찾아 연결
    if (createError || !userId) {
      const msg = createError?.message ?? "";
      if (msg.includes("already") || msg.includes("registered")) {
        const { data: existing } = await admin
          .from("users")
          .select("id")
          .eq("email", p.contact_email)
          .maybeSingle();
        if (existing?.id) {
          userId = existing.id;
        } else {
          failed++;
          continue;
        }
      } else {
        failed++;
        continue;
      }
    }

    await admin
      .from("users")
      .update({ role: "partner", name: p.company_name })
      .eq("id", userId);

    const { error: linkError } = await admin
      .from("partners")
      .update({ user_id: userId })
      .eq("id", p.id);

    if (linkError) {
      failed++;
      continue;
    }

    // 새로 만든 경우에만 임시 비번 안내 메일 발송 (기존 계정 재연결은 메일 보내지 않음)
    if (created?.user?.id) {
      const mail = partnerApprovedEmail({
        companyName: p.company_name,
        email: p.contact_email,
        tempPassword: password,
        loginUrl: `${appUrl()}/login`,
      });
      await sendEmail({ to: p.contact_email, ...mail });
    }
    issued++;
  }

  revalidatePath("/admin/partners");
  return { ok: true, issued, failed, skipped, total: partners.length };
}

export type BulkResendResult =
  | { ok: true; sent: number; failed: number; skipped: number; total: number }
  | { ok: false; error: string };

// 이미 계정이 발급된 입점 완료 대행사 전원에게 임시 비밀번호를 재발급하고
// 정정 안내 메일을 일괄 재발송한다. (기존 안내 메일의 비밀번호 표기 정정용)
// 기존 임시 비밀번호는 저장돼 있지 않으므로, 안전하게 새 난수로 재설정 후 안내한다.
export async function resendCredentialsForContracted(): Promise<BulkResendResult> {
  const role = await getCurrentRole();
  if (role !== "admin") return { ok: false, error: "운영자 권한이 필요합니다." };

  const admin = createAdminClient();
  const { data: partners, error } = await admin
    .from("partners")
    .select("id, company_name, contact_email, user_id")
    .eq("status", "contracted")
    .not("user_id", "is", null);

  if (error) return { ok: false, error: error.message };
  if (!partners || partners.length === 0) {
    return { ok: true, sent: 0, failed: 0, skipped: 0, total: 0 };
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  // 같은 로그인 계정(user_id)을 공유하는 계열사 행은 한 번만 처리한다.
  const handled = new Set<string>();

  for (const p of partners) {
    if (!p.user_id || !p.contact_email) {
      skipped++;
      continue;
    }
    if (handled.has(p.user_id)) {
      skipped++;
      continue;
    }
    handled.add(p.user_id);

    const password = randomPassword();
    // 기존 app_metadata(provider 등)를 보존하고 must_change_password만 다시 켠다.
    const { data: fetched } = await admin.auth.admin.getUserById(p.user_id);
    const baseMeta = fetched?.user?.app_metadata ?? {};
    const { error: resetError } = await admin.auth.admin.updateUserById(
      p.user_id,
      {
        password,
        app_metadata: {
          ...baseMeta,
          role: "partner",
          must_change_password: true,
        },
      },
    );
    if (resetError) {
      failed++;
      continue;
    }

    const mail = partnerCredentialsResetEmail({
      companyName: p.company_name,
      email: p.contact_email,
      tempPassword: password,
      loginUrl: `${appUrl()}/login`,
    });
    const result = await sendEmail({ to: p.contact_email, ...mail });
    if (result.ok) {
      sent++;
    } else {
      failed++;
    }
  }

  revalidatePath("/admin/partners");
  return { ok: true, sent, failed, skipped, total: partners.length };
}
