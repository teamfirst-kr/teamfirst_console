import { NextResponse } from "next/server";

import { storeNewsletterImage } from "@/lib/newsletter/upload";

import { checkNewsletterApiKey } from "../_auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST multipart/form-data { file } → { url }  (Cowork API 키 인증)
export async function POST(request: Request) {
  const denied = checkNewsletterApiKey(request);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const r = await storeNewsletterImage(form.get("file"));
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json({ ok: true, url: r.url, path: r.path });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "upload failed" }, { status: 500 });
  }
}
