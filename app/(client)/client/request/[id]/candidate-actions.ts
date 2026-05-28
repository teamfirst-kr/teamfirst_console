"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import type { CandidateStatus } from "@/types/database";

export type CandidateActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setCandidateInterest(
  candidateId: string,
  requestId: string,
  status: "interested" | "declined_by_client",
): Promise<CandidateActionResult> {
  const role = await getCurrentRole();
  if (role !== "client") {
    return { ok: false, error: "광고주만 사용할 수 있습니다." };
  }

  const supabase = await createClient();
  // RLS cand_client_update가 본인 요청의 후보만 허용
  const { error } = await supabase
    .from("candidates")
    .update({ status: status satisfies CandidateStatus })
    .eq("id", candidateId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/client/request/${requestId}`);
  return { ok: true };
}
