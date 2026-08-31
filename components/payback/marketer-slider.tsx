import { Reveal } from "@/components/reveal";
import { MARKETER_AVATARS } from "./marketer-avatars";

// 팀퍼스트 소속 마케터 — 닉네임 프로필 무한 슬라이드.
// 닉네임은 실제 활동명이며, 카테고리·특장점·담당 채널은 운영 기준에 맞춰 조정 가능.
const MARKETERS = [
  {
    alias: "퍼포맨",
    category: "뷰티 · 코스메틱",
    strength: "신제품 런칭 초기 키워드 확장과 CPA 안정화에 강합니다",
    channels: ["네이버 SA", "쇼핑검색"],
  },
  {
    alias: "재리",
    category: "패션 · 잡화",
    strength: "시즌·컬렉션 단위 소재 테스트 설계가 주특기입니다",
    channels: ["메타", "GFA"],
  },
  {
    alias: "JIN",
    category: "식품 · 건강기능식품",
    strength: "재구매·정기구독으로 이어지는 퍼널 설계에 강합니다",
    channels: ["네이버 SA", "쿠팡"],
  },
  {
    alias: "MIN",
    category: "리빙 · 인테리어",
    strength: "고관여 상품의 긴 탐색 여정을 리마케팅으로 잇습니다",
    channels: ["쇼핑검색", "구글"],
  },
  {
    alias: "후니",
    category: "병의원 · 클리닉",
    strength: "지역 타겟과 플레이스를 엮어 내원 문의를 만듭니다",
    channels: ["네이버 SA", "플레이스"],
  },
  {
    alias: "YOU",
    category: "교육 · 서비스",
    strength: "상담 신청(리드) 단가 최적화가 주특기입니다",
    channels: ["네이버 SA", "메타"],
  },
  {
    alias: "HYUN",
    category: "유아 · 키즈",
    strength: "커뮤니티 검색어 발굴과 시즌 대응이 빠릅니다",
    channels: ["쇼핑검색", "카카오"],
  },
  {
    alias: "ANNA",
    category: "B2B · 산업재",
    strength: "검토 주기가 긴 B2B 리드를 검색광고로 확보합니다",
    channels: ["네이버 SA", "구글"],
  },
  {
    alias: "HJ",
    category: "스포츠 · 레저",
    strength: "시즌·날씨 변수에 맞춘 예산 배분에 강합니다",
    channels: ["메타", "쇼핑검색"],
  },
  {
    alias: "MK",
    category: "반려동물",
    strength: "재구매 주기에 맞춘 상품별 입찰 운영이 강점입니다",
    channels: ["네이버 SA", "쿠팡"],
  },
  {
    alias: "HYOHYO",
    category: "뷰티 디바이스 · 가전",
    strength: "고단가 상품의 비교검색 구간을 집중 공략합니다",
    channels: ["GFA", "메타"],
  },
  {
    alias: "WOO",
    category: "여행 · 액티비티",
    strength: "예약 리드타임을 고려한 기간별 집행 설계에 강합니다",
    channels: ["네이버 SA", "카카오"],
  },
];

function MarketerCard({
  alias,
  category,
  strength,
  channels,
  index,
}: {
  alias: string;
  category: string;
  strength: string;
  channels: string[];
  index: number;
}) {
  const Avatar = MARKETER_AVATARS[index % MARKETER_AVATARS.length];
  return (
    <div className="mx-2 flex h-full w-64 shrink-0 flex-col rounded-2xl border border-white/12 bg-white/[0.04] p-5">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
        <Avatar className="h-16 w-16 text-white/85" />
      </span>
      <p className="mt-3.5 text-center text-base font-bold text-white">{alias}</p>
      <p className="mt-1 text-center text-[13px] font-semibold text-sky-300">
        {category}
      </p>
      <p className="mt-2.5 min-h-[3.4rem] break-keep text-center text-[12.5px] leading-relaxed text-white/65">
        {strength}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {channels.map((c) => (
          <span
            key={c}
            className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] text-white/55"
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
      <div
        className="tf-marquee-track items-stretch"
        style={{ animationDuration: "38.4s" }}
      >
        {/* 무한 루프를 위해 동일 목록을 2회 렌더 (트랙 -50% 이동) */}
        {[...MARKETERS, ...MARKETERS].map((m, i) => (
          <MarketerCard key={`${m.alias}-${i}`} {...m} index={i % MARKETERS.length} />
        ))}
      </div>
    </Reveal>
  );
}
