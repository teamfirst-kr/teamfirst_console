"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { roleHome, type Role } from "@/lib/auth";

export type AuthState = { error: string } | null;

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
  redirect(roleHome(data?.role ?? null));
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

  // 초기 비밀번호 = 사업자등록번호. 첫 로그인 시 변경 강제.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password: bizDigits,
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

  // 가입 직후 자동 로그인
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({ email, password: bizDigits });

  revalidatePath("/", "layout");
  redirect("/change-password");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
