import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { checkNewsletterApiKey } from "../_auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "newsletter-images";
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

// POST multipart/form-data { file } → { url }  (Cowork가 ChatGPT로 만든 이미지를 올리는 용도)
export async function POST(request: Request) {
  const denied = checkNewsletterApiKey(request);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "file 필드에 이미지를 첨부하세요." }, { status: 400 });
    const ext = TYPES[file.type];
    if (!ext) return NextResponse.json({ error: "png / jpg / webp / gif 이미지만 업로드할 수 있습니다." }, { status: 415 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "이미지는 5MB 이하여야 합니다." }, { status: 413 });

    const path = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
    const admin = createAdminClient();
    const { error } = await admin.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
    if (error) return NextResponse.json({ error: `업로드 실패: ${error.message}` }, { status: 500 });
    const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ ok: true, url: data.publicUrl, path });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "upload failed" }, { status: 500 });
  }
}
