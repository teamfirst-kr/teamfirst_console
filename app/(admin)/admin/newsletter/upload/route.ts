import { NextResponse } from "next/server";

import { getCurrentRole } from "@/lib/auth";
import { storeNewsletterImage } from "@/lib/newsletter/upload";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 어드민 작성 화면의 이미지 업로드 (운영자 세션 인증). 저장 규칙은 Cowork API 업로드와 동일.
export async function POST(request: Request) {
  if ((await getCurrentRole()) !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const form = await request.formData();
    const r = await storeNewsletterImage(form.get("file"));
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json({ ok: true, url: r.url, path: r.path });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "upload failed" }, { status: 500 });
  }
}
