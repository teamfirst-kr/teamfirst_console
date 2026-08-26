// 솔루션 상세 팝업 콘텐츠 (iframe srcDoc으로 격리 렌더링되는 독립 HTML 문서).
// 사용자가 제공하는 상세 페이지 HTML로 교체한다 — 빈 문자열이면 버튼이 숨겨진다.

const BASE_STYLE = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Apple SD Gothic Neo', Pretendard, system-ui, sans-serif; color: #0f172a; line-height: 1.7; word-break: keep-all; }
    .wrap { max-width: 860px; margin: 0 auto; padding: 40px 24px 64px; }
    .hero { background: #111E38; color: #fff; padding: 48px 24px; text-align: center; }
    .hero h1 { font-size: 28px; }
    .hero p { margin-top: 10px; color: rgba(255,255,255,.7); font-size: 15px; }
    .badge { display: inline-block; background: rgba(56,189,248,.2); color: #7dd3fc; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 999px; margin-bottom: 14px; }
    h2 { font-size: 20px; color: #111E38; margin: 36px 0 12px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-top: 12px; }
    .card strong { color: #111E38; }
    .card p { margin-top: 6px; font-size: 14px; color: #475569; }
    .note { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
`;

function placeholder(no: string, name: string, tagline: string, items: [string, string][]): string {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${BASE_STYLE}</head><body>
  <div class="hero"><span class="badge">${no}</span><h1>${name}</h1><p>${tagline}</p></div>
  <div class="wrap">
    ${items
      .map(
        ([t, b]) => `<div class="card"><strong>${t}</strong><p>${b}</p></div>`,
      )
      .join("")}
    <p class="note">상세 소개 페이지가 곧 업데이트됩니다. 문의: team1st2025@gmail.com</p>
  </div>
</body></html>`;
}

export const SOLUTION_DETAILS: Record<string, string> = {
  log: placeholder(
    "솔루션 1",
    "로그분석 프로그램",
    "광고비를 갉아먹는 악성 클릭은 막고, 고객의 발자취는 읽습니다.",
    [
      [
        "🛡️ 악성 클릭 IP 차단",
        "악의적인 경쟁사 클릭을 탐지해 IP 단위로 차단합니다. 자사몰뿐 아니라 스마트스토어까지 보호됩니다.",
      ],
      [
        "🔎 고객 로그 퍼널 분석",
        "고객 로그 패턴을 퍼널로 시각화해 어디서 이탈하고 어디서 전환이 발생하는지 정확히 짚어줍니다.",
      ],
    ],
  ),
  report: placeholder(
    "솔루션 2",
    "자동리포트 (AUTO REPORT)",
    "매번 엑셀 붙잡던 성과 정리, 이제 자동으로 도착합니다.",
    [
      [
        "📊 일간 / 주간 / 월간 자동 성과분석",
        "원하는 주기로 성과 리포트가 자동 생성됩니다. 니즈에 맞게 지표 구성을 커스텀할 수 있습니다.",
      ],
      [
        "⚖️ 기간별 성과비교",
        "전일·전주·전월 대비 변화를 한눈에 비교해, 좋아진 것과 나빠진 것을 바로 확인합니다.",
      ],
    ],
  ),
  bid: placeholder(
    "솔루션 3",
    "성과최적화 입찰조정",
    "목표만 정해두면, 입찰가 조정은 분석부터 실행까지 한 번에.",
    [
      [
        "🎯 목표 기반 자동 분석",
        "매주 설정한 목표 ROAS와 매출볼륨에 따라 전체 입찰조정안을 자동 분석합니다.",
      ],
      [
        "🧩 상품 성격별 차등 조절",
        "매출주력·신제품 등 상품 성격에 따라 목표 성과를 차등 설정할 수 있습니다.",
      ],
      [
        "⚡ 원클릭 일괄 조정",
        "설정한 기준에 따라 산출된 입찰가를 클릭 한 번으로 일괄 반영합니다.",
      ],
    ],
  ),
};
