"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}${"*".repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

export type FindIdState =
  | { ok: true; email: string }
  | { ok: false; error: string }
  | null;

// 아이디(이메일) 찾기 — 사업자등록번호로 조회 (clients/partners 양쪽).
export async function findIdAction(
  _prev: FindIdState,
  formData: FormData,
): Promise<FindIdState> {
  const bizDigits = String(formData.get("biz_reg_no") ?? "").replace(/\D/g, "");
  if (bizDigits.length !== 10) {
    return { ok: false, error: "사업자등록번호 10자리를 입력해주세요." };
  }

  const admin = createAdminClient();

  // 광고주
  const { data: client } = await admin
    .from("clients")
    .select("user_id")
    .eq("biz_reg_no", bizDigits)
    .maybeSingle();
  let userId = client?.user_id ?? null;

  // 대행사
  if (!userId) {
    const { data: partner } = await admin
      .from("partners")
      .select("user_id, biz_reg_no")
      .eq("biz_reg_no", bizDigits)
      .maybeSingle();
    userId = partner?.user_id ?? null;
  }

  if (!userId) {
    return {
      ok: false,
      error: "해당 사업자등록번호로 등록된 계정을 찾을 수 없습니다.",
    };
  }

  const { data: user } = await admin
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (!user?.email) {
    return { ok: false, error: "계정 정보를 찾을 수 없습니다." };
  }

  return { ok: true, email: maskEmail(user.email) };
}

export type ResetPwState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

// 비밀번호 재설정 메일 발송 (Supabase Auth 복구 메일).
export async function requestPasswordResetAction(
  _prev: ResetPwState,
  formData: FormData,
): Promise<ResetPwState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { ok: false, error: "이메일을 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/reset-password`,
  });

  // 보안상 계정 존재 여부를 노출하지 않음 — 항상 동일 안내
  if (error) {
    console.error("[reset-password]", error.message);
  }
  return {
    ok: true,
    message:
      "입력하신 이메일로 가입된 계정이 있다면 비밀번호 재설정 링크를 보내드렸습니다. 메일함을 확인해주세요.",
  };
}
