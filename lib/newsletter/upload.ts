import "server-only";

import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

// 뉴스레터 이미지 저장 — Cowork API 라우트와 어드민 업로드 라우트가 같은 규칙(버킷·경로·형식·용량)을 쓴다
export const NEWSLETTER_IMAGE_BUCKET = "newsletter-images";
export const NEWSLETTER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const NEWSLETTER_IMAGE_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

export type StoreImageResult = { ok: true; url: string; path: string } | { ok: false; error: string; status: number };

export async function storeNewsletterImage(file: unknown): Promise<StoreImageResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "file 필드에 이미지를 첨부하세요.", status: 400 };
  const ext = NEWSLETTER_IMAGE_TYPES[file.type];
  if (!ext) return { ok: false, error: "png / jpg / webp / gif 이미지만 업로드할 수 있습니다.", status: 415 };
  if (file.size > NEWSLETTER_IMAGE_MAX_BYTES) return { ok: false, error: "이미지는 5MB 이하여야 합니다.", status: 413 };
  try {
    const path = `${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${ext}`;
    const admin = createAdminClient();
    const { error } = await admin.storage.from(NEWSLETTER_IMAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" });
    if (error) return { ok: false, error: `업로드 실패: ${error.message}`, status: 500 };
    const { data } = admin.storage.from(NEWSLETTER_IMAGE_BUCKET).getPublicUrl(path);
    return { ok: true, url: data.publicUrl, path };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "upload failed", status: 500 };
  }
}
