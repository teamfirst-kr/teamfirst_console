"use client";

import { useState } from "react";

// 민감 값(솔루션 비밀번호 등)을 기본 마스킹하고, 클릭 시에만 표시
export function CredentialReveal({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono">{show ? value : "•".repeat(Math.min(value.length, 10))}</span>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="rounded border border-input px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent"
      >
        {show ? "숨기기" : "표시"}
      </button>
    </span>
  );
}
