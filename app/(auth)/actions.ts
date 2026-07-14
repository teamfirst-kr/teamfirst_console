"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins } from "@/lib/email/admin-alert";
import { roleHome, type Role } from "@/lib/auth";

export type AuthState = { error: string } | null;

// 가입 시 사용자가 알 필요 없는 1회용 임시 비밀번호(사업자번호 등 추측 가능한 값 사용 금지).
// 가입 직후 자동 로그인 → 비밀번호 변경 화면에서 본인이 직접 설정한다.
function randomPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

// 오픈 리다이렉트 방지: 내부 절대경로(/...)만 허용.
function safeNextPath(next: string): string | null {
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return null;
}

// "로그인 유지" 미체크 시 supabase 인증 쿠키를 세션 쿠키(브라우저 종료 시 만료)로 전환.
async function makeAuthCookiesSessionOnly() {
  const store = await cookies();
  for (const c of store.getAll()) {
    if (c.name.startsWith("sb-")) {
      store.set(c.name, c.value, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        // maxAge/expires 미지정 → 세션 쿠키
      });
    }
  }
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") != null;
  const nextPath = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!remember) {
    await makeAuthCookiesSessionOnly();
  }

  // 첫 로그인(초기 비밀번호) → 비밀번호 변경 화면으로
  if (user?.app_metadata?.must_change_password) {
    revalidatePath("/", "layout");
    redirect("/change-password");
  }

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single<{ role: Role }>();

  revalidatePath("/", "layout");
  // next가 있으면 원래 경로로 복귀(권한 불일치 시 requireRole이 다시 안전경로로 보냄).
  redirect(nextPath ?? roleHome(data?.role ?? null));
}

export async function signupClientAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const bizRegNoRaw = String(formData.get("biz_reg_no") ?? "").trim();
  const bizDigits = bizRegNoRaw.replace(/\D/g, "");

  if (!email || !name || !company || !bizDigits) {
    return { error: "모든 항목을 입력해주세요." };
  }
  if (bizDigits.length !== 10) {
    return { error: "사업자등록번호는 숫자 10자리로 입력해주세요." };
  }

  // 임시 비밀번호는 추측 불가한 난수로 발급. 가입 직후 자동 로그인 후
  // 비밀번호 변경 화면에서 본인이 직접 설정한다. (사업자번호를 비밀번호로 쓰지 않음)
  const tempPassword = randomPassword();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      role: "client",
      name,
      company_name: company,
      biz_reg_no: bizDigits,
    },
    app_metadata: { role: "client", must_change_password: true },
  });

  if (error) {
    if (error.message.includes("already") || error.message.includes("registered")) {
      return { error: "이미 가입된 이메일입니다. 로그인해주세요." };
    }
    return { error: error.message };
  }

  // 운영자 필수 알림: 새 광고주 가입 (메일 + 인앱)
  await notifyAdmins({
    type: "signup",
    title: "새 광고주 가입",
    rows: [
      ["회사명", company],
      ["담당자", name],
      ["이메일", email],
    ],
    link: "/admin/dashboard",
    linkLabel: "콘솔에서 확인",
  });

  // 가입 직후 자동 로그인 (방금 발급한 임시 비밀번호 사용)
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password: tempPassword });

  revalidatePath("/", "layout");
  redirect("/change-password");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
