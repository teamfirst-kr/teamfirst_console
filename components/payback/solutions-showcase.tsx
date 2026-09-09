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

// 솔루션별 유튜브 소개 영상 (팀퍼스트 채널 업로드분) — videoTitle은 유튜브 공식 영상 제목
const SOLUTIONS = [
  {
    key: "log",
    no: "솔루션 1",
    name: "로그분석 프로그램",
    brand: "CatchLog",
    videoId: "GO2swOgoYZ8",
    videoTitle: "AI 로그분석 솔루션 - Catch LOG",
    tagline: "광고비를 갉아먹는 악성 클릭은 막고, 고객의 발자취는 읽습니다.",
    features: [
      {
        icon: "🛡️",
        title: "악성 클릭 IP 차단",
        body: "악의적인 경쟁사 클릭을 탐지해 IP 단위로 차단합니다. 자사몰뿐 아니라 스마트스토어까지 보호됩니다.",
      },
      {
        icon: "🔎",
        title: "고객 로그 퍼널 분석",
        body: "고객 로그 패턴을 퍼널로 시각화해 어디서 이탈하고 어디서 전환이 발생하는지 정확히 짚어줍니다.",
      },
    ],
  },
  {
    key: "report",
    no: "솔루션 2",
    name: "자동리포트",
    brand: "AUTO REPORT",
    videoId: "xLSD-jPsczI",
    videoTitle: "일/주/월 자동 커스텀 리포트 솔루션 - AUTO REPORT",
    tagline: "매번 엑셀 붙잡던 성과 정리, 이제 자동으로 도착합니다.",
    features: [
      {
        icon: "📊",
        title: "일간 / 주간 / 월간 자동 성과분석",
        body: "원하는 주기로 성과 리포트가 자동 생성됩니다. 니즈에 맞게 지표 구성을 커스텀할 수 있습니다.",
      },
      {
        icon: "⚖️",
        title: "기간별 성과비교를 간편하게",
        body: "전일·전주·전월 대비 변화를 한눈에 비교해, 좋아진 것과 나빠진 것을 바로 확인합니다.",
      },
    ],
  },
  {
    key: "bid",
    no: "솔루션 3",
    name: "성과최적화 입찰조정",
    brand: "AUTO BID",
    videoId: "RmjtpBuGC24",
    videoTitle: "ROAS & 매출볼륨 최적화 솔루션 - AUTO BID",
    tagline: "목표만 정해두면, 입찰가 조정은 분석부터 실행까지 한 번에.",
    features: [
      {
        icon: "🎯",
        title: "목표 기반 자동 분석",
        body: "매주 설정한 목표 ROAS와 매출볼륨에 따라 전체 입찰조정안을 자동 분석합니다.",
      },
      {
        icon: "🧩",
        title: "상품 성격별 차등 조절",
        body: "매출주력·신제품 등 상품 성격에 따라 목표 성과를 차등 설정할 수 있습니다.",
      },
      {
        icon: "⚡",
        title: "원클릭 일괄 조정",
        body: "설정한 기준에 따라 산출된 입찰가를 클릭 한 번으로 일괄 반영합니다.",
      },
    ],
  },
];

export function SolutionsShowcase() {
  return (
    <div className="mt-14 space-y-16">
      {SOLUTIONS.map((s, idx) => (
        <Reveal key={s.no}>
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
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
              <SolutionDetailButton
                title={s.name}
                html={SOLUTION_DETAILS[s.key] ?? ""}
              />
            </div>
            <div className={idx % 2 === 1 ? "md:order-1" : ""}>
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
