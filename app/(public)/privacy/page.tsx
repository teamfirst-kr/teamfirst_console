export const metadata = { title: "개인정보처리방침 | TeamFirst" };

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "1. 수집하는 개인정보 항목",
    body: [
      "광고주: 회사명, 담당자명, 이메일, 연락처, 홈페이지, 캠페인 정보, 광고비 증빙 자료",
      "파트너 대행사: 회사명, 담당자명/직책, 이메일, 연락처, 홈페이지, 포트폴리오, 매체·KPI 등 매칭 정보",
    ],
  },
  {
    h: "2. 개인정보의 수집 및 이용 목적",
    body: [
      "광고주-파트너 대행사 간 매칭 서비스 제공",
      "RFP 발송, 후보 추천, 미팅 일정 조율 등 서비스 운영",
      "서비스 관련 공지 및 안내 메일 발송",
    ],
  },
  {
    h: "3. 개인정보의 보유 및 이용 기간",
    body: [
      "회원 탈퇴 또는 매칭 종료 시까지 보유하며, 관련 법령에 따라 일정 기간 보관할 수 있습니다.",
      "이용자의 삭제 요청 시 지체 없이 파기합니다. (관련 법령상 보존 의무가 있는 경우 제외)",
    ],
  },
  {
    h: "4. 개인정보의 제3자 제공",
    body: [
      "매칭 목적 달성을 위해 광고주↔파트너 대행사 간 필요한 범위의 정보가 상호 제공됩니다.",
      "그 외에는 이용자의 동의 없이 제3자에게 제공하지 않습니다.",
    ],
  },
  {
    h: "5. 개인정보 처리 위탁",
    body: [
      "서비스 운영을 위해 클라우드 인프라(Supabase), 이메일 발송(Resend), 호스팅(Vercel) 등에 처리를 위탁할 수 있습니다.",
    ],
  },
  {
    h: "6. 이용자의 권리",
    body: [
      "이용자는 언제든지 본인의 개인정보를 조회·수정·삭제하거나 처리 정지를 요청할 수 있습니다.",
    ],
  },
  {
    h: "7. 개인정보 보호책임자",
    body: ["팀퍼스트 운영팀 (정기윤) — 문의는 서비스 내 운영팀 연락처로 가능합니다."],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-secondary">개인정보처리방침</h1>
      <p className="mt-1 text-sm text-muted-foreground">시행일: 2026년 6월 1일</p>
      <div className="mt-8 space-y-6">
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="text-base font-semibold text-foreground">{s.h}</h2>
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-muted-foreground leading-relaxed">
              {s.body.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-10 text-xs text-muted-foreground">
        본 방침은 베타 운영을 위한 표준 초안입니다. 정식 서비스 전 법무 검토가
        필요합니다.
      </p>
    </div>
  );
}
