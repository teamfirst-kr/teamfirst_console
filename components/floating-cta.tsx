"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// 우측 중앙 고정 플로팅 CTA (스크롤 따라다님). 모바일에서는 하단 고정 바.
export function FloatingCta({
  matchHref = "/signup",
}: {
  matchHref?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* 데스크탑: 우측 중앙 세로 */}
      <div
        className={
          "fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2.5 transition-all duration-300 lg:flex " +
          (show ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0 pointer-events-none")
        }
      >
        <Link
          href={matchHref}
          className="rounded-full bg-secondary px-6 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-secondary/25 transition hover:scale-[1.03]"
        >
          대행사 매칭신청
        </Link>
        <Link
          href="/agency"
          className="rounded-full border-2 border-secondary bg-white px-6 py-3.5 text-center text-sm font-bold text-secondary shadow-md transition hover:bg-secondary hover:text-white"
        >
          대행사 등록신청
        </Link>
      </div>

      {/* 모바일: 하단 고정 바 */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
        <Link
          href={matchHref}
          className="flex-1 rounded-full bg-secondary px-4 py-3 text-center text-sm font-bold text-white"
        >
          대행사 매칭신청
        </Link>
        <Link
          href="/agency"
          className="flex-1 rounded-full border-2 border-secondary px-4 py-3 text-center text-sm font-bold text-secondary"
        >
          대행사 등록신청
        </Link>
      </div>
    </>
  );
}
