import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const replyTo = process.env.RESEND_REPLY_TO;

const resend = apiKey ? new Resend(apiKey) : null;

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
};

// 키가 없으면 조용히 건너뛴다 (로컬/미설정 환경에서 크래시 방지).
// 발송 실패도 호출부 흐름을 막지 않도록 결과만 반환한다.
export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: SendEmailInput): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY 미설정 — 발송 생략:", subject);
    return { ok: false, skipped: true };
  }
  try {
    const { error } = await resend.emails.send({
      from: `TeamFirst <${fromEmail}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
      ...(attachments ? { attachments } : {}),
    });
    if (error) {
      console.error("[email] 발송 실패:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    console.error("[email] 예외:", message);
    return { ok: false, error: message };
  }
}
