const BRAND_NAVY = "#111E38";
const BRAND_BLUE = "#004AAD";

function layout(title: string, bodyHtml: string): string {
  return `
  <div style="margin:0;padding:24px;background:#f1f5f9;font-family:'Apple SD Gothic Neo',Pretendard,system-ui,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="background:${BRAND_NAVY};padding:20px 28px;">
        <span style="color:#ffffff;font-size:18px;font-weight:700;">TeamFirst</span>
      </div>
      <div style="padding:28px;color:#0f172a;font-size:15px;line-height:1.7;">
        <h1 style="margin:0 0 16px;font-size:20px;color:${BRAND_NAVY};">${title}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
        본 메일은 발신 전용입니다. 문의는 운영팀에 회신해주세요.<br/>
        © ${new Date().getFullYear()} TeamFirst
      </div>
    </div>
  </div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin:8px 0;padding:12px 24px;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">${label}</a>`;
}

export function partnerContractEmail(params: {
  companyName: string;
  glosignUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] 입점 계약서가 도착했습니다",
    html: layout(
      "입점 계약서 안내",
      `<p>${params.companyName} 담당자님, 안녕하세요.</p>
       <p>TeamFirst 입점 검토가 진행되어 전자계약서를 발송해드립니다.
       아래 링크에서 계약서를 확인하고 서명해주세요.</p>
       <p>${button(params.glosignUrl, "계약서 확인 및 서명")}</p>
       <p style="color:#64748b;font-size:13px;word-break:break-all;">${params.glosignUrl}</p>
       <p>계약이 완료되면 파트너 계정이 발급되어 RFP 알림을 받으실 수 있습니다.</p>`,
    ),
  };
}

export function partnerApprovedEmail(params: {
  companyName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] 입점이 완료되었습니다 — 계정 안내",
    html: layout(
      "입점 완료 및 계정 발급",
      `<p>${params.companyName} 담당자님, 입점을 축하드립니다!</p>
       <p>파트너 계정이 발급되었습니다. 아래 정보로 로그인해주세요.
       <strong>초기 비밀번호는 사업자등록번호</strong>이며, 첫 로그인 시 비밀번호
       변경 화면으로 안내됩니다.</p>
       <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;font-size:14px;">
         <div>아이디(이메일): <strong>${params.email}</strong></div>
         <div>초기 비밀번호: <strong style="font-family:monospace;">${params.tempPassword}</strong> (사업자등록번호)</div>
       </div>
       <p>${button(params.loginUrl, "로그인하기")}</p>
       <p style="color:#64748b;font-size:13px;">보안을 위해 첫 로그인 후 반드시 비밀번호를 변경해주세요.</p>`,
    ),
  };
}

export function applicationNotShortlistedEmail(params: {
  companyName: string;
  requestTitle: string;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] RFP 지원 결과 안내",
    html: layout(
      "RFP 지원 결과 안내",
      `<p>${params.companyName} 담당자님, 안녕하세요.</p>
       <p>「${params.requestTitle}」 건에 지원해주셔서 감사합니다.
       아쉽게도 이번 매칭에서는 상위 후보로 선정되지 못했습니다.</p>
       <p>광고주의 요구사항과 우선순위에 따른 결정이며, 귀사의 역량과 무관합니다.
       앞으로도 적합한 RFP가 도착하면 계속 안내드리겠습니다. 감사합니다.</p>`,
    ),
  };
}

export function candidateProposedEmail(params: {
  companyName: string;
  requestTitle: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] 후보 대행사로 선정되었습니다",
    html: layout(
      "후보 선정 안내",
      `<p>${params.companyName} 담당자님, 축하드립니다!</p>
       <p>「${params.requestTitle}」 건의 상위 후보 대행사로 선정되어 광고주에게
       제안이 전달되었습니다. 광고주가 관심을 표시하면 미팅 일정 조율이
       시작됩니다.</p>
       <p>${button(params.dashboardUrl, "대시보드에서 확인")}</p>`,
    ),
  };
}

export function meetingProposedEmail(params: {
  companyName: string;
  requestTitle: string;
  slots: string[];
  dashboardUrl: string;
}): { subject: string; html: string } {
  const slotList = params.slots
    .map((s) => `<li>${s}</li>`)
    .join("");
  return {
    subject: "[TeamFirst] 미팅 일정 후보가 도착했습니다",
    html: layout(
      "미팅 일정 조율 요청",
      `<p>${params.companyName} 담당자님,</p>
       <p>「${params.requestTitle}」 광고주가 아래 미팅 일정 후보를 제안했습니다.
       가능한 시간을 선택하거나 대안을 제시해주세요.</p>
       <ul>${slotList}</ul>
       <p>${button(params.dashboardUrl, "일정 응답하기")}</p>`,
    ),
  };
}

export function meetingConfirmedEmail(params: {
  recipientName: string;
  requestTitle: string;
  scheduledAt: string;
  meetUrl?: string | null;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] 미팅 일정이 확정되었습니다",
    html: layout(
      "미팅 일정 확정",
      `<p>${params.recipientName} 담당자님,</p>
       <p>「${params.requestTitle}」 미팅 일정이 아래와 같이 확정되었습니다.
       첨부된 캘린더 파일(.ics)을 등록해주세요.</p>
       <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;font-size:14px;">
         <div>일시: <strong>${params.scheduledAt}</strong></div>
         ${params.meetUrl ? `<div>화상미팅: <a href="${params.meetUrl}">${params.meetUrl}</a></div>` : "<div>화상미팅 링크는 미팅 2~3일 전 안내됩니다.</div>"}
       </div>`,
    ),
  };
}

export function rfpArrivedEmail(params: {
  companyName: string;
  brandName: string;
  category: string;
  website?: string | null;
  productIntro?: string | null;
  reason?: string | null;
  budget?: number | null;
  duration?: string | null;
  channels?: string[];
  marketingGoals?: string[];
  kpis?: string[];
  preferredAgency?: string | null;
  rfpUrl: string;
}): { subject: string; html: string } {
  const row = (label: string, value: string) =>
    `<tr>
       <td style="padding:9px 0;color:#6b7280;width:96px;vertical-align:top;">${label}</td>
       <td style="padding:9px 0;font-weight:600;color:#111827;">${value}</td>
     </tr>`;
  const budgetText = params.budget
    ? `${params.budget.toLocaleString()}원/월`
    : "협의";
  const tags = (items?: string[]) =>
    items && items.length > 0
      ? items
          .map(
            (v) =>
              `<span style="display:inline-block;margin:2px 4px 2px 0;padding:3px 9px;background:#eef2ff;color:${BRAND_BLUE};border-radius:999px;font-size:12px;font-weight:600;">${v}</span>`,
          )
          .join("")
      : "";
  const briefBlock = (label: string, value?: string | null) =>
    value
      ? `<div style="margin-top:10px;padding-top:10px;border-top:1px dashed #e5e7eb;font-size:13px;color:#4b5563;line-height:1.7;"><strong style="color:#374151;">${label}</strong><br/>${value.replace(/\n/g, "<br/>")}</div>`
      : "";
  const tagBlock = (label: string, items?: string[]) =>
    items && items.length > 0
      ? `<div style="margin-top:10px;padding-top:10px;border-top:1px dashed #e5e7eb;font-size:13px;color:#4b5563;"><strong style="color:#374151;">${label}</strong><br/><div style="margin-top:6px;">${tags(items)}</div></div>`
      : "";
  return {
    subject: `[TeamFirst] 신규 RFP: ${params.brandName} (${params.category})`,
    html: layout(
      "신규 매칭 공고 알림",
      `<p>${params.companyName} 담당자님, 안녕하세요. 팀퍼스트입니다.</p>
       <p>신규 브랜드사의 대행사 매칭 공고가 접수되어 공유드립니다. 아래 요약을
       확인하시고, 제안 의사가 있으시면 플랫폼에서 상세 RFP를 열람한 뒤
       지원서를 제출해주세요.</p>
       <div style="margin:16px 0;padding:18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;">
         <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;">
           ${row("브랜드", params.brandName)}
           ${row("카테고리", params.category)}
           ${params.website ? row("Website", `<a href="${params.website}" style="color:${BRAND_BLUE};text-decoration:none;word-break:break-all;">${params.website}</a>`) : ""}
           ${row("월 예산", budgetText)}
           ${params.duration ? row("계약 기간", params.duration) : ""}
         </table>
         ${tagBlock("요청 매체", params.channels)}
         ${tagBlock("마케팅 목표", params.marketingGoals)}
         ${tagBlock("핵심 성과 지표(KPI)", params.kpis)}
         ${briefBlock("브랜드 소개", params.productIntro)}
         ${briefBlock("모집 배경", params.reason)}
         ${briefBlock("매칭 희망 파트너 / 선정 기준", params.preferredAgency)}
       </div>
       <p style="text-align:center;">${button(params.rfpUrl, "RFP 확인하고 지원하기")}</p>
       <p style="font-size:12px;color:#9ca3af;text-align:center;">버튼을 누르면 팀퍼스트 콘솔에서 전체 RFP(브리프·예산 분배·필수 운영 툴 등)를 확인할 수 있습니다.</p>`,
    ),
  };
}

export function marketerApprovedEmail(params: {
  displayName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] 마케터 계정이 발급되었습니다",
    html: layout(
      "마케터 계정 발급",
      `<p>${params.displayName} 님, 안녕하세요. 팀퍼스트입니다.</p>
       <p>마케터 콘솔 계정이 발급되었습니다. 아래 정보로 로그인 후 비밀번호를
       변경해주세요. 콘솔에서 제안받은 매칭과 인터뷰 일정을 확인할 수 있습니다.</p>
       <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;font-size:14px;">
         <div>아이디(이메일): <strong>${params.email}</strong></div>
         <div>임시 비밀번호: <strong style="font-family:monospace;">${params.tempPassword}</strong></div>
       </div>
       <p>${button(params.loginUrl, "로그인하기")}</p>
       <p style="color:#64748b;font-size:13px;">첫 로그인 후 반드시 비밀번호를 변경해주세요.</p>`,
    ),
  };
}

export function partnerWonEmail(params: {
  companyName: string;
  requestTitle: string;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] 대행이 성사되었습니다",
    html: layout(
      "대행 성사 안내",
      `<p>${params.companyName} 담당자님, 축하드립니다!</p>
       <p>「${params.requestTitle}」 광고주와의 대행이 성사되었습니다. 운영팀이
       대행계약서·매체 이관 절차를 곧 안내드리겠습니다.</p>`,
    ),
  };
}

export function partnerRejectedEmail(params: {
  companyName: string;
  reason?: string;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] 입점 검토 결과 안내",
    html: layout(
      "입점 검토 결과 안내",
      `<p>${params.companyName} 담당자님, 안녕하세요.</p>
       <p>신중한 검토 결과, 이번에는 입점 기준에 따라 함께하기 어렵다는 결론에 이르렀습니다.
       소중한 관심에 진심으로 감사드립니다.</p>
       ${
         params.reason
           ? `<div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;font-size:14px;"><strong>안내</strong><br/>${params.reason}</div>`
           : ""
       }
       <p>기준 보완 후 재신청은 언제든 환영합니다. 감사합니다.</p>`,
    ),
  };
}
