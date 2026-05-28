"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import type { MeetingStatus } from "@/types/database";

export type MeetingAdminResult = { ok: true } | { ok: false; error: string };

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") throw new Error("운영자 권한이 필요합니다.");
}

export async function setMeetUrl(
  meetingId: string,
  url: string,
): Promise<MeetingAdminResult> {
  await assertAdmin();
  if (url && !/^https?:\/\//.test(url)) {
    return { ok: false, error: "올바른 URL을 입력해주세요." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ meet_url: url || null })
    .eq("id", meetingId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/meetings");
  return { ok: true };
}

export async function setMeetingStatus(
  meetingId: string,
  status: MeetingStatus,
): Promise<MeetingAdminResult> {
  await assertAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ status })
    .eq("id", meetingId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/meetings");
  return { ok: true };
}
