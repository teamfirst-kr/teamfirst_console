"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { partnerApprovedEmail } from "@/lib/email/templates";

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
    .select("id, company_name, contact_email, user_id, biz_reg_no")
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

    // 초기 비밀번호 = 사업자등록번호(숫자만). 없으면 임시 난수.
    const bizDigits = (p.biz_reg_no ?? "").replace(/\D/g, "");
    const password = bizDigits.length >= 8 ? bizDigits : randomPassword();
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
