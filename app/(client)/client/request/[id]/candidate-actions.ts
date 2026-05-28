"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { AD_PLATFORM_OPTIONS } from "@/lib/schemas/ad-spend";
import type { AdPlatform, CandidateStatus } from "@/types/database";

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

// 광고주가 후보에게 분석권한 부여 (선택한 매체별 access_grants 생성)
export async function grantAnalysisAccess(
  candidateId: string,
  requestId: string,
  platforms: string[],
): Promise<CandidateActionResult> {
  const role = await getCurrentRole();
  if (role !== "client") {
    return { ok: false, error: "광고주만 사용할 수 있습니다." };
  }
  const valid = AD_PLATFORM_OPTIONS.map((p) => p.value) as string[];
  const chosen = platforms.filter((p) => valid.includes(p));
  if (chosen.length === 0) {
    return { ok: false, error: "분석권한을 부여할 매체를 선택해주세요." };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const rows = chosen.map((platform) => ({
    candidate_id: candidateId,
    grant_type: "analysis" as const,
    platform: platform as AdPlatform,
    status: "granted" as const,
    consented_at: now,
    granted_at: now,
  }));

  // RLS ag_client가 본인 요청의 후보만 허용. 재부여는 무시(중복 platform).
  const { error } = await supabase
    .from("access_grants")
    .upsert(rows, { onConflict: "candidate_id,grant_type,platform", ignoreDuplicates: true });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/client/request/${requestId}`);
  return { ok: true };
}
