"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentPartnerId } from "@/lib/auth";

import { partnerProfileSchema } from "./schema";

export type ProfileFormValues = {
  company_name: string;
  representative: string;
  established_year: string;
  staff_size: string;
  website: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  specialty: string;
  intro: string;
  strengths: string;
  notable_clients: string;
  categories: string[];
};
export type ProfileState =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]>; values?: ProfileFormValues } // values: 오류 시 입력값 유지
  | null;

function getAll(fd: FormData, key: string): string[] {
  return fd.getAll(key).map(String);
}

// 파트너 본인 대행사 정보 수정. RLS partners_update_self(입점 완료 + 본인)와
// partner_cats_self_manage(030)로 권한이 보장된다 — service_role 사용 안 함.
export async function updatePartnerProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const partnerId = await getCurrentPartnerId();
  if (!partnerId) return { ok: false, error: "파트너 계정으로 로그인해주세요." };

  const str = (k: string) => String(formData.get(k) ?? "");
  const raw: ProfileFormValues = {
    company_name: str("company_name"),
    representative: str("representative"),
    established_year: str("established_year"),
    staff_size: str("staff_size"),
    website: str("website"),
    contact_person: str("contact_person"),
    contact_email: str("contact_email"),
    contact_phone: str("contact_phone"),
    address: str("address"),
    specialty: str("specialty"),
    intro: str("intro"),
    strengths: str("strengths"),
    notable_clients: str("notable_clients"),
    categories: getAll(formData, "categories"),
  };
  const parsed = partnerProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_form";
      (fieldErrors[key] ||= []).push(issue.message);
    }
    return { ok: false, error: "입력 내용을 확인해주세요.", fieldErrors, values: raw };
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
    if (error) return { ok: false, error: error.message, values: raw };
    if (!updated) return { ok: false, error: "입점 완료된 파트너만 정보를 수정할 수 있습니다. 운영자에게 문의해주세요.", values: raw };

    // 카테고리 전체 교체 (본인 것만 — RLS)
    const { data: existing } = await supabase.from("partner_categories").select("id, category").eq("partner_id", partnerId);
    const current = new Set((existing ?? []).map((c) => c.category));
    const wanted = new Set(categories);
    const toDelete = (existing ?? []).filter((c) => !wanted.has(c.category)).map((c) => c.id);
    const toInsert = categories.filter((c) => !current.has(c)).map((category) => ({ partner_id: partnerId, category }));
    if (toDelete.length > 0) {
      const { error: delErr } = await supabase.from("partner_categories").delete().in("id", toDelete);
      if (delErr) return { ok: false, error: `매체 정보 저장 실패: ${delErr.message}`, values: raw };
    }
    if (toInsert.length > 0) {
      const { error: insErr } = await supabase.from("partner_categories").insert(toInsert);
      if (insErr) return { ok: false, error: `매체 정보 저장 실패: ${insErr.message}`, values: raw };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "저장에 실패했습니다.", values: raw };
  }

  revalidatePath("/partner/profile");
  revalidatePath("/partner/dashboard");
  return { ok: true, message: "대행사 정보가 저장되었습니다." };
}
