import { Reveal } from "@/components/reveal";

// 팀퍼스트 소속 마케터 — 익명 프로필 무한 슬라이드.
// TODO(운영): 아래 목록은 실제 소속 마케터 명단(익명 처리)으로 교체할 것.
//             표기는 익명 유지(마케터 A/B…), 카테고리·담당 채널만 노출한다.
const MARKETERS = [
  { alias: "마케터 A", category: "뷰티 · 코스메틱", channels: ["네이버 SA", "쇼핑검색"] },
  { alias: "마케터 B", category: "패션 · 잡화", channels: ["메타", "GFA"] },
  { alias: "마케터 C", category: "식품 · 건강기능식품", channels: ["네이버 SA", "쿠팡"] },
  { alias: "마케터 D", category: "리빙 · 인테리어", channels: ["쇼핑검색", "구글"] },
  { alias: "마케터 E", category: "병의원 · 클리닉", channels: ["네이버 SA", "플레이스"] },
  { alias: "마케터 F", category: "교육 · 서비스", channels: ["네이버 SA", "메타"] },
  { alias: "마케터 G", category: "유아 · 키즈", channels: ["쇼핑검색", "카카오"] },
  { alias: "마케터 H", category: "B2B · 산업재", channels: ["네이버 SA", "구글"] },
];

function MarketerCard({
  alias,
  category,
  channels,
}: {
  alias: string;
  category: string;
  channels: string[];
}) {
  return (
    <div className="mx-2 w-60 shrink-0 rounded-2xl border border-white/12 bg-white/[0.04] p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-lg">
          👤
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">{alias}</p>
          <p className="text-[11px] text-sky-300">팀퍼스트 소속 마케터</p>
        </div>
      </div>
      <p className="mt-3.5 break-keep text-sm font-semibold text-white/90">
        {category}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {channels.map((c) => (
          <span
            key={c}
            className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/60"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MarketerSlider() {
  return (
    <Reveal className="tf-marquee mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="tf-marquee-track">
        {/* 무한 루프를 위해 동일 목록을 2회 렌더 (트랙 -50% 이동) */}
        {[...MARKETERS, ...MARKETERS].map((m, i) => (
          <MarketerCard key={`${m.alias}-${i}`} {...m} />
        ))}
      </div>
    </Reveal>
  );
}
