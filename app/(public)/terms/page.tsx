export const metadata = { title: "이용약관 | TeamFirst" };

const SECTIONS: { h: string; body: string[] }[] = [
  {
    h: "제1조 (목적)",
    body: [
      "본 약관은 팀퍼스트(이하 '회사')가 제공하는 광고주-광고대행사 매칭 플랫폼 서비스(이하 '서비스')의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.",
    ],
  },
  {
    h: "제2조 (정의)",
    body: [
      "'광고주'란 광고대행을 의뢰하기 위해 서비스에 가입한 회원을 말합니다.",
      "'파트너 대행사'란 회사의 입점 기준을 통과하여 서비스에 등록된 광고대행사를 말합니다.",
      "'매칭'이란 광고주의 요청에 따라 적합한 파트너 대행사를 연결하는 일련의 과정을 말합니다.",
    ],
  },
  {
    h: "제3조 (서비스의 제공)",
    body: [
      "회사는 매칭 요청 접수, RFP 발송, 후보 대행사 추천, 미팅 일정 조율 등의 기능을 제공합니다.",
      "회사는 검증된 파트너 대행사만 노출하나, 매칭 결과 및 대행 계약의 성과를 보증하지 않습니다.",
    ],
  },
  {
    h: "제4조 (수수료)",
    body: [
      "대행이 성사된 경우 회사는 파트너 대행사와의 약정에 따라 대행수수료의 일부를 정산받을 수 있습니다.",
      "구체적인 수수료율과 정산 방식은 개별 계약으로 정합니다.",
    ],
  },
  {
    h: "제5조 (이용자의 의무)",
    body: [
      "이용자는 정확한 정보를 제공해야 하며, 허위 정보로 인한 불이익은 이용자가 부담합니다.",
      "이용자는 서비스를 통해 알게 된 상대방의 정보를 매칭 목적 외로 사용해서는 안 됩니다.",
    ],
  },
  {
    h: "제6조 (책임의 제한)",
    body: [
      "회사는 광고주와 파트너 대행사 간 체결된 대행 계약의 당사자가 아니며, 계약 이행에 대한 책임을 지지 않습니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-secondary">이용약관</h1>
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
        본 약관은 베타 운영을 위한 표준 초안입니다. 정식 서비스 전 법무 검토가
        필요합니다.
      </p>
    </div>
  );
}
