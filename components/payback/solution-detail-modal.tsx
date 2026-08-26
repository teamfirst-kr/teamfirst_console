"use client";

import { useEffect, useState } from "react";

// 솔루션 상세 팝업 — 화면의 약 80%를 차지하는 모달.
// 상세 페이지 HTML은 iframe(srcDoc)으로 격리 렌더링해 랜딩 스타일과 충돌하지 않는다.
export function SolutionDetailButton({
  title,
  html,
}: {
  title: string;
  html: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!html) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-sky-300/60 hover:bg-sky-400/10 hover:text-sky-200"
      >
        솔루션 자세히 알아보기 <span aria-hidden>→</span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} 상세 소개`}
        >
          <div
            className="flex h-[88vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:h-[85vh] sm:w-[80vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b bg-[#111E38] px-5 py-3">
              <p className="text-sm font-bold text-white">{title}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="rounded-md px-2 py-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                ✕ 닫기
              </button>
            </div>
            <iframe
              title={`${title} 상세`}
              srcDoc={html}
              sandbox="allow-scripts"
              className="h-full w-full flex-1 border-0 bg-white"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
