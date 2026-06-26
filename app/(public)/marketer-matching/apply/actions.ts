"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type MarketerRequestState = { error: string } | null;

export async function submitMarketerRequest(
  _prev: MarketerRequestState,
  formData: FormData,
): Promise<MarketerRequestState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/marketer-matching/apply");
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .single<{ id: string }>();
  if (!client) {
    return { error: "광고주 프로필을 찾을 수 없습니다. 다시 로그인해주세요." };
  }

  const brand_name = String(formData.get("brand_name") ?? "").trim();
  const category = String(formData.get("category") ?? "performance");
  if (!brand_name) return { error: "브랜드명을 입력해주세요." };

  const { data: inserted, error } = await supabase
    .from("marketer_requests")
    .insert({
      client_id: client.id,
      brand_name,
      category,
      budget_range: String(formData.get("budget_range") ?? "").trim() || null,
      goal: String(formData.get("goal") ?? "").trim() || null,
      message: String(formData.get("message") ?? "").trim() || null,
      status: "submitted",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !inserted) {
    return { error: error?.message ?? "신청 저장 중 오류가 발생했습니다." };
  }

  redirect("/client/marketer-requests?created=1");
}
