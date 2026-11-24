"use client";

import { useState, useTransition } from "react";

import type { PiiEntity, PiiField } from "@/lib/pii";

import { revealPii } from "./actions";

// 어드민 개인정보 표시: 기본은 마스킹, "보기"를 누르면 서버에서 열람 기록을 남긴 뒤 원문 표시.
// 원문은 서버 렌더 HTML·RSC 페이로드에 포함되지 않는다.
export function PiiReveal({
  entity,
  id,
  field,
  masked,
  icon,
  className,
}: {
  entity: PiiEntity;
  id: string;
  field: PiiField;
  masked: string;
  icon?: string;
  className?: string;
}) {
  const [value, setValue] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (value !== null) {
    if (field === "phone") {
      return (
        <a href={`tel:${value.replace(/[^\d+]/g, "")}`} className={"font-semibold text-primary hover:underline " + (className ?? "")}>
          {icon ? `${icon} ` : ""}
          {value}
        </a>
      );
    }
    if (field === "email") {
      return (
        <a href={`mailto:${value}`} className={"text-foreground hover:underline " + (className ?? "")}>
          {icon ? `${icon} ` : ""}
          {value}
        </a>
      );
    }
    return <span className={"whitespace-pre-line text-foreground " + (className ?? "")}>{icon ? `${icon} ` : ""}{value}</span>;
  }

  return (
    <span className={"inline-flex flex-wrap items-center gap-1.5 " + (className ?? "")}>
      <span className="text-foreground">
        {icon ? `${icon} ` : ""}
        {masked}
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setErr(null);
            const r = await revealPii(entity, id, field);
            if (r.ok) setValue(r.value);
            else setErr(r.error);
          })
        }
        className="rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground hover:border-secondary/50 hover:text-secondary disabled:opacity-50"
        title="원문 보기 — 열람 기록이 남습니다"
      >
        {pending ? "…" : "보기"}
      </button>
      {err ? <span className="text-[10px] text-destructive">{err}</span> : null}
    </span>
  );
}
