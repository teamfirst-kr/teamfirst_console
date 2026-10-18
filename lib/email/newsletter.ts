import "server-only";

import { CATEGORY_MAP, DEFAULT_CTA } from "@/lib/newsletter/constants";
import { escapeHtml, renderMarkdown } from "@/lib/newsletter/markdown";
import type { NewsletterIssueRow } from "@/types/database";

const NAVY = "#111E38";
const INK = "#000C31";
const BLUE = "#004AAD";
const FONT = "'Apple SD Gothic Neo',Pretendard,'Malgun Gothic',system-ui,sans-serif";

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://console.teamfirst.kr").replace(/\/$/, "");
}

// 뉴스레터 메일 — 에디토리얼 톤. 호 본문 + 주제와 이어지는 CTA(상담 신청 버튼) + 수신거부 링크.
export function newsletterEmail(params: {
  issue: NewsletterIssueRow;
  recipientName?: string | null;
  unsubscribeUrl: string;
  webUrl: string; // /newsletter/open?t=…&slug=… (토큰을 쿠키로 바꾸고 깨끗한 URL로 이동)
}): { subject: string; html: string } {
  const { issue } = params;
  const cat = CATEGORY_MAP[issue.category];
  const dateText = (issue.published_at ?? issue.created_at).slice(0, 10).replace(/-/g, ".");
  const cta = {
    title: issue.cta_title?.trim() || DEFAULT_CTA.title,
    body: issue.cta_body?.trim() || DEFAULT_CTA.body,
  };
  const consultUrl = `${params.webUrl}&to=consult`; // 웹 상담 신청 양식 (브랜드명·월 마케팅 예산·연락처)
  const preheader = escapeHtml(issue.summary ?? issue.title);
  const body = renderMarkdown(issue.body_md, "email");
  const volText = issue.issue_no ? `Vol.${issue.issue_no}` : "";

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
      <tr>
        <td style="padding:36px 36px 8px;">
          <p style="margin:0 0 14px;font-size:11px;letter-spacing:0.18em;font-weight:700;color:${BLUE};">${cat.code} · <span style="color:#6b7280;">${escapeHtml(cat.label)}</span></p>
          <h1 style="margin:0 0 14px;font-size:28px;line-height:1.3;font-weight:800;letter-spacing:-0.02em;color:${INK};">${escapeHtml(issue.title)}</h1>
          ${issue.summary ? `<p style="margin:0 0 6px;font-size:16px;line-height:1.7;color:#4b5563;">${escapeHtml(issue.summary)}</p>` : ""}
          ${params.recipientName ? `<p style="margin:10px 0 0;font-size:13px;color:#6b7280;">${escapeHtml(params.recipientName)}님께 보내드립니다.</p>` : ""}
        </td>
      </tr>
      ${issue.cover_url ? `<tr><td style="padding:22px 36px 0;"><img src="${escapeHtml(issue.cover_url)}" alt="" width="568" style="display:block;width:100%;max-width:568px;height:auto;"/></td></tr>` : ""}
      <tr>
        <td style="padding:16px 36px 24px;">
          ${body}
        </td>
      </tr>
      <tr>
        <td style="padding:0 36px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid ${INK};border-collapse:collapse;">
            <tr><td style="padding:26px 0 0;">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.18em;font-weight:700;color:#6b7280;">CONSULTING</p>
              <p style="margin:0 0 10px;font-size:21px;line-height:1.4;font-weight:800;letter-spacing:-0.01em;color:${INK};">${escapeHtml(cta.title)}</p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.75;color:#4b5563;">${escapeHtml(cta.body)}</p>
              <a href="${escapeHtml(consultUrl)}" style="display:inline-block;padding:13px 26px;background:${INK};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.02em;">팀퍼스트에 상담 신청하기</a>
              <p style="margin:12px 0 0;font-size:12px;color:#9ca3af;">브랜드명 · 월 마케팅 예산 · 연락처만 남기시면 담당자가 연락드립니다.</p>
            </td></tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 36px 28px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;line-height:1.8;">
          <p style="margin:0;">본 메일은 팀퍼스트 뉴스레터 수신에 동의하신 분께 발송됩니다.
            <a href="${escapeHtml(params.webUrl)}" style="color:${NAVY};">웹에서 보기</a> ·
            <a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#6b7280;">수신거부</a></p>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:11px;">팀퍼스트(TeamFirst) · 사업자등록번호 102-16-97516 · 20, Yonghae-ro, Seo-gu, Incheon · team1st2025@gmail.com</p>
        </td>
      </tr>
    </table>
  </div>`;

  return { subject: `[팀퍼스트 뉴스레터${volText ? ` ${volText}` : ""}] ${issue.title}`, html };
}
