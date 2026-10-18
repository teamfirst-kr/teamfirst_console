import "server-only";

import { formatKstDateTime } from "@/lib/newsletter/highlight";
import { escapeHtml } from "@/lib/newsletter/markdown";

const INK = "#000C31";
const NAVY = "#111E38";
const FONT = "'Apple SD Gothic Neo',Pretendard,'Malgun Gothic',system-ui,sans-serif";

function frame(title: string, rows: [string, string][], note: string, extraHtml = ""): string {
  const tr = rows
    .map(
      ([k, v]) => `<tr>
      <td style="padding:9px 0;width:120px;color:#6b7280;font-size:13px;vertical-align:top;">${escapeHtml(k)}</td>
      <td style="padding:9px 0;font-size:14px;color:#111827;line-height:1.6;">${v}</td></tr>`,
    )
    .join("");
  return `
  <div style="margin:0;padding:32px 12px;background:#f4f5f7;font-family:${FONT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-collapse:collapse;">
      <tr><td style="height:4px;background:${INK};"></td></tr>
      <tr><td style="padding:22px 32px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:800;letter-spacing:0.14em;color:${INK};">TEAMFIRST</td></tr>
      <tr><td style="padding:28px 32px 8px;">
        <h1 style="margin:0 0 14px;font-size:20px;line-height:1.4;font-weight:800;letter-spacing:-0.01em;color:${INK};">${escapeHtml(title)}</h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;border-collapse:collapse;">${tr}</table>
        ${extraHtml}
        <p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#6b7280;">${note}</p>
      </td></tr>
      <tr><td style="padding:18px 32px 24px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;line-height:1.7;">전송자: 팀퍼스트(TeamFirst) · 사업자등록번호 102-16-97516 · 20, Yonghae-ro, Seo-gu, Incheon · 문의 team1st2025@gmail.com</td></tr>
    </table>
  </div>`;
}

// 신규 구독·재구독 처리 결과 안내 (정보통신망법 제50조 — 동의 사실·일시·처리 결과·수신거부 방법). 광고가 아니므로 (광고) 표기 없음.
export function subscribeNoticeEmail(params: { brandName: string; consentedAt: string; resubscribed: boolean; unsubscribeUrl: string; archiveUrl: string }): {
  subject: string;
  html: string;
} {
  const rows: [string, string][] = [
    ["전송자", "팀퍼스트(TeamFirst)"],
    ["동의 내용", "팀퍼스트 뉴스레터 및 광고성 정보(서비스 홍보·상담 안내) 수신"],
    ["동의 일시", escapeHtml(formatKstDateTime(params.consentedAt)) + " (KST)"],
    ["처리 결과", params.resubscribed ? "재구독 처리 완료" : "구독 등록 완료"],
    ["등록 브랜드", escapeHtml(params.brandName)],
  ];
  const extra = `<p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#374151;">뉴스레터는 주 3회(월·수·금) 발송되며, 지난 호는 <a href="${escapeHtml(params.archiveUrl)}" style="color:${NAVY};">보관함</a>에서 읽을 수 있습니다.</p>`;
  return {
    subject: "[팀퍼스트] 뉴스레터 수신 동의 처리 결과 안내",
    html: frame(
      params.resubscribed ? "뉴스레터 재구독이 완료되었습니다" : "뉴스레터 구독이 완료되었습니다",
      rows,
      `수신을 원하지 않으시면 언제든 <a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#6b7280;">수신거부</a>할 수 있습니다. 본인이 신청하지 않았다면 같은 링크로 수신거부해 주세요.`,
      extra,
    ),
  };
}

// 수신거부 처리 완료 안내 (광고 아님)
export function unsubscribeNoticeEmail(params: { email: string; at: string; resubscribeUrl: string }): { subject: string; html: string } {
  const rows: [string, string][] = [
    ["전송자", "팀퍼스트(TeamFirst)"],
    ["처리 내용", "뉴스레터 및 광고성 정보 수신거부"],
    ["처리 일시", escapeHtml(formatKstDateTime(params.at)) + " (KST)"],
    ["대상 주소", escapeHtml(params.email)],
  ];
  return {
    subject: "[팀퍼스트] 뉴스레터 수신거부 처리 완료 안내",
    html: frame(
      "수신거부가 처리되었습니다",
      rows,
      `더 이상 팀퍼스트 뉴스레터를 보내지 않습니다. 실수로 처리했다면 <a href="${escapeHtml(params.resubscribeUrl)}" style="color:${NAVY};">여기</a>에서 다시 구독할 수 있습니다.`,
    ),
  };
}

// 자동 발송 결과 (운영자)
export function sendResultEmail(params: { title: string; issueNo: number | null; sent: number; failed: number; total: number; publicUrl: string; adminUrl: string; errors?: string[] }): {
  subject: string;
  html: string;
} {
  const vol = params.issueNo ? `Vol.${params.issueNo} ` : "";
  const rows: [string, string][] = [
    ["호", escapeHtml(`${vol}${params.title}`)],
    ["발송", `${params.sent}명`],
    ["실패", `${params.failed}건`],
    ["구독 중", `${params.total}명`],
    ["공개 주소", `<a href="${escapeHtml(params.publicUrl)}" style="color:${NAVY};">${escapeHtml(params.publicUrl)}</a>`],
  ];
  const extra = params.errors?.length ? `<p style="margin:14px 0 0;font-size:12px;color:#b91c1c;white-space:pre-wrap;">${escapeHtml(params.errors.slice(0, 10).join("\n"))}</p>` : "";
  return {
    subject: `[발송 완료] ${vol}${params.title} — ${params.sent}명 발송${params.failed ? `, ${params.failed}건 실패` : ""}`,
    html: frame("뉴스레터 자동 발송이 완료되었습니다", rows, `상세 이력은 <a href="${escapeHtml(params.adminUrl)}" style="color:${NAVY};">어드민</a>에서 확인하세요.`, extra),
  };
}
