"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { APP_CATEGORY_KEYS, APP_KEY_RE, APP_STATUSES } from "@/lib/solution-market";

export type AppFormState = { error: string; field?: string } | null;

// 유튜브 링크(youtu.be/…, watch?v=…, shorts/…, embed/…) 또는 11자리 영상 ID → ID
function youtubeId(raw: string): string | null {
  const v = raw.trim();
  if (/^[\w-]{11}$/.test(v)) return v;
  const m = /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/.exec(v);
  return m ? m[1] : null;
}

const appSchema = z.object({
  name: z.string().trim().min(1, "앱 이름을 입력하세요.").max(60, "앱 이름은 60자 이내로 입력하세요."),
  brand: z
    .string()
    .trim()
    .max(40, "브랜드명은 40자 이내로 입력하세요.")
    .transform((v) => v || null),
  category: z.enum(APP_CATEGORY_KEYS, { message: "카테고리를 선택하세요." }),
  summary: z.string().trim().min(1, "한 줄 소개를 입력하세요.").max(160, "한 줄 소개는 160자 이내로 입력하세요."),
  description: z
    .string()
    .trim()
    .max(3000, "상세 소개는 3,000자 이내로 입력하세요.")
    .transform((v) => v || null),
  features: z.array(z.string().max(200, "주요 기능은 한 줄에 200자 이내로 입력하세요.")).max(12, "주요 기능은 12개까지 입력할 수 있습니다."),
  video_id: z.string().nullable(),
  status: z.enum(APP_STATUSES),
  sort: z.number().int().min(-9999).max(9999),
});

type ParsedApp = z.output<typeof appSchema>;

function readForm(fd: FormData): { ok: true; data: ParsedApp } | { ok: false; state: AppFormState } {
  const videoRaw = String(fd.get("video") ?? "").trim();
  const video_id = videoRaw ? youtubeId(videoRaw) : null;
  if (videoRaw && !video_id) {
    return { ok: false, state: { error: "유튜브 링크 또는 영상 ID를 확인하세요.", field: "video" } };
  }
  const parsed = appSchema.safeParse({
    name: String(fd.get("name") ?? ""),
    brand: String(fd.get("brand") ?? ""),
    category: String(fd.get("category") ?? ""),
    summary: String(fd.get("summary") ?? ""),
    description: String(fd.get("description") ?? ""),
    features: String(fd.get("features") ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    video_id,
    status: String(fd.get("status") ?? ""),
    sort: Number(fd.get("sort") ?? 0) || 0,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, state: { error: issue?.message ?? "입력값을 확인하세요.", field: String(issue?.path[0] ?? "") } };
  }
  return { ok: true, data: parsed.data };
}

function revalidate() {
  revalidatePath("/solutions");
  revalidatePath("/admin/solutions");
  revalidatePath("/admin/solutions/apps");
}

export async function createApp(_prev: AppFormState, fd: FormData): Promise<AppFormState> {
  if ((await getCurrentRole()) !== "admin") return { error: "운영자 권한이 필요합니다." };
  const key = String(fd.get("key") ?? "").trim().toLowerCase();
  if (!APP_KEY_RE.test(key)) {
    return { error: "앱 키는 영문 소문자로 시작하는 2~24자(영문 소문자·숫자·하이픈)로 입력하세요.", field: "key" };
  }
  const r = readForm(fd);
  if (!r.ok) return r.state;

  try {
    const supabase = await createClient(); // solution_apps_admin RLS
    const { error } = await supabase.from("solution_apps").insert({ key, ...r.data });
    if (error) {
      if (error.code === "23505") return { error: "이미 있는 앱 키입니다. 다른 키를 입력하세요.", field: "key" };
      return { error: error.message };
    }
  } catch {
    return { error: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
  revalidate();
  redirect("/admin/solutions/apps");
}

// 키는 구독(solution_subscriptions.solutions)에 저장되므로 수정하지 않는다.
export async function updateApp(_prev: AppFormState, fd: FormData): Promise<AppFormState> {
  if ((await getCurrentRole()) !== "admin") return { error: "운영자 권한이 필요합니다." };
  const key = String(fd.get("key") ?? "");
  if (!APP_KEY_RE.test(key)) return { error: "잘못된 앱입니다." };
  const r = readForm(fd);
  if (!r.ok) return r.state;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("solution_apps")
      .update({ ...r.data, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) return { error: error.message };
  } catch {
    return { error: "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
  revalidate();
  redirect("/admin/solutions/apps");
}
