"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// 뷰포트 진입 시 페이드+슬라이드업. delay로 stagger 연출.
// immediate=true: 관찰자 없이 첫 페인트에 CSS로 즉시 재생(히어로/접힘 위 콘텐츠용).
export function Reveal({
  children,
  className,
  delay = 0,
  immediate = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (immediate) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  if (immediate) {
    return (
      <div
        className={cn("tf-hero-in", className)}
        style={delay ? { animationDelay: `${delay}ms` } : undefined}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("tf-reveal", visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
