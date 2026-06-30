"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { roleHome, type Role } from "@/lib/auth";

export type ChangePwState = { error: string } | null;

export async function changePasswordAction(
  _prev: ChangePwState,
  formData: FormData,
): Promise<ChangePwState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "새 비밀번호는 8자 이상이어야 합니다." };
  }
  if (password !== confirm) {
    return { error: "비밀번호 확인이 일치하지 않습니다." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // 광고주는 초기 비밀번호가 사업자등록번호이므로, 동일 값 재사용을 방지.
  // (대행사 계정은 user_metadata.biz_reg_no가 없어 이 검사는 자동으로 건너뜀)
  const bizRegNo = String(user.user_metadata?.biz_reg_no ?? "").replace(
    /\D/g,
    "",
  );
  if (bizRegNo && password.replace(/\D/g, "") === bizRegNo) {
    return { error: "초기 비밀번호(사업자등록번호)와 다른 비밀번호를 설정해주세요." };
  }

  const { error: pwError } = await supabase.auth.updateUser({ password });
  if (pwError) {
    return { error: pwError.message };
  }

  // must_change_password 플래그 해제 (app_metadata는 service_role로만 수정 가능)
  const admin = createAdminClient();
  const nextAppMeta = { ...user.app_metadata, must_change_password: false };
  await admin.auth.admin.updateUserById(user.id, {
    app_metadata: nextAppMeta,
  });

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Role }>();

  revalidatePath("/", "layout");
  redirect(roleHome(data?.role ?? null));
}
