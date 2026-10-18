import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const replyTo = process.env.RESEND_REPLY_TO;
// 모든 발신 메일의 숨은 참조 — 발송 사본 보관·검수용 (운영자 지시, 2026-09-22).
// RESEND_BCC_EMAIL 환경변수로 교체 가능, 빈 문자열로 설정하면 비활성화.
const bccEmail = process.env.RESEND_BCC_EMAIL ?? "rldbs06@naver.com";

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
      ...(bccEmail ? { bcc: bccEmail } : {}),
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

// 대량 발송(뉴스레터): Resend batch API — 호출 1회에 최대 100통. 수신자별 BCC는 붙이지 않는다
// (사본은 호출부에서 검수용 1통만 별도 발송). 항목별 성공 여부를 돌려준다.
export type BatchEmailItem = { to: string; subject: string; html: string };
export async function sendEmailBatch(
  items: BatchEmailItem[],
): Promise<{ ok: boolean; skipped?: boolean; error?: string; sent: number }> {
  if (items.length === 0) return { ok: true, sent: 0 };
  if (!resend) {
    console.warn("[email] RESEND_API_KEY 미설정 — 배치 발송 생략:", items.length);
    return { ok: false, skipped: true, sent: 0 };
  }
  try {
    const { data, error } = await resend.batch.send(
      items.slice(0, 100).map((i) => ({
        from: `TeamFirst <${fromEmail}>`,
        to: i.to,
        subject: i.subject,
        html: i.html,
        ...(replyTo ? { replyTo } : {}),
      })),
    );
    if (error) {
      console.error("[email] 배치 발송 실패:", error);
      return { ok: false, error: error.message, sent: 0 };
    }
    return { ok: true, sent: data?.data?.length ?? items.length };
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    console.error("[email] 배치 예외:", message);
    return { ok: false, error: message, sent: 0 };
  }
}

export function bccAddress(): string | null {
  return bccEmail || null;
}
