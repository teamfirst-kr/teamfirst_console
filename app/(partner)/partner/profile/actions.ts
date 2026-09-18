"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";

import { partnerProfileSchema } from "./schema";

export type ProfileState = { ok: true; message: string } | { ok: false; error: string; fieldErrors?: Record<string, string[]> } | null;

function getAll(fd: FormData, key: string): string[] {
  return fd.getAll(key).map(String);
}

// 파트너 본인 대행사 정보 수정. RLS partners_update_self(입점 완료 + 본인)와
// partner_cats_self_manage(030)로 권한이 보장된다 — service_role 사용 안 함.
export async function updatePartnerProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) return { ok: false, error: "파트너 계정으로 로그인해주세요." };

  const raw = {
    company_name: formData.get("company_name") ?? "",
    representative: formData.get("representative") ?? "",
    established_year: formData.get("established_year") ?? "",
    staff_size: formData.get("staff_size") ?? "",
    website: formData.get("website") ?? "",
    contact_person: formData.get("contact_person") ?? "",
    contact_email: formData.get("contact_email") ?? "",
    contact_phone: formData.get("contact_phone") ?? "",
    address: formData.get("address") ?? "",
    specialty: formData.get("specialty") ?? "",
    intro: formData.get("intro") ?? "",
    strengths: formData.get("strengths") ?? "",
    notable_clients: formData.get("notable_clients") ?? "",
    categories: getAll(formData, "categories"),
  };
  const parsed = partnerProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return { ok: false, error: "입력 내용을 확인해주세요.", fieldErrors };
  }
  const { categories, ...fields } = parsed.data;

  try {
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from("partners")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", partnerId)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!updated) return { ok: false, error: "입점 완료된 파트너만 정보를 수정할 수 있습니다. 운영자에게 문의해주세요." };

    // 카테고리 전체 교체 (본인 것만 — RLS)
    const { data: existing } = await supabase.from("partner_categories").select("id, category").eq("partner_id", partnerId);
    const current = new Set((existing ?? []).map((c) => c.category));
    const wanted = new Set(categories);
    const toDelete = (existing ?? []).filter((c) => !wanted.has(c.category)).map((c) => c.id);
    const toInsert = categories.filter((c) => !current.has(c)).map((category) => ({ partner_id: partnerId, category }));
    if (toDelete.length > 0) {
      const { error: delErr } = await supabase.from("partner_categories").delete().in("id", toDelete);
      if (delErr) return { ok: false, error: `매체 정보 저장 실패: ${delErr.message}` };
    }
    if (toInsert.length > 0) {
      const { error: insErr } = await supabase.from("partner_categories").insert(toInsert);
      if (insErr) return { ok: false, error: `매체 정보 저장 실패: ${insErr.message}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "저장에 실패했습니다." };
  }

  revalidatePath("/partner/profile");
  revalidatePath("/partner/dashboard");
  return { ok: true, message: "대행사 정보가 저장되었습니다." };
}
