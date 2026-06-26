"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import type { Json } from "@/types/database";
import type { CaseMetric } from "@/lib/schemas/case-study";

export type CaseActionState = { error: string } | null;

async function assertAdmin() {
  const role = await getCurrentRole();
  if (role !== "admin") throw new Error("운영자 권한이 필요합니다.");
}

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  return base || `case-${Math.abs(h)}`;
}

// "지표명 | 값" 한 줄씩
function parseMetrics(raw: string): CaseMetric[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [label, value] = l.split("|").map((s) => s.trim());
      return { label: label || "", value: value || "" };
    })
    .filter((m) => m.label && m.value);
}

function readForm(formData: FormData) {
  const brand_name = String(formData.get("brand_name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const publish = formData.get("publish") === "on";
  return {
    brand_name,
    slug: slugInput ? slugify(slugInput) : slugify(brand_name),
    industry: String(formData.get("industry") ?? "").trim() || null,
    summary: String(formData.get("summary") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    metrics: parseMetrics(String(formData.get("metrics") ?? "")),
    cover_url: String(formData.get("cover_url") ?? "").trim() || null,
    status: publish ? "published" : "draft",
    sort_order: Number(formData.get("sort_order")) || 0,
    publish,
  };
}

export async function createCase(
  _prev: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  await assertAdmin();
  const f = readForm(formData);
  if (!f.brand_name) return { error: "브랜드명을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("case_studies").insert({
    slug: f.slug,
    brand_name: f.brand_name,
    industry: f.industry,
    summary: f.summary,
    body: f.body,
    metrics: f.metrics as unknown as Json,
    cover_url: f.cover_url,
    status: f.status,
    sort_order: f.sort_order,
    published_at: f.publish ? new Date().toISOString() : null,
  });
  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 slug입니다." };
    return { error: error.message };
  }
  revalidatePath("/admin/cases");
  redirect("/admin/cases");
}

export async function updateCase(
  id: string,
  _prev: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  await assertAdmin();
  const f = readForm(formData);
  if (!f.brand_name) return { error: "브랜드명을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("case_studies")
    .update({
      slug: f.slug,
      brand_name: f.brand_name,
      industry: f.industry,
      summary: f.summary,
      body: f.body,
      metrics: f.metrics as unknown as Json,
      cover_url: f.cover_url,
      status: f.status,
      sort_order: f.sort_order,
      published_at: f.publish ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 slug입니다." };
    return { error: error.message };
  }
  revalidatePath("/admin/cases");
  redirect("/admin/cases");
}

export async function setCaseStatus(
  id: string,
  status: "draft" | "published",
): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase
    .from("case_studies")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin/cases");
}

export async function deleteCase(id: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("case_studies").delete().eq("id", id);
  revalidatePath("/admin/cases");
  redirect("/admin/cases");
}
