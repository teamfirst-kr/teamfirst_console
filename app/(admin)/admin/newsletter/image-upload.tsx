"use client";

import { useState } from "react";

const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

export function isUploadableImage(file: File): string | null {
  if (!ACCEPT.includes(file.type)) return "png / jpg / webp / gif 만 업로드할 수 있습니다.";
  if (file.size > MAX_BYTES) return "5MB 이하 이미지만 업로드할 수 있습니다.";
  return null;
}

// 어드민 업로드 라우트(운영자 세션) → 공개 URL
export async function uploadNewsletterImage(file: File): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const invalid = isUploadableImage(file);
  if (invalid) return { ok: false, error: invalid };
  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/admin/newsletter/upload", { method: "POST", body: fd });
    const json = (await res.json()) as { ok?: boolean; url?: string; error?: string };
    if (!res.ok || !json.url) return { ok: false, error: json.error ?? "업로드에 실패했습니다." };
    return { ok: true, url: json.url };
  } catch {
    return { ok: false, error: "업로드에 실패했습니다." };
  }
}

// 일반 <input type="file"> — 브라우저 자동화(Cowork)가 파일을 첨부할 수 있게 숨기지 않고, id/name 을 고정한다.
// form="__no-form" 으로 상위 저장 폼과 분리해 저장 시 파일이 함께 전송되지 않게 한다. 업로드 후 URL만 돌려준다.
export function ImageUploadInput({
  id,
  label,
  multiple = false,
  onUploaded,
  disabled,
  maxFiles,
}: {
  id: string;
  label: string;
  multiple?: boolean;
  onUploaded: (url: string, file: File) => void;
  disabled?: boolean;
  maxFiles?: number; // 한 번에 받을 최대 파일 수 (남은 이미지 슬롯)
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handle(files: FileList | null) {
    const list = Array.from(files ?? []);
    if (list.length === 0) return;
    const limit = maxFiles !== undefined ? Math.max(0, maxFiles) : list.length;
    const picked = list.slice(0, limit);
    if (picked.length === 0) {
      setMsg("이미지 한도(커버 포함 4장)에 도달했습니다.");
      return;
    }
    setBusy(true);
    setMsg(null);
    let okCount = 0;
    const errors: string[] = [];
    for (const f of picked) {
      const r = await uploadNewsletterImage(f);
      if (r.ok) {
        okCount++;
        onUploaded(r.url, f);
      } else errors.push(`${f.name}: ${r.error}`);
    }
    setBusy(false);
    const skipped = list.length - picked.length;
    setMsg([okCount ? `${okCount}장 업로드 완료` : null, skipped ? `${skipped}장은 한도 초과로 건너뜀` : null, ...errors].filter(Boolean).join(" · "));
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label htmlFor={id} className="font-medium text-secondary">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="file"
        form="__no-form"
        multiple={multiple}
        accept={ACCEPT.join(",")}
        disabled={disabled || busy}
        onChange={(e) => {
          void handle(e.target.files);
          e.target.value = "";
        }}
        className="text-xs file:mr-2 file:rounded-md file:border file:border-input file:bg-background file:px-2 file:py-1 file:text-xs"
      />
      {busy ? <span className="text-muted-foreground">업로드 중</span> : null}
      {msg ? <span className={/완료/.test(msg) && !/실패|건너뜀|한도/.test(msg) ? "text-emerald-700" : "text-amber-700"}>{msg}</span> : null}
    </div>
  );
}
