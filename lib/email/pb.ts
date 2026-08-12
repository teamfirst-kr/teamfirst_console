import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import type { Json } from "@/types/database";

// 페이백 메일 발송 + pb_email_logs 기록 (스펙 §7 — 모든 발송 로그 필수)
export async function sendPbEmail(input: {
  clientId?: string | null;
  to: string;
  type: string; // 'E1' ~ 'E9'
  subject: string;
  html: string;
  payload?: Json;
}): Promise<void> {
  const result = await sendEmail({
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
  try {
    const admin = createAdminClient();
    await admin.from("pb_email_logs").insert({
      client_id: input.clientId ?? null,
      to_email: input.to,
      type: input.type,
      resend_id: null,
      payload: {
        subject: input.subject,
        ok: result.ok,
        skipped: result.skipped ?? false,
        error: result.error ?? null,
        ...(input.payload ? { data: input.payload } : {}),
      } as unknown as Json,
    });
  } catch (e) {
    console.error("[pb-email] 로그 기록 실패:", e);
  }
}
