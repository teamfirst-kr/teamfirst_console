import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

// 공통 섹션 헤더: eyebrow(영문 라벨) + heading(800) + sub. 중앙 정렬 기본.
export function SectionHeader({
  eyebrow,
  heading,
  sub,
  align = "center",
  className,
}: {
  eyebrow?: string;
  heading: React.ReactNode;
  sub?: React.ReactNode;
  align?: "center" | "left";
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
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 break-keep text-2xl font-extrabold leading-snug tracking-[-0.02em] text-secondary sm:text-[26px] md:text-[34px]">
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
