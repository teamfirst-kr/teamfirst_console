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
      <div style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="vertical-align:top;width:96px;">
              <div style="display:inline-block;background:${BRAND_NAVY};color:#fff;font-weight:800;font-size:13px;line-height:1.1;padding:14px 12px;border-radius:8px;text-align:center;">TEAM<br/>FIRST</div>
            </td>
            <td style="vertical-align:top;color:#64748b;font-size:12px;line-height:1.7;padding-left:8px;">
              <strong style="color:#0f172a;">팀퍼스트</strong> 신뢰기반 대행사 &amp; 마케터 매칭 플랫폼<br/>
              TEL. +82 10-2668-2675<br/>
              SNS. @teamfirst_kr<br/>
              E-mail. <a href="mailto:team1st2025@gmail.com" style="color:#64748b;">team1st2025@gmail.com</a>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0;color:#94a3b8;font-size:11px;">
          본 메일은 발신 전용입니다. · © ${new Date().getFullYear()} 팀퍼스트(TeamFirst)
        </p>
      </div>
    </div>
  </div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin:8px 0;padding:12px 24px;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">${label}</a>`;
}

// ── 페이백 플랫폼 (E1~E9) ────────────────────────────────────────────

// E1: 페이백 신청 접수 확인
export function pbApplicationReceivedEmail(params: {
  companyName: string;
  contactName: string;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] 페이백 신청 접수 완료 — 추가 정보 회신 요청",
    html: layout(
      "페이백 신청 접수 완료",
      `<p>${esc(params.companyName)} ${esc(params.contactName)}님, 안녕하세요. 팀퍼스트입니다.</p>
       <p><strong>광고비 페이백 신청이 정상 접수</strong>되었습니다. 검토 후 영업일 기준 1~2일 내에 연락드리겠습니다.</p>
       <div style="margin:16px 0;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:14px;">
         <strong>📩 빠른 진행을 위해 아래 정보를 이 메일에 회신으로 보내주세요</strong>
         <ol style="margin:8px 0 0;padding-left:18px;">
           <li><strong>세금계산서 발행 이메일</strong> — 정산서·계산서 안내를 받을 세무 담당 이메일</li>
           <li><strong>페이백 입금 계좌</strong> — 은행 / 계좌번호 / 예금주</li>
           <li><strong>솔루션 접속 희망 ID</strong> (선택) — 영문·숫자, 미회신 시 활성화 단계에서 안내드립니다</li>
         </ol>
         <p style="margin:8px 0 0;color:#92400e;font-size:13px;">사업자등록번호·대표자 정보는 제출해주신 사업자등록증으로 확인합니다.</p>
       </div>
       <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;font-size:14px;">
         <strong>다음 절차</strong>
         <ol style="margin:8px 0 0;padding-left:18px;">
           <li>담당자 검토 및 약정서(전자계약) 발송</li>
           <li>매체 광고시스템에서 대행권 지정 (가이드 제공)</li>
           <li>활성화 완료 — 솔루션 오픈 + 당일 광고비부터 페이백 산정</li>
         </ol>
       </div>
       <p style="color:#64748b;font-size:13px;">본 메일은 발신 전용이 아니며, 궁금하신 점도 회신으로 문의해주세요.</p>`,
    ),
  };
}

// E2: 약정/온보딩 안내 (글로싸인 링크 + 대행권 이관 가이드)
export function pbAgreementSentEmail(params: {
  companyName: string;
  contactName: string;
  glosignUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] 페이백 약정서와 대행권 지정 안내드립니다",
    html: layout(
      "약정 체결 및 대행권 지정 안내",
      `<p>${esc(params.companyName)} ${esc(params.contactName)}님, 안녕하세요. 팀퍼스트입니다.</p>
       <p>페이백 신청 검토가 완료되어 <strong>약정서(전자계약)</strong>를 보내드립니다.</p>
       <p style="text-align:center;">${button(params.glosignUrl, "약정서 확인·서명하기 (글로싸인)")}</p>
       <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;font-size:14px;">
         <strong>서명 후 진행 절차 — 대행권 지정</strong>
         <ol style="margin:8px 0 0;padding-left:18px;line-height:1.8;">
           <li>네이버 광고시스템 접속 → 도구 → 광고 담당자(대행사) 관리</li>
           <li>대행사 검색에서 <strong>팀퍼스트</strong>를 선택하고 위임 요청</li>
           <li>팀퍼스트 수락 확인 후 활성화 완료 안내를 받으시면 끝</li>
         </ol>
       </div>
       <p style="color:#64748b;font-size:13px;">계정 소유권과 운영 권한은 그대로 유지되며, 광고 운영은 지금처럼 직접 하시면 됩니다.</p>`,
    ),
  };
}

// 부록 B — 세금계산서 발행 가이드 원문 (수정 금지). 금액·일자만 자동 삽입.
function invoiceGuideHtml(params: {
  supplyValue: number;
  writeDate: string; // 정산월 말일
  dueDate: string; // 익월 10일
}): string {
  return `<div style="margin:16px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;line-height:1.8;">
    <strong>세금계산서 발행 가이드</strong>
    <ul style="margin:8px 0 0;padding-left:18px;">
      <li>발행 방향: 귀사(공급자) → 팀퍼스트(공급받는자), <strong>청구</strong> 구분</li>
      <li>품목: <strong>판매촉진비</strong></li>
      <li>공급가액: 정산서의 페이백 금액 <strong>(${params.supplyValue.toLocaleString()}원)</strong> / 세액: 공급가액의 10%</li>
      <li>작성일자: <strong>정산월 말일</strong> (${params.writeDate})</li>
      <li>발행 기한: <strong>익월 10일 (${params.dueDate})</strong> — 기한 경과 시 지급이 발행 확인월로 순연되며, 지연 발행에 따른 가산세는 발행 사업자에게 발생할 수 있습니다</li>
      <li>세금계산서 발행이 어려운 간이과세·면세사업자는 별도 안내드리는 절차(계산서 없이 공급가액 지급)로 진행됩니다</li>
    </ul>
  </div>`;
}

// E3: 활성화 완료 (솔루션 오픈 + 콘솔 로그인)
export function pbActivatedEmail(params: {
  companyName: string;
  contactName: string;
  loginEmail: string;
  tempPassword?: string | null;
}): { subject: string; html: string } {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    subject: "[TeamFirst] 페이백 활성화 완료 — 솔루션이 오픈되었습니다",
    html: layout(
      "활성화 완료 🎉",
      `<p>${esc(params.companyName)} ${esc(params.contactName)}님, 대행권 이관이 확인되어 <strong>페이백이 활성화</strong>되었습니다.</p>
       <p>이번 달 실집행 광고비부터 페이백이 산정되며, 솔루션 이용이 오픈되었습니다.</p>
       <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;font-size:14px;">
         <div>콘솔 주소: <strong>${url}/app</strong></div>
         <div>아이디(이메일): <strong>${esc(params.loginEmail)}</strong></div>
         ${params.tempPassword ? `<div>임시 비밀번호: <strong style="font-family:monospace;">${esc(params.tempPassword)}</strong> (첫 로그인 시 변경)</div>` : ""}
       </div>
       <p style="text-align:center;">${button(`${url}/app`, "내 페이백 콘솔 열기")}</p>`,
    ),
  };
}

// E4: 월 정산서 발행 (정산 확정 시)
export function pbStatementEmail(params: {
  companyName: string;
  period: string; // YYYY-MM
  statementNo: string;
  adSpend: number;
  appliedRate: number;
  supplyValue: number;
  vat: number;
  total: number;
  invoiceCapable: boolean;
  writeDate: string;
  dueDate: string;
}): { subject: string; html: string } {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const [y, m] = params.period.split("-");
  return {
    subject: `[TeamFirst] ${y}년 ${Number(m)}월 페이백 정산서 (${params.statementNo})`,
    html: layout(
      `${y}년 ${Number(m)}월 페이백 정산서`,
      `<p>${esc(params.companyName)}님, ${Number(m)}월 페이백 정산이 확정되었습니다.</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;border-collapse:collapse;">
         <tr><td style="padding:6px 0;color:#6b7280;">정산서 번호</td><td style="padding:6px 0;text-align:right;font-weight:600;">${esc(params.statementNo)}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;">실집행 광고비 (VAT 제외)</td><td style="padding:6px 0;text-align:right;font-weight:600;">${params.adSpend.toLocaleString()}원</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;">적용 요율</td><td style="padding:6px 0;text-align:right;font-weight:600;">${params.appliedRate}%</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;">페이백 (공급가액)</td><td style="padding:6px 0;text-align:right;font-weight:600;">${params.supplyValue.toLocaleString()}원</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;">부가세</td><td style="padding:6px 0;text-align:right;font-weight:600;">${params.vat.toLocaleString()}원</td></tr>
         <tr><td style="padding:8px 0;border-top:1px solid #e5e7eb;font-weight:700;">지급 예정 합계</td><td style="padding:8px 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:800;color:#004AAD;">${params.total.toLocaleString()}원</td></tr>
       </table>
       ${
         params.invoiceCapable
           ? invoiceGuideHtml({
               supplyValue: params.supplyValue,
               writeDate: params.writeDate,
               dueDate: params.dueDate,
             })
           : `<p style="font-size:13px;color:#64748b;">귀사는 세금계산서 발행 대상이 아니므로(간이·면세) 계산서 절차 없이 공급가액이 지급됩니다.</p>`
       }
       <p style="text-align:center;">${button(`${url}/app/settlements`, "콘솔에서 정산서 보기")}</p>
       <p style="color:#64748b;font-size:12px;">페이백은 당월 실집행 광고비(VAT·무상쿠폰 제외, 매체 리포트 기준)로 매월 자동 산정됩니다. 지급은 매체 수수료 정산 입금 확인 후 매월 지급일에 진행됩니다.</p>`,
    ),
  };
}

// E5: 계산서 리마인드 (매월 5·9일 크론)
export function pbInvoiceRemindEmail(params: {
  companyName: string;
  period: string;
  supplyValue: number;
  writeDate: string;
  dueDate: string;
  dday: number;
}): { subject: string; html: string } {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    subject: `[TeamFirst] 세금계산서 발행 기한 D-${params.dday} — ${params.period} 정산분`,
    html: layout(
      `세금계산서 발행 안내 (D-${params.dday})`,
      `<p>${esc(params.companyName)}님, ${params.period} 정산분 세금계산서 발행 기한이 <strong>${params.dueDate} (D-${params.dday})</strong>입니다.</p>
       ${invoiceGuideHtml(params)}
       <p style="text-align:center;">${button(`${url}/app/settlements`, "정산서·발행 정보 확인")}</p>`,
    ),
  };
}

// E7: 보류(이월) 안내 (기한 경과)
export function pbInvoiceOverdueEmail(params: {
  companyName: string;
  period: string;
  supplyValue: number;
  writeDate: string;
  dueDate: string;
}): { subject: string; html: string } {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    subject: `[TeamFirst] ${params.period} 정산분 지급 보류 안내 (계산서 미발행)`,
    html: layout(
      "지급 보류(이월) 안내",
      `<p>${esc(params.companyName)}님, ${params.period} 정산분 세금계산서가 기한(${params.dueDate}) 내 확인되지 않아 <strong>지급이 보류(이월)</strong>되었습니다.</p>
       <p><strong>페이백 권리는 소멸하지 않습니다.</strong> 세금계산서 발행이 확인된 달의 지급일에 합산 지급됩니다.</p>
       ${invoiceGuideHtml(params)}
       <p style="text-align:center;">${button(`${url}/app/settlements`, "지금 발행 정보 확인")}</p>`,
    ),
  };
}

// E6: 지급 완료
export function pbPaidEmail(params: {
  companyName: string;
  periods: string[];
  supplyValue: number;
  vat: number;
  total: number;
  bankLast4: string;
}): { subject: string; html: string } {
  return {
    subject: `[TeamFirst] 페이백 지급 완료 (${params.total.toLocaleString()}원)`,
    html: layout(
      "페이백 지급 완료 💸",
      `<p>${esc(params.companyName)}님, 페이백이 지급되었습니다.</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;border-collapse:collapse;">
         <tr><td style="padding:6px 0;color:#6b7280;">대상 정산월</td><td style="padding:6px 0;text-align:right;font-weight:600;">${params.periods.join(", ")}</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;">공급가액</td><td style="padding:6px 0;text-align:right;font-weight:600;">${params.supplyValue.toLocaleString()}원</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;">부가세</td><td style="padding:6px 0;text-align:right;font-weight:600;">${params.vat.toLocaleString()}원</td></tr>
         <tr><td style="padding:8px 0;border-top:1px solid #e5e7eb;font-weight:700;">입금 합계</td><td style="padding:8px 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:800;color:#004AAD;">${params.total.toLocaleString()}원</td></tr>
         <tr><td style="padding:6px 0;color:#6b7280;">입금 계좌</td><td style="padding:6px 0;text-align:right;font-weight:600;">끝자리 ${esc(params.bankLast4)}</td></tr>
       </table>
       <p style="color:#64748b;font-size:13px;">이용해주셔서 감사합니다. 다음 달에도 페이백은 자동으로 산정됩니다.</p>`,
    ),
  };
}

// E8: 컨설팅 자동 해제 예고/확정 (D3)
export function pbConsultingTerminationEmail(params: {
  companyName: string;
  mode: "notice" | "final";
  effectiveDate: string; // 익월 1일
  minSpendLabel?: string; // 약정 요율표 기준 (예: "500만")
}): { subject: string; html: string } {
  const isNotice = params.mode === "notice";
  const min = params.minSpendLabel ?? "500만";
  return {
    subject: isNotice
      ? "[TeamFirst] 월간 전문가 컨설팅 옵션 해제 예정 안내"
      : "[TeamFirst] 월간 전문가 컨설팅 옵션이 해제되었습니다",
    html: layout(
      isNotice ? "컨설팅 옵션 해제 예정 안내" : "컨설팅 옵션 해제 완료",
      `<p>${esc(params.companyName)}님, 월간 전문가 컨설팅 옵션은 월 광고비 ${min} 원 이상 구간에서 이용 가능합니다.</p>
       ${
         isNotice
           ? `<p>최근 2개월 연속 월 광고비가 ${min} 원 미만으로 확인되어, <strong>${params.effectiveDate}부로 옵션이 자동 해제될 예정</strong>입니다. 해제 후에는 컨설팅 조정(−1%p)이 적용되지 않아 페이백률이 올라갑니다.</p>`
           : `<p><strong>${params.effectiveDate}부로 컨설팅 옵션이 해제</strong>되었습니다. 이번 달부터 컨설팅 조정(−1%p)이 적용되지 않습니다. 월 광고비가 다시 ${min} 원 이상이 되면 콘솔에서 재신청할 수 있습니다.</p>`
       }`,
    ),
  };
}

// 사용자 입력이 들어가는 값의 HTML 이스케이프 (운영자 알림 등)
function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// 운영자 알림: 신규 이벤트(매칭요청·광고주 가입·대행사 등록신청 등) 접수 안내
export function adminEventEmail(params: {
  heading: string;
  rows: [string, string][];
  linkUrl?: string;
  linkLabel?: string;
}): { subject: string; html: string } {
  const rowsHtml = params.rows
    .map(
      ([k, v]) =>
        `<tr>
           <td style="padding:8px 0;color:#6b7280;width:110px;vertical-align:top;">${esc(k)}</td>
           <td style="padding:8px 0;font-weight:600;color:#111827;">${esc(v)}</td>
         </tr>`,
    )
    .join("");
  return {
    subject: `[TeamFirst 운영] ${params.heading}`,
    html: layout(
      params.heading,
      `<p>콘솔에 새 이벤트가 접수되었습니다. 아래 내용을 확인해주세요.</p>
       <div style="margin:16px 0;padding:18px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;">
         <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;">${rowsHtml}</table>
       </div>
       ${params.linkUrl ? `<p style="text-align:center;">${button(params.linkUrl, params.linkLabel ?? "콘솔에서 확인")}</p>` : ""}`,
    ),
  };
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
       <p>파트너 계정이 발급되었습니다. 아래 임시 비밀번호로 로그인해주세요.
       첫 로그인 시 비밀번호 변경 화면으로 안내됩니다.</p>
       <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;font-size:14px;">
         <div>아이디(이메일): <strong>${params.email}</strong></div>
         <div>임시 비밀번호: <strong style="font-family:monospace;">${params.tempPassword}</strong></div>
       </div>
       <p>${button(params.loginUrl, "로그인하기")}</p>
       <p style="color:#64748b;font-size:13px;">보안을 위해 첫 로그인 후 반드시 비밀번호를 변경해주세요.</p>`,
    ),
  };
}

// 이미 발송된 계정 안내 메일을 정정하기 위한 임시 비밀번호 재발급 안내.
export function partnerCredentialsResetEmail(params: {
  companyName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "[TeamFirst] 임시 비밀번호 재발급 안내",
    html: layout(
      "임시 비밀번호 재발급 안내",
      `<p>${params.companyName} 담당자님, 안녕하세요. 팀퍼스트입니다.</p>
       <p>보안을 위해 파트너 계정의 <strong>임시 비밀번호를 새로 재발급</strong>해
       드렸습니다. 아래 정보로 로그인해주세요. 이전에 안내된 비밀번호는 더 이상
       사용되지 않으며, 첫 로그인 시 비밀번호 변경 화면으로 안내됩니다.</p>
       <div style="margin:16px 0;padding:16px;background:#f1f5f9;border-radius:8px;font-size:14px;">
         <div>아이디(이메일): <strong>${params.email}</strong></div>
         <div>임시 비밀번호: <strong style="font-family:monospace;">${params.tempPassword}</strong></div>
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

// 광고주에게: 대행사 모집 완료 + 결과 페이지 안내 (스크린샷 "모집 완료 및 결과 안내")
export function matchingResultEmail(params: {
  brandName: string;
  category?: string | null;
  candidateCount: number;
  resultUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `[TeamFirst] ${params.brandName} 대행사 모집 완료 및 결과 안내`,
    html: layout(
      "대행사 모집 완료 및 결과 안내",
      `<p>안녕하세요, 팀퍼스트입니다.</p>
       <p>진행되었던 <strong>${params.brandName}${params.category ? ` ${params.category}` : ""}</strong>
       대행사 모집이 마감되었으며, 최종 선정이 완료되었습니다.</p>
       <p>${params.brandName} 브랜드의 핵심 목표에 가장 적합한 파트너를 <strong>상대평가 방식</strong>으로
       선정하였으며, 총 <strong>${params.candidateCount}개 대행사</strong>가 매칭되었습니다.</p>
       <p>선정 결과 및 각 대행사의 제안 내용은 아래 버튼을 클릭하여 확인하실 수 있습니다.</p>
       <p style="text-align:center;">${button(params.resultUrl, "📋 선정 결과 페이지 바로가기")}</p>
       <p style="font-size:13px;color:#64748b;text-align:center;">
         결과 페이지에서 각 대행사의 점수 · 레퍼런스 · 제안 상세 내용을 확인하실 수 있습니다.
       </p>
       <div style="margin-top:16px;padding:14px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:13px;color:#92400e;">
         💡 <strong>다음 단계 안내</strong><br/>
         선정 결과 확인 후, 결과 페이지의 <strong>‘맞춤제안 화상미팅 일정 선택’</strong> 버튼으로
         미팅 일정을 등록해주시면 각 대행사와의 화상미팅을 순차적으로 안내드립니다.
       </div>`,
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
