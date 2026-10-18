"use client";

import { useId, useState } from "react";

// 일반 <input type="file"> — 브라우저 자동화가 파일을 첨부할 수 있게 숨기지 않는다.
// form="" 로 상위 저장 폼과 분리해 저장 시 파일이 함께 전송되지 않게 한다. 업로드 후 URL만 돌려준다.
export function ImageUploadInput({
  label,
  onUploaded,
  disabled,
}: {
  label: string;
  onUploaded: (url: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setMsg("png / jpg / webp / gif 만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg("5MB 이하 이미지만 업로드할 수 있습니다.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/admin/newsletter/upload", { method: "POST", body: fd });
      const json = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (!res.ok || !json.url) {
        setMsg(json.error ?? "업로드에 실패했습니다.");
        return;
      }
      onUploaded(json.url);
      setMsg("업로드 완료");
    } catch {
      setMsg("업로드에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <label htmlFor={id} className="font-medium text-secondary">
        {label}
      </label>
      <input
        id={id}
        type="file"
        form="__no-form"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={disabled || busy}
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = "";
        }}
        className="text-xs file:mr-2 file:rounded-md file:border file:border-input file:bg-background file:px-2 file:py-1 file:text-xs"
      />
      {busy ? <span className="text-muted-foreground">업로드 중</span> : null}
      {msg ? <span className={msg === "업로드 완료" ? "text-emerald-700" : "text-red-600"}>{msg}</span> : null}
    </div>
  );
}
