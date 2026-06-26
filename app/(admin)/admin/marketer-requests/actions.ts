"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";

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

  revalidatePath(`/admin/marketer-requests/${id}`);
  revalidatePath("/admin/marketer-requests");
  return { ok: true, message: "저장되었습니다." };
}
