import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_IMAGES_PER_ISSUE } from "@/lib/newsletter/constants";
import { countImages, sectionsToMarkdown } from "@/lib/newsletter/sections";
import type { NewsletterCategory } from "@/types/database";

import { checkNewsletterApiKey } from "../_auth";

export const dynamic = "force-dynamic";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://console.teamfirst.kr").replace(/\/$/, "");
}

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `issue-${Date.now()}`;
}

const url = z.string().trim().url().max(500);
const issueSchema = z.object({
  id: z.string().uuid().optional(), // 있으면 수정
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(120).optional(),
  issue_no: z.number().int().positive().optional().nullable(),
  summary: z.string().trim().max(400).optional().nullable(),
  category: z.enum(["media_update", "conference", "brand_trend", "content_trend", "ai_workflow", "general"]).default("general"),
  cover_url: url.optional().nullable(),
  // 둘 중 하나: sections(타이틀-이미지-글 반복) 또는 body_md
  sections: z
    .array(
      z.object({
        heading: z.string().trim().max(120).optional(),
        image_url: url.optional(),
        image_alt: z.string().trim().max(120).optional(),
        body: z.string().max(20_000),
      }),
    )
    .max(12)
    .optional(),
  body_md: z.string().max(60_000).optional(),
  cta: z
    .object({
      title: z.string().trim().max(120).optional(),
      body: z.string().trim().max(500).optional(),
    })
    .optional(),
  publish: z.boolean().default(false),
});

// GET → 최근 호 목록 (중복 주제 방지용)
export async function GET(request: Request) {
  const denied = checkNewsletterApiKey(request);
  if (denied) return denied;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("newsletter_issues")
    .select("id, slug, issue_no, title, category, status, published_at, sent_count, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, issues: data ?? [] });
}

// POST → 호 생성(기본 초안) 또는 id가 있으면 수정. 이미지는 커버 포함 최대 4장.
export async function POST(request: Request) {
  const denied = checkNewsletterApiKey(request);
  if (denied) return denied;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }
  const parsed = issueSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력값 오류", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  }
  const d = parsed.data;
  const body_md = d.sections?.length ? sectionsToMarkdown(d.sections) : (d.body_md ?? "");
  if (!body_md.trim()) return NextResponse.json({ error: "sections 또는 body_md 중 하나는 필요합니다." }, { status: 400 });
  const images = countImages(body_md, d.cover_url);
  if (images > MAX_IMAGES_PER_ISSUE) {
    return NextResponse.json({ error: `이미지는 커버 포함 최대 ${MAX_IMAGES_PER_ISSUE}장입니다 (현재 ${images}장).` }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const fields = {
    title: d.title,
    slug: slugify(d.slug || d.title),
    issue_no: d.issue_no ?? null,
    summary: d.summary ?? null,
    category: d.category as NewsletterCategory,
    cover_url: d.cover_url ?? null,
    body_md,
    cta_title: d.cta?.title || null,
    cta_body: d.cta?.body || null,
    updated_at: now,
  };

  if (d.id) {
    const { data: cur } = await admin.from("newsletter_issues").select("id, slug, status, published_at, sent_count").eq("id", d.id).maybeSingle();
    if (!cur) return NextResponse.json({ error: "해당 id의 호가 없습니다." }, { status: 404 });
    // slug는 명시했을 때만 변경(제목만 고쳐도 URL이 바뀌지 않게), 발송된 호는 메일 링크 보호를 위해 변경 불가
    const nextSlug = d.slug ? slugify(d.slug) : cur.slug;
    if (nextSlug !== cur.slug && cur.sent_count > 0) {
      return NextResponse.json({ error: "이미 발송된 호의 slug는 변경할 수 없습니다 (메일 링크 보호)." }, { status: 400 });
    }
    fields.slug = nextSlug;
    const { error } = await admin
      .from("newsletter_issues")
      .update({ ...fields, status: d.publish ? "published" : cur.status, published_at: d.publish ? (cur.published_at ?? now) : cur.published_at })
      .eq("id", d.id);
    if (error) return NextResponse.json({ error: error.code === "23505" ? "같은 slug의 호가 이미 있습니다." : error.message }, { status: 400 });
    revalidatePath("/newsletter");
    revalidatePath(`/newsletter/${cur.slug}`);
    revalidatePath(`/newsletter/${fields.slug}`);
    revalidatePath("/admin/newsletter");
    return NextResponse.json({ ok: true, id: d.id, slug: fields.slug, url: `${appUrl()}/newsletter/${fields.slug}`, admin_url: `${appUrl()}/admin/newsletter/${d.id}` });
  }

  const { data, error } = await admin
    .from("newsletter_issues")
    .insert({ ...fields, status: d.publish ? "published" : "draft", published_at: d.publish ? now : null })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "같은 slug의 호가 이미 있습니다." : error.message }, { status: 400 });
  revalidatePath("/newsletter");
  revalidatePath("/admin/newsletter");
  return NextResponse.json(
    { ok: true, id: data.id, slug: fields.slug, status: d.publish ? "published" : "draft", url: `${appUrl()}/newsletter/${fields.slug}`, admin_url: `${appUrl()}/admin/newsletter/${data.id}` },
    { status: 201 },
  );
}
