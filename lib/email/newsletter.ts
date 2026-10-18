import "server-only";

import { DEFAULT_CTA } from "@/lib/newsletter/constants";
import { CATEGORY_MAP } from "@/lib/newsletter/constants";
import { escapeHtml, renderMarkdown } from "@/lib/newsletter/markdown";
import type { NewsletterIssueRow } from "@/types/database";

const NAVY = "#111E38";
const BLUE = "#004AAD";

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://console.teamfirst.kr").replace(/\/$/, "");
}

// 뉴스레터 메일 — 호 본문 + 팀퍼스트 서비스 제안 + 수신거부 링크
export function newsletterEmail(params: {
  issue: NewsletterIssueRow;
  recipientName?: string | null;
  unsubscribeUrl: string;
  webUrl: string; // 토큰 포함 (등록 없이 바로 열람)
}): { subject: string; html: string } {
  const { issue } = params;
  const cat = CATEGORY_MAP[issue.category];
  const dateText = (issue.published_at ?? issue.created_at).slice(0, 10).replace(/-/g, ".");
  const cta = {
    title: issue.cta_title?.trim() || DEFAULT_CTA.title,
    body: issue.cta_body?.trim() || DEFAULT_CTA.body,
  };
  const consultUrl = `${params.webUrl}#consult`; // 웹 상담 신청 양식 (브랜드명·월 마케팅 예산·연락처)
  const preheader = escapeHtml(issue.summary ?? "");
  const greeting = params.recipientName ? `${escapeHtml(params.recipientName)}님, ` : "";
  const body = renderMarkdown(issue.body_md, "email");

  const html = `
  <div style="margin:0;padding:24px 12px;background:#f1f5f9;font-family:'Apple SD Gothic Neo',Pretendard,system-ui,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;color:#f1f5f9;font-size:1px;">${preheader}</div>
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:${NAVY};padding:18px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="color:#ffffff;font-size:18px;font-weight:800;letter-spacing:-0.01em;">TeamFirst 뉴스레터</td>
          <td style="text-align:right;color:#ffffff;opacity:0.7;font-size:12px;">${issue.issue_no ? `Vol.${issue.issue_no} · ` : ""}${dateText}</td>
        </tr></table>
      </div>
      ${issue.cover_url ? `<img src="${escapeHtml(issue.cover_url)}" alt="" style="display:block;width:100%;height:auto;"/>` : ""}
      <div style="padding:28px 28px 8px;">
        <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#eef4ff;color:${BLUE};font-size:12px;font-weight:700;">${cat.emoji} ${cat.label}</span>
        <h1 style="margin:12px 0 8px;font-size:26px;line-height:1.3;font-weight:800;color:${NAVY};">${escapeHtml(issue.title)}</h1>
        ${issue.summary ? `<p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#4b5563;">${greeting}${escapeHtml(issue.summary)}</p>` : greeting ? `<p style="margin:0;font-size:15px;color:#4b5563;">${greeting}안녕하세요. 팀퍼스트입니다.</p>` : ""}
      </div>
      <div style="padding:8px 28px 20px;">
        ${body}
      </div>
      <div style="margin:0 28px 28px;padding:22px 24px;background:${NAVY};border-radius:12px;color:#ffffff;">
        <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;color:#93c5fd;font-weight:700;">TEAMFIRST</p>
        <p style="margin:0 0 8px;font-size:18px;font-weight:800;line-height:1.4;">${escapeHtml(cta.title)}</p>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.8);">${escapeHtml(cta.body)}</p>
        <a href="${escapeHtml(consultUrl)}" style="display:inline-block;padding:12px 22px;background:#ffffff;color:${NAVY};text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">💬 팀퍼스트에 상담 신청하기 →</a>
        <p style="margin:10px 0 0;font-size:12px;color:rgba(255,255,255,0.6);">브랜드명 · 월 마케팅 예산 · 연락처만 남기시면 담당자가 연락드립니다.</p>
      </div>
      <div style="padding:18px 28px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.8;">
        <p style="margin:0;">본 메일은 팀퍼스트 뉴스레터 수신에 동의하신 분께 발송됩니다.
          <a href="${escapeHtml(params.webUrl)}" style="color:${BLUE};">웹에서 보기</a> ·
          <a href="${escapeHtml(params.unsubscribeUrl)}" style="color:#64748b;">수신거부</a></p>
        <p style="margin:8px 0 0;color:#94a3b8;font-size:11px;">팀퍼스트(TeamFirst) · 사업자등록번호 102-16-97516 · 20, Yonghae-ro, Seo-gu, Incheon · team1st2025@gmail.com</p>
      </div>
    </div>
  </div>`;

  return { subject: `[팀퍼스트 뉴스레터${issue.issue_no ? ` Vol.${issue.issue_no}` : ""}] ${issue.title}`, html };
}
