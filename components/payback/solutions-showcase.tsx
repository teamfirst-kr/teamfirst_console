import { Reveal } from "@/components/reveal";
import { SolutionDetailButton } from "./solution-detail-modal";
import { SOLUTION_DETAILS } from "./solution-details";

// 페이백 랜딩 — 자체 개발 솔루션 3종 상세 쇼케이스.
// 스크린샷 대신 CSS로 그린 예시 화면(목업)을 사용한다 (외부 이미지 의존 없음).

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
      <div className="p-4">{children}</div>
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

// ── 예시 화면 1: 로그분석 — 차단 로그 + 퍼널 ─────────────────────────
function LogAnalyticsMock() {
  const funnel = [
    { label: "광고 유입", pct: 100 },
    { label: "상품 조회", pct: 62 },
    { label: "장바구니", pct: 31 },
    { label: "구매 전환", pct: 12 },
  ];
  return (
    <WindowFrame title="로그분석 — 실시간 차단 · 퍼널">
      <div className="space-y-3">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            악성 클릭 차단 로그
          </p>
          <div className="mt-2 space-y-1.5 font-mono text-[11px]">
            {[
              ["211.34.***.12", "동일 IP 47회 클릭", "차단"],
              ["118.220.***.88", "전환 0 · 반복 유입", "차단"],
              ["175.113.***.5", "심야 집중 클릭", "감시"],
            ].map(([ip, reason, act]) => (
              <div key={ip} className="flex items-center justify-between gap-2">
                <span className="text-white/80">{ip}</span>
                <span className="hidden flex-1 truncate text-white/40 sm:block">
                  {reason}
                </span>
                <span
                  className={
                    "rounded px-1.5 py-0.5 text-[10px] font-bold " +
                    (act === "차단"
                      ? "bg-red-400/20 text-red-300"
                      : "bg-amber-400/20 text-amber-300")
                  }
                >
                  {act}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
            전환 퍼널
          </p>
          <div className="mt-2 space-y-1.5">
            {funnel.map((f, i) => (
              <div key={f.label} className="flex items-center gap-2 text-[11px]">
                <span className="w-14 shrink-0 text-white/60">{f.label}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-white/10">
                  <div
                    className={
                      "h-full rounded " +
                      (i === funnel.length - 1 ? "bg-sky-400" : "bg-sky-400/50")
                    }
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
                <span className="w-9 text-right font-semibold text-white/80">
                  {f.pct}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-amber-300/90">
            ▲ 장바구니 → 구매 구간 이탈 집중 — 개선 포인트
          </p>
        </div>
      </div>
    </WindowFrame>
  );
}

// ── 예시 화면 2: 자동리포트 — 탭 + 미니 차트 + 비교 ──────────────────
function AutoReportMock() {
  const bars = [42, 58, 48, 70, 64, 86, 78];
  return (
    <WindowFrame title="자동리포트 — 주간 성과">
      <div className="space-y-3">
        <div className="flex gap-1.5">
          {["일간", "주간", "월간"].map((t) => (
            <span
              key={t}
              className={
                "rounded-md px-2.5 py-1 text-[11px] font-medium " +
                (t === "주간"
                  ? "bg-sky-400/25 text-sky-200"
                  : "bg-white/5 text-white/50")
              }
            >
              {t}
            </span>
          ))}
          <span className="ml-auto rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-white/50">
            ⚙ 커스텀
          </span>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <div className="flex h-24 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className={
                  "flex-1 rounded-t " + (i === 5 ? "bg-sky-400" : "bg-sky-400/40")
                }
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-white/40">
            <span>월</span><span>화</span><span>수</span><span>목</span>
            <span>금</span><span>토</span><span>일</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["ROAS", "412%", "+18%p"],
            ["전환수", "128건", "+22%"],
            ["CPA", "8,120원", "−15%"],
          ].map(([k, v, d]) => (
            <div key={k} className="rounded-lg bg-white/5 p-2">
              <p className="text-[10px] text-white/50">{k}</p>
              <p className="text-sm font-extrabold text-white">{v}</p>
              <p className="text-[10px] font-semibold text-emerald-300">
                전주 대비 {d}
              </p>
            </div>
          ))}
        </div>
      </div>
    </WindowFrame>
  );
}

// ── 예시 화면 3: 입찰조정 — 목표 + 차등 조절 + 원클릭 ────────────────
function BidOptimizerMock() {
  return (
    <WindowFrame title="성과최적화 입찰조정 — 주간 제안">
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-[11px]">
          <span className="text-white/60">이번 주 목표</span>
          <span className="font-semibold text-white">
            ROAS <span className="text-sky-300">400%</span> · 매출볼륨{" "}
            <span className="text-sky-300">유지</span>
          </span>
        </div>
        <div className="space-y-1.5">
          {[
            { name: "베스트 상품 A", tag: "매출주력", tagCls: "bg-sky-400/20 text-sky-300", from: "1,200", to: "1,450", up: true },
            { name: "신제품 B", tag: "신제품", tagCls: "bg-violet-400/20 text-violet-300", from: "900", to: "1,150", up: true },
            { name: "저효율 키워드 C", tag: "효율관리", tagCls: "bg-white/10 text-white/60", from: "1,100", to: "780", up: false },
          ].map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-[11px]"
            >
              <span className="min-w-0 truncate font-medium text-white/85">{r.name}</span>
              <span
                className={`hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold sm:inline ${r.tagCls}`}
              >
                {r.tag}
              </span>
              <span className="shrink-0 font-mono text-white/50">
                {r.from}원 →{" "}
                <span className={r.up ? "font-bold text-emerald-300" : "font-bold text-red-300"}>
                  {r.to}원 {r.up ? "▲" : "▼"}
                </span>
              </span>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-sky-500/90 py-2 text-center text-xs font-bold text-white">
          ⚡ 원클릭 일괄 조정 (3건)
        </div>
      </div>
    </WindowFrame>
  );
}

const SOLUTIONS = [
  {
    key: "log",
    no: "솔루션 1",
    name: "로그분석 프로그램",
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
    mock: <LogAnalyticsMock />,
  },
  {
    key: "report",
    no: "솔루션 2",
    name: "자동리포트",
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
    mock: <AutoReportMock />,
  },
  {
    key: "bid",
    no: "솔루션 3",
    name: "성과최적화 입찰조정",
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
    mock: <BidOptimizerMock />,
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
            <div className={idx % 2 === 1 ? "md:order-1" : ""}>{s.mock}</div>
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
      <Reveal>
        <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-white/20 p-6 text-center">
          <p className="text-2xl">🧪</p>
          <p className="mt-2 font-semibold text-white">
            새로운 솔루션을 계속 고민하고 개발하고 있습니다
          </p>
          <p className="mt-1 text-sm leading-relaxed text-white/65">
            솔루션이 추가되어도 이용 비용은 추가되지 않습니다.
          </p>
        </div>
      </Reveal>
      <p className="text-center text-xs text-white/65">
        위 화면은 이해를 돕기 위한 예시 화면입니다. 실제 화면은 서비스에서 확인하실 수 있습니다.
      </p>
    </div>
  );
}
