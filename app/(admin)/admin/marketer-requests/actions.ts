"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { notify } from "@/lib/notifications";

export type ManageState = { ok: true; message: string } | { ok: false; error: string };

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") throw new Error("운영자 권한이 필요합니다.");
}

export async function updateMarketerRequest(
  id: string,
  _prev: ManageState | null,
  formData: FormData,
): Promise<ManageState> {
  await assertAdmin();
  const supabase = await createClient();

  const status = String(formData.get("status") ?? "");
  const assigned = String(formData.get("assigned_marketer_id") ?? "");
  const interviewRaw = String(formData.get("interview_at") ?? "").trim();
  const notes = String(formData.get("admin_notes") ?? "").trim();

  const { error } = await supabase
    .from("marketer_requests")
    .update({
      status: status || undefined,
      assigned_marketer_id: assigned || null,
      interview_at: interviewRaw ? new Date(interviewRaw).toISOString() : null,
      admin_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  // 마케터에게 매칭 제안 알림 (계정이 있는 경우)
  if (assigned) {
    const { data: m } = await supabase
      .from("marketers")
      .select("user_id, display_name")
      .eq("id", assigned)
      .maybeSingle<{ user_id: string | null; display_name: string }>();
    await notify(m?.user_id, {
      type: "marketer_proposed",
      title: "새 매칭 제안이 있습니다",
      body: "브랜드 매칭에 회원님이 제안되었습니다. 콘솔에서 확인하세요.",
      link: "/marketer-console",
    });
  }

  revalidatePath(`/admin/marketer-requests/${id}`);
  revalidatePath("/admin/marketer-requests");
  return { ok: true, message: "저장되었습니다." };
}
