// 마케터 프로필용 라인아트 캐릭터 아바타 (외부 이미지 의존 없이 인라인 SVG).
// 명함 캐릭터 톤의 단색 선화 — 얼굴이 가려지지 않도록 머리는 두상 바깥에만 그린다.

type AvatarProps = { className?: string };

const HEAD = { cx: 32, cy: 25, r: 11 };

function Base({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* 어깨 · 목 · 두상 (공통) */}
      <path d="M13 55c0-9 8-14 19-14s19 5 19 14" />
      <path d="M27.5 34.5v4.5M36.5 34.5v4.5" />
      <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} />
      {children}
    </svg>
  );
}

// 표정 (공통) — 눈 2개 + 미소
function Face({ eyes = "dot" }: { eyes?: "dot" | "glasses" }) {
  return (
    <>
      {eyes === "dot" ? (
        <path d="M28 24h.01M36 24h.01" strokeWidth={2.8} />
      ) : (
        <>
          <circle cx="27.8" cy="24" r="3.1" />
          <circle cx="36.2" cy="24" r="3.1" />
          <path d="M30.9 24h2.2M24.7 23.4l-2.6-.6M39.3 23.4l2.6-.6" />
        </>
      )}
      <path d="M29.4 29c1.7 1.4 3.5 1.4 5.2 0" />
    </>
  );
}

// 1. 긴 생머리
function AvatarA({ className }: AvatarProps) {
  return (
    <Base className={className}>
      <path d="M21 25c0-11 6-16 11-16s11 5 11 16" />
      <path d="M21 24c-1.2 8-1.4 14-.6 19M43 24c1.2 8 1.4 14 .6 19" />
      <Face />
    </Base>
  );
}

// 2. 단발 + 안경
function AvatarB({ className }: AvatarProps) {
  return (
    <Base className={className}>
      <path d="M21 25c0-11 6-16 11-16s11 5 11 16" />
      <path d="M21 24c-.6 5-.6 8 0 11M43 24c.6 5 .6 8 0 11" />
      <Face eyes="glasses" />
    </Base>
  );
}

// 3. 숏컷 + 사이드 웨이브
function AvatarC({ className }: AvatarProps) {
  return (
    <Base className={className}>
      <path d="M21.6 24c.4-10 5.2-15 10.4-15s9.8 5 10.4 15" />
      <path d="M22 22c2.5-3 7-4.5 10-4.5s7.5 1.5 10 4.5" />
      <Face />
    </Base>
  );
}

// 4. 셔츠 + 넥타이
function AvatarD({ className }: AvatarProps) {
  return (
    <Base className={className}>
      <path d="M22.5 21c1.5-6.5 5.2-10 9.5-10s8 3.5 9.5 10" />
      <Face />
      <path d="M27.5 39l4.5 4 4.5-4" />
      <path d="M32 43l-1.7 3 1.7 5 1.7-5z" />
    </Base>
  );
}

// 5. 짧은 머리 + 라운드넥
function AvatarE({ className }: AvatarProps) {
  return (
    <Base className={className}>
      <path d="M23 20.5c2-6 5.4-9.5 9-9.5s7 3.5 9 9.5" />
      <Face />
      <path d="M27 39.5c1.8 3.2 8.2 3.2 10 0" />
    </Base>
  );
}

// 6. 안경 + 수염
function AvatarF({ className }: AvatarProps) {
  return (
    <Base className={className}>
      <path d="M22.5 21.5c1.5-6.8 5.2-10.5 9.5-10.5s8 3.7 9.5 10.5" />
      <Face eyes="glasses" />
      <path d="M25.5 28.5c1.2 5 4 7 6.5 7s5.3-2 6.5-7" opacity={0.55} />
    </Base>
  );
}

export const MARKETER_AVATARS = [
  AvatarA,
  AvatarB,
  AvatarC,
  AvatarD,
  AvatarE,
  AvatarF,
];
