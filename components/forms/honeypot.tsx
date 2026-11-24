"use client";

import { HONEYPOT_FIELD_NAME } from "@/lib/pii";

// 봇 차단용 허니팟 입력칸 — 화면·스크린리더·탭 이동에서 모두 숨김. 사람은 비워 두고, 자동 입력 봇만 채운다.
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        웹사이트
        <input
          type="text"
          name={HONEYPOT_FIELD_NAME}
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
