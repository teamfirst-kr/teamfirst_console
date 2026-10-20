import "server-only";

import { DEFAULT_BUTTON_LABEL, formatKstDateTime, INSIGHT_LABEL, resolveHighlight, subjectFor } from "@/lib/newsletter/highlight";
import { escapeHtml, markdownToText, renderInline } from "@/lib/newsletter/markdown";
import type { NewsletterIssueRow } from "@/types/database";

const NAVY = "#111E38";
const INK = "#000C31";
const BLUE = "#004AAD";
const FONT = "'Apple SD Gothic Neo',Pretendard,'Malgun Gothic',system-ui,sans-serif";

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://console.teamfirst.kr").replace(/\/$/, "");
}

export type NewsletterMailVariant = "subscriber" | "test" | "review";

// 하이라이트형 뉴스레터 메일 — 메일에는 핵심만, 전문·상담 양식은 웹에서.
// 구성: 헤더 → "오늘의 하이라이트" → 태그 → 헤드라인 → 커버 → 도입(**굵게**만) → 주요 소식(티저 n + 바로 아래 팀퍼스트 인사이트 n) → 전문 버튼
//       → 작은 상담 안내 한 줄(보조 링크) → 법정 표기·수신거부. body_md 전체는 넣지 않는다.
// 서비스 홍보 블록은 두지 않는다 (운영자 지시) — 상담 유도는 웹 전문 하단에서.
export function newsletterEmail(params: {
  issue: NewsletterIssueRow;
  recipientName?: string | null;
  unsubscribeUrl: string;
  webUrl: string; // /newsletter/open?t=…&slug=… (토큰을 쿠키로 바꾸고 깨끗한 URL로 이동)
  variant?: NewsletterMailVariant;
  reviewHeader?: { note: string | null; adminUrl: string; requestedAt: string }; // 검수 메일 상단 블록 (운영자 전용)
}): { subject: string; html: string } {
  const { issue } = params;
  const variant = params.variant ?? "subscriber";
  const h = resolveHighlight(issue);
  const dateText = formatKstDateTime(issue.send_scheduled_at ?? issue.published_at ?? issue.created_at).slice(0, 10); // KST 날짜
  const consultUrl = `${params.webUrl}&to=consult`;
  const preheader = escapeHtml(markdownToText(h.intro || h.headline, 160)); // 받은편지함 미리보기에는 마크다운 기호 제거
  const volText = issue.issue_no ? `Vol.${issue.issue_no}` : "";
  const intro = renderInline(escapeHtml(h.intro), "email").replace(/\n/g, "<br/>");

  const reviewBlock = params.reviewHeader
    ? `<tr><td style="padding:18px 36px;background:#fff7ed;border-bottom:1px solid #fed7aa;font-size:13px;line-height:1.7;color:#7c2d12;">
         <p style="margin:0 0 6px;font-weight:800;">검수 요청 — 운영자 전용 블록 (구독자에게는 보이지 않습니다)</p>
         <p style="margin:0 0 6px;">요청 시각 ${escapeHtml(params.reviewHeader.requestedAt)} · <a href="${escapeHtml(params.reviewHeader.adminUrl)}" style="color:${BLUE};">어드민에서 편집·승인</a></p>
         ${params.reviewHeader.note ? `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(params.reviewHeader.note)}</p>` : `<p style="margin:0;color:#9a3412;">검수 메모 없음</p>`}
       </td></tr>`
    : "";

  // 주요 소식: 티저 n번 바로 아래에 인사이트 n번을 붙여 "이 소식에 대한 팀퍼스트 인사이트"로 읽히게 한다 (운영자 피드백 2026-10-20).
  const insightCell = (t: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:10px;background:#eef1f7;border-left:3px solid ${INK};">
          <tr><td style="padding:10px 14px 2px;font-size:11px;letter-spacing:0.08em;font-weight:700;color:#6b7280;">${escapeHtml(INSIGHT_LABEL)}</td></tr>
          <tr><td style="padding:2px 14px 11px;font-size:14px;line-height:1.7;color:#1f2937;">${renderInline(escapeHtml(t), "email")}</td></tr>
        </table>`;

  const teaserRows = h.teasers
    .map(
      (t, i) => `<tr>
        <td style="width:28px;padding:16px 0;border-top:1px solid #e5e7eb;font-size:12px;font-weight:800;letter-spacing:0.08em;color:${BLUE};vertical-align:top;line-height:1.6;">0${i + 1}</td>
        <td style="padding:16px 0;border-top:1px solid #e5e7eb;vertical-align:top;">
          <p style="margin:0;font-size:16px;line-height:1.6;font-weight:700;color:${INK};">${renderInline(escapeHtml(t), "email")}</p>
          ${h.insights[i] ? insightCell(h.insights[i]) : ""}
        </td>
      </tr>`,
    )
    .join("");

  // 소식보다 인사이트가 많을 때 남는 인사이트는 목록 아래 한 박스로
  const extraInsights = h.insights.slice(h.teasers.length);
  const insightBlock =
    extraInsights.length > 0
      ? `<tr><td style="padding:18px 36px 4px;">${extraInsights.map(insightCell).join("")}</td></tr>`
      : "";

  const html = `
  <div style="margin:0;padding:32px 12px;background:#f4f5f7;font-family:${FONT};">
    <div style="display:none;max-height:0;overflow:hidden;color:#f4f5f7;font-size:1px;line-height:1px;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-collapse:collapse;">
      <tr><td style="height:4px;background:${INK};"></td></tr>
      <tr>
        <td style="padding:22px 36px 18px;border-bottom:1px solid #e5e7eb;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:15px;font-weight:800;letter-spacing:0.14em;color:${INK};">TEAMFIRST</td>
            <td style="text-align:right;font-size:11px;letter-spacing:0.14em;color:#6b7280;">NEWSLETTER${volText ? ` · ${volText}` : ""} · ${dateText}</td>
          </tr></table>
        </td>
      </tr>
      ${reviewBlock}
      <tr>
        <td style="padding:34px 36px 6px;">
          <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.2em;font-weight:700;color:#6b7280;">오늘의 하이라이트</p>
          <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:${BLUE};">${h.tags.map((t) => `#${escapeHtml(t)}`).join("&nbsp;&nbsp;")}</p>
          <h1 style="margin:0 0 6px;font-size:27px;line-height:1.3;font-weight:800;letter-spacing:-0.02em;color:${INK};">${escapeHtml(h.headline)}</h1>
          ${params.recipientName ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280;">${escapeHtml(params.recipientName)}님께 보내드립니다.</p>` : ""}
        </td>
      </tr>
      ${issue.cover_url ? `<tr><td style="padding:20px 36px 0;"><img src="${escapeHtml(issue.cover_url)}" alt="" width="568" style="display:block;width:100%;max-width:568px;height:auto;"/></td></tr>` : ""}
      ${intro ? `<tr><td style="padding:22px 36px 4px;font-size:16px;line-height:1.8;color:#1f2937;">${intro}</td></tr>` : ""}
      ${
        teaserRows
          ? `<tr><td style="padding:26px 36px 6px;">
          <p style="margin:0 0 10px;font-size:13px;letter-spacing:0.06em;font-weight:800;color:${INK};">주요 소식</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-bottom:1px solid #e5e7eb;">${teaserRows}</table>
        </td></tr>`
          : ""
      }
      ${insightBlock}
      <tr>
        <td style="padding:26px 36px 10px;">
          <a href="${escapeHtml(params.webUrl)}" style="display:inline-block;padding:14px 28px;background:${INK};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.02em;">${escapeHtml(h.buttonLabel || DEFAULT_BUTTON_LABEL)}</a>
          <p style="margin:12px 0 0;font-size:12px;line-height:1.7;color:#9ca3af;">자세한 내용과 결론은 전문에서 확인하실 수 있습니다. 등록하신 분은 버튼만 누르면 바로 열립니다.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 36px 32px;font-size:12px;line-height:1.7;color:#6b7280;">
          이 주제와 관련해 상담이 필요하시면 전문 페이지 하단에서 신청하실 수 있습니다. <a href="${escapeHtml(consultUrl)}" style="color:${NAVY};">상담 신청 바로가기</a>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 36px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.8;">
          <p style="margin:0;">본 메일은 팀퍼스트 뉴스레터 및 광고성 정보 수신에 동의하신 분께 발송됩니다.
            <a href="${escapeHtml(params.webUrl)}" style="color:${NAVY};">웹에서 보기</a> ·
            <a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#6b7280;">수신거부 Unsubscribe</a></p>
          <p style="margin:6px 0 0;">수신을 원하지 않으시면 위 '수신거부'를 눌러주세요. If you no longer wish to receive this email, click 'Unsubscribe' above.</p>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:11px;">전송자: 팀퍼스트(TeamFirst) · 사업자등록번호 102-16-97516 · 20, Yonghae-ro, Seo-gu, Incheon · 전화 010-9543-2625 · 이메일 team1st2025@gmail.com</p>
        </td>
      </tr>
    </table>
  </div>`;

  return { subject: subjectFor(issue, variant), html };
}
