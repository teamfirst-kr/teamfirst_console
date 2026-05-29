import "server-only";

const webhookUrl = process.env.N8N_WEBHOOK_URL;
const webhookSecret = process.env.N8N_WEBHOOK_SECRET;

// n8n 워크플로우 트리거. 미설정/실패해도 호출부 흐름을 막지 않는다.
// 현재 용도: 미팅 확정(meeting.confirmed) → 구글 캘린더 이벤트 + 구글미트 링크 생성·안내.
export async function triggerN8n(
  event: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!webhookUrl) {
    console.warn("[n8n] N8N_WEBHOOK_URL 미설정 — 트리거 생략:", event);
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhookSecret ? { "x-webhook-secret": webhookSecret } : {}),
      },
      body: JSON.stringify({ event, ...payload }),
    });
    if (!res.ok) return { ok: false, error: `n8n 응답 ${res.status}` };
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown error";
    console.error("[n8n] 트리거 실패:", message);
    return { ok: false, error: message };
  }
}
