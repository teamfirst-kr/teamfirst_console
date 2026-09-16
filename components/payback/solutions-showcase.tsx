import { Reveal } from "@/components/reveal";
import { SolutionDetailButton } from "./solution-detail-modal";
import { SOLUTION_DETAILS } from "./solution-details";
import { YouTubeEmbed } from "./youtube-embed";

// 페이백 랜딩 — 자체 개발 솔루션 3종 상세 쇼케이스.
// 각 솔루션의 비주얼은 유튜브 소개 영상 썸네일(클릭 시 인라인 재생)로 보여준다.
// 이전의 CSS 목업(예시 화면)은 영상으로 대체 — 필요 시 git 이력(#60 이전)에서 복원.

function WindowFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0B1530] shadow-2xl shadow-black/30">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 text-[11px] font-medium text-white/50">{title}</span>
      </div>
      {children}
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-white/65">{body}</p>
      </div>
    </li>
  );
}

// 솔루션별 유튜브 소개 영상 (팀퍼스트 채널 업로드분) — videoTitle은 유튜브 공식 영상 제목.
// features/highlights는 각 소개 영상 자막의 실제 기능 설명을 정리한 것 (D-074).
const SOLUTIONS = [
  {
    key: "log",
    no: "솔루션 1",
    name: "로그분석 프로그램",
    brand: "CatchLog",
    videoId: "GO2swOgoYZ8",
    videoTitle: "AI 로그분석 솔루션 - Catch LOG",
    tagline: "광고비를 갉아먹는 악성 클릭은 막고, 고객의 발자취는 읽고, AI가 개선점까지 짚어줍니다.",
    features: [
      {
        icon: "🛡️",
        title: "부정클릭 IP 탐지 · 원클릭 차단",
        body: "어떤 키워드에서 어느 IP가 몇 번, 어느 위치에서 중복 클릭했는지 확인하고, 버튼 한 번으로 네이버 광고시스템 노출 제한에 등록합니다. 지역을 옮겨가며 IP가 바뀌는 모바일도 기기·통신사까지 추적합니다.",
      },
      {
        icon: "🏪",
        title: "자사몰은 물론 스마트스토어까지",
        body: "스크립트를 심을 수 없는 스마트스토어도 추적용 URL 방식으로 광고 클릭과 부정클릭을 잡아냅니다. 일반 로그분석이 못 하는 영역입니다.",
      },
      {
        icon: "🔎",
        title: "사이트 · 채널 · 시간대 분석",
        body: "PC/모바일 방문과 매출, 신규·재방문, 첫 전환과 재구매(리텐션) 비율, 직접·네이버·구글 등 유입 경로, 유입이 몰리는 요일·시간대를 14일 단위로 비교합니다.",
      },
      {
        icon: "🤖",
        title: "AI 사이트 분석 · 성과 진단",
        body: "유입→탐색→전환 비율과 랜딩페이지별 매출을 분석하고, 검색광고 ROAS가 지난 7일 대비 오르내린 원인을 캠페인 단위로 설명합니다. 브랜드 키워드와 일반 키워드 성과를 분리해 '원래 살 고객'의 착시를 걷어냅니다.",
      },
      {
        icon: "🚰",
        title: "누수 기회 진단",
        body: "매출 없이 광고비만 쓴 키워드·캠페인·페이지를 한 번에 골라내 줄일 곳을 알려줍니다.",
      },
      {
        icon: "💬",
        title: "상담 챗봇 내장",
        body: "홈페이지에 톡 형태 상담 챗봇을 켜고 첫 인사·자동응답·테마·로고를 설정합니다. 들어온 상담은 한 화면에서 이력 확인과 답변이 가능합니다.",
      },
    ],
    highlights: ["유효 클릭(중복 IP 제외) 집계", "네이버 노출 제한 연동", "랜딩 URL별 성과 등록", "브랜드/일반 키워드 분리", "14일 기간 비교"],
  },
  {
    key: "report",
    no: "솔루션 2",
    name: "자동리포트",
    brand: "AUTO REPORT",
    videoId: "xLSD-jPsczI",
    videoTitle: "일/주/월 자동 커스텀 리포트 솔루션 - AUTO REPORT",
    tagline: "광고시스템 ID만 연결하면, 보고 싶은 리포트가 매일 메일함에 도착합니다.",
    features: [
      {
        icon: "📈",
        title: "한눈에 보는 대시보드",
        body: "개편된 네이버 광고시스템에서 보기 어려워진 구매전환·캠페인별 비용·매출을 한 화면에. 보고 싶은 지표를 골라 추이 그래프로 겹쳐 보고, 최근 7일·30일·전월로 기간을 바꿔 봅니다.",
      },
      {
        icon: "🧭",
        title: "캠페인 · 그룹 · 키워드 · 기기 · 시간대",
        body: "캠페인, 광고그룹, 키워드, PC/모바일, 요일·시간대까지 단계별로 내려가며 어디서 성과가 났는지 확인합니다.",
      },
      {
        icon: "📊",
        title: "일간 / 주간 / 월간 / 맞춤 기간 리포트",
        body: "요약·캠페인·유형별(쇼핑/파워링크/브랜드검색/파워콘텐츠)·기기별·그룹별·쇼핑 검색어별·시간대별 시트가 자동 생성됩니다. 성과 없는 키워드는 따로 분류하고, 구매가 난 시간대는 굵게 표시합니다. 월간은 전월 대비 비교까지.",
      },
      {
        icon: "📬",
        title: "이메일 자동 발송",
        body: "발송 스케줄만 체크하면 리포트가 메일로 옵니다. 메일 본문에 대시보드 요약이 들어 있어 '지난주보다 비용은 17만 원 늘었는데 전환매출은 150만 원 줄었네'를 엑셀 없이 바로 읽습니다.",
      },
      {
        icon: "🧩",
        title: "커스텀 시트",
        body: "기본 시트로 부족하면 원하는 차원(캠페인·유형·그룹·키워드)과 지표(노출·클릭 등)를 조합해 나만의 시트를 추가합니다.",
      },
      {
        icon: "💡",
        title: "성과 개선 전략 — 증액 · 감액 · 원클릭 계정 분석",
        body: "ROAS를 유지하며 볼륨을 키울 그룹과 투입 예산·기대 매출을 제안(예: 69만 원→89만 원 투입 시 매출 130만 원)하고, 매출 없는 그룹·검색어는 얼마를 줄일지 짚어줍니다. 원클릭 분석은 이를 종합 요약해 줍니다.",
      },
    ],
    highlights: ["광고시스템 ID만 입력", "엑셀 다운로드", "전월 대비 비교", "약 140개 광고주 사용 중"],
  },
  {
    key: "bid",
    no: "솔루션 3",
    name: "성과최적화 입찰조정",
    brand: "AUTO BID",
    videoId: "RmjtpBuGC24",
    videoTitle: "ROAS & 매출볼륨 최적화 솔루션 - AUTO BID",
    tagline: "목표 ROAS만 정해두면 소재·키워드별 입찰가를 규칙대로 조정합니다. 매출 볼륨은 지키면서.",
    features: [
      {
        icon: "🎯",
        title: "쇼핑검색 · 파워링크 각각 최적화",
        body: "쇼핑검색은 소재 ID별, 파워링크는 키워드별로 주차 성과와 목표 ROAS를 비교해 현재 입찰가 대비 조정안을 산출합니다.",
      },
      {
        icon: "⚖️",
        title: "증액 · 감액 비율 규칙",
        body: "목표 ROAS를 초과 달성하면 설정한 비율만큼 올리고(예: 10% → 1,000원이 1,100원), 미달이면 내립니다. 공격적으로 50%를 줄 수도 있습니다.",
      },
      {
        icon: "🛡️",
        title: "볼륨 보호",
        body: "ROAS만 좇다 광고비를 줄여 매출까지 쪼그라드는 함정을 막습니다. 최근 4주 매출 대비 일정 비율(예: 10%) 이상 떨어지면 감액을 보류합니다.",
      },
      {
        icon: "🚧",
        title: "조정 제외 조건",
        body: "노출순위 6위 아래, 4주간 3만 원 미만 소진 등 데이터가 적은 키워드는 건드리지 않고, 최저 입찰가(예: 300원) 아래로는 내리지 않습니다.",
      },
      {
        icon: "🧩",
        title: "제품 분류별 차등 목표",
        body: "일반·집중홍보 등 분류마다 ROAS 계수(예: 0.8 → 목표 300%가 240%로)와 증감 비율을 따로 두고, 특정 소재는 개별 목표로 예외 처리합니다.",
      },
      {
        icon: "⚡",
        title: "원클릭 일괄 반영",
        body: "산출된 입찰가를 한 번에 반영합니다. 처음 세팅은 전문가가 브랜드 데이터에 맞춰 잡아드리고, 이후엔 필요할 때만 세부 조정하면 됩니다.",
      },
    ],
    highlights: ["목표 ROAS 기준", "소재 ID · 키워드 단위", "볼륨 보호", "최저 입찰가 가드", "첫 달 전문가 세팅"],
  },
];

export function SolutionsShowcase() {
  return (
    <div className="mt-14 space-y-16">
      {SOLUTIONS.map((s, idx) => (
        <Reveal key={s.no}>
          <div className="grid items-start gap-8 md:grid-cols-2 md:gap-12">
            <div className={idx % 2 === 1 ? "md:order-2" : ""}>
              <span className="rounded-full bg-sky-400/20 px-2.5 py-0.5 text-xs font-bold text-sky-300">
                {s.no}
              </span>
              <h3 className="mt-3 text-2xl font-extrabold text-white">{s.name}</h3>
              <p className="mt-1.5 text-sm text-white/70">{s.tagline}</p>
              <ul className="mt-6 space-y-4">
                {s.features.map((f) => (
                  <FeatureItem key={f.title} {...f} />
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {s.highlights.map((h) => (
                  <span
                    key={h}
                    className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/75"
                  >
                    {h}
                  </span>
                ))}
              </div>
              <SolutionDetailButton
                title={s.name}
                html={SOLUTION_DETAILS[s.key] ?? ""}
              />
            </div>
            <div className={(idx % 2 === 1 ? "md:order-1 " : "") + "md:sticky md:top-24"}>
              <WindowFrame title={s.videoTitle}>
                <YouTubeEmbed
                  videoId={s.videoId}
                  videoTitle={s.videoTitle}
                  trackingKey={s.key}
                  label={`${s.brand} 소개 영상 보기`}
                />
              </WindowFrame>
            </div>
          </div>
        </Reveal>
      ))}
      <Reveal>
        <div className="mx-auto max-w-3xl rounded-2xl border border-sky-400/30 bg-sky-400/[0.07] p-7 text-center">
          <p className="text-2xl">🤝</p>
          <p className="mt-2 break-keep text-lg font-extrabold text-white">
            솔루션 설정, 어렵지 않습니다
          </p>
          <p className="mt-2 break-keep text-sm leading-relaxed text-white/75">
            초기 브랜드 상황에 맞춰{" "}
            <strong className="text-sky-200">전문가가 직접 AI 최적화 세팅을 설명하고
            진행</strong>
            해드립니다. 세팅부터 해석까지 혼자 하실 필요 없습니다.
          </p>
        </div>
      </Reveal>
      <p className="text-center text-xs text-white/55">
        🧪 새로운 솔루션을 계속 고민하고 개발하고 있습니다
      </p>
    </div>
  );
}
