import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

// 공통 섹션 헤더: eyebrow(영문 라벨) + heading(800) + sub. 중앙 정렬 기본.
export function SectionHeader({
  eyebrow,
  heading,
  sub,
  align = "center",
  tone = "light",
  className,
}: {
  eyebrow?: string;
  heading: React.ReactNode;
  sub?: React.ReactNode;
  align?: "center" | "left";
  // dark: 네이비 배경 섹션 — eyebrow/heading을 밝게 (기본 primary는 배경에 묻힘)
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-bold uppercase tracking-[0.18em]",
            tone === "dark" ? "text-white/85" : "text-primary",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "mt-3 break-keep text-2xl font-extrabold leading-snug tracking-[-0.02em] sm:text-[26px] md:text-[34px]",
          tone === "dark" ? "text-white" : "text-secondary",
        )}
      >
        {heading}
      </h2>
      {sub ? (
        <p
          className={cn(
            "mt-4 break-keep text-[15px] leading-relaxed text-muted-foreground md:text-base",
            align === "center" && "mx-auto max-w-2xl",
          )}
        >
          {sub}
        </p>
      ) : null}
    </Reveal>
  );
}
