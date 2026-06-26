"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email/resend";
import { marketerApprovedEmail } from "@/lib/email/templates";
import type { Json } from "@/types/database";
import type { MarketerPortfolioItem } from "@/lib/schemas/marketer";

export type MarketerActionState = { error: string } | null;
export type IssueAccountResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function randomPassword(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}

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
    contact_email: String(formData.get("contact_email") ?? "").trim() || null,
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
    contact_email: f.contact_email,
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
      contact_email: f.contact_email,
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

// 마케터 로그인 계정 발급 (큐레이션 모델: 운영자가 발급). 초기 임시 비번 + 첫
// 로그인 시 변경 강제. 마케터는 콘솔에서 제안받은 매칭/인터뷰를 확인한다.
export async function issueMarketerAccount(
  id: string,
): Promise<IssueAccountResult> {
  await assertAdmin();
  const supabase = await createClient();
  const { data: marketer } = await supabase
    .from("marketers")
    .select("id, display_name, contact_email, user_id")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      display_name: string;
      contact_email: string | null;
      user_id: string | null;
    }>();

  if (!marketer) return { ok: false, error: "마케터를 찾을 수 없습니다." };
  if (marketer.user_id) return { ok: false, error: "이미 계정이 발급되었습니다." };
  if (!marketer.contact_email)
    return { ok: false, error: "이메일을 먼저 입력·저장해주세요." };

  const admin = createAdminClient();
  const password = randomPassword();
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: marketer.contact_email,
      password,
      email_confirm: true,
      user_metadata: { role: "marketer", name: marketer.display_name },
      app_metadata: { role: "marketer", must_change_password: true },
    });

  let userId = created?.user?.id ?? null;
  if (createError || !userId) {
    const msg = createError?.message ?? "";
    if (msg.includes("already") || msg.includes("registered")) {
      const { data: existing } = await admin
        .from("users")
        .select("id")
        .eq("email", marketer.contact_email)
        .maybeSingle();
      if (existing?.id) userId = existing.id;
      else return { ok: false, error: `계정 생성 실패: ${msg}` };
    } else {
      return { ok: false, error: `계정 생성 실패: ${msg}` };
    }
  }

  await admin
    .from("users")
    .update({ role: "marketer", name: marketer.display_name })
    .eq("id", userId);

  const { error: linkError } = await admin
    .from("marketers")
    .update({ user_id: userId })
    .eq("id", id);
  if (linkError) return { ok: false, error: linkError.message };

  if (created?.user?.id) {
    const mail = marketerApprovedEmail({
      displayName: marketer.display_name,
      email: marketer.contact_email,
      tempPassword: password,
      loginUrl: `${appUrl()}/login`,
    });
    await sendEmail({ to: marketer.contact_email, ...mail });
  }

  revalidatePath(`/admin/marketers/${id}`);
  revalidatePath("/admin/marketers");
  return {
    ok: true,
    message: created?.user?.id
      ? "마케터 계정을 발급하고 안내 메일을 보냈습니다."
      : "기존 계정에 마케터 권한을 연결했습니다.",
  };
}

export async function deleteMarketer(id: string): Promise<void> {
  await assertAdmin();
  const supabase = await createClient();
  await supabase.from("marketers").delete().eq("id", id);
  revalidatePath("/admin/marketers");
  redirect("/admin/marketers");
}
