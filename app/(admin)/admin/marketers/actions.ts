"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import type { Json } from "@/types/database";
import type { MarketerPortfolioItem } from "@/lib/schemas/marketer";

export type MarketerActionState = { error: string } | null;

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
  return base || `marketer-${Math.abs(hashCode(input))}`;
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function parsePortfolio(raw: string): MarketerPortfolioItem[] {
  // 한 줄에 "제목 | URL" 형식
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, url] = line.split("|").map((s) => s.trim());
      return { title: title || url || "", url: url || title || "" };
    })
    .filter((p) => p.url);
}

function readForm(formData: FormData) {
  const display_name = String(formData.get("display_name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const careerYears = Number(formData.get("career_years"));
  const cohortYear = Number(formData.get("cohort_year"));
  return {
    display_name,
    slug: slugInput ? slugify(slugInput) : slugify(display_name),
    category: String(formData.get("category") ?? "performance"),
    cohort_year: Number.isFinite(cohortYear) && cohortYear > 0 ? cohortYear : null,
    career_years: Number.isFinite(careerYears) && careerYears > 0 ? careerYears : null,
    headline: String(formData.get("headline") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    skills,
    portfolio: parsePortfolio(String(formData.get("portfolio") ?? "")),
    status: formData.get("publish") === "on" ? "published" : "draft",
    sort_order: Number(formData.get("sort_order")) || 0,
  };
}

export async function createMarketer(
  _prev: MarketerActionState,
  formData: FormData,
): Promise<MarketerActionState> {
  await assertAdmin();
  const f = readForm(formData);
  if (!f.display_name) return { error: "마케터 이름을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase.from("marketers").insert({
    slug: f.slug,
    display_name: f.display_name,
    category: f.category,
    cohort_year: f.cohort_year,
    career_years: f.career_years,
    headline: f.headline,
    bio: f.bio,
    skills: f.skills,
    portfolio: f.portfolio as unknown as Json,
    status: f.status,
    sort_order: f.sort_order,
  });
  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 slug입니다." };
    return { error: error.message };
  }
  revalidatePath("/admin/marketers");
  redirect("/admin/marketers");
}

export async function updateMarketer(
  id: string,
  _prev: MarketerActionState,
  formData: FormData,
): Promise<MarketerActionState> {
  await assertAdmin();
  const f = readForm(formData);
  if (!f.display_name) return { error: "마케터 이름을 입력해주세요." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("marketers")
    .update({
      slug: f.slug,
      display_name: f.display_name,
      category: f.category,
      cohort_year: f.cohort_year,
      career_years: f.career_years,
      headline: f.headline,
      bio: f.bio,
      skills: f.skills,
      portfolio: f.portfolio as unknown as Json,
      status: f.status,
      sort_order: f.sort_order,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 slug입니다." };
    return { error: error.message };
  }
  revalidatePath("/admin/marketers");
  revalidatePath(`/admin/marketers/${id}`);
  redirect("/admin/marketers");
}

export async function setMarketerStatus(
  id: string,
  status: "draft" | "published",
): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase
    .from("marketers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/marketers");
}

export async function deleteMarketer(id: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("marketers").delete().eq("id", id);
  revalidatePath("/admin/marketers");
  redirect("/admin/marketers");
}
