"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { APP_CATEGORIES, APP_STATUSES, APP_STATUS_LABEL, type MarketApp } from "@/lib/solution-market";

import { createApp, updateApp, type AppFormState } from "./actions";

const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary";
const textareaCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

const STATUS_HELP: Record<(typeof APP_STATUSES)[number], string> = {
  available: "마켓에서 담고 구독할 수 있습니다.",
  coming_soon: "마켓에 카드만 노출되고 담을 수 없습니다.",
  hidden: "마켓에 노출하지 않습니다 (기존 구독 기록은 유지).",
};

export function AppForm({ app }: { app?: MarketApp }) {
  const editing = !!app;
  const [state, action, pending] = useActionState<AppFormState, FormData>(editing ? updateApp : createApp, null);
  const fieldError = (name: string) => (state?.field === name ? state.error : null);

  return (
    <form action={action} className="space-y-6 rounded-xl border bg-card p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="앱 키 *" hint={editing ? "구독 기록에 저장되는 식별자라 수정할 수 없습니다." : "영문 소문자·숫자·하이픈 2~24자 (예: schedule)"} error={fieldError("key")}>
          <input name="key" defaultValue={app?.key ?? ""} readOnly={editing} required pattern="[a-z][a-z0-9\-]{1,23}" className={inputCls + (editing ? " bg-muted" : "")} />
        </Field>
        <Field label="카테고리 *" error={fieldError("category")}>
          <select name="category" defaultValue={app?.category ?? "workspace"} className={inputCls}>
            {APP_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="앱 이름 *" hint="예: 스케줄 관리 솔루션" error={fieldError("name")}>
          <input name="name" defaultValue={app?.name ?? ""} required maxLength={60} className={inputCls} />
        </Field>
        <Field label="브랜드명" hint="있으면 카드 제목으로 쓰입니다 (예: CatchLog)" error={fieldError("brand")}>
          <input name="brand" defaultValue={app?.brand ?? ""} maxLength={40} className={inputCls} />
        </Field>
      </div>

      <Field label="한 줄 소개 *" hint="마켓 카드에 보이는 문구" error={fieldError("summary")}>
        <input name="summary" defaultValue={app?.summary ?? ""} required maxLength={160} className={inputCls} />
      </Field>
      <Field label="상세 소개" hint="앱 상세 섹션 본문 (줄바꿈 유지)" error={fieldError("description")}>
        <textarea name="description" defaultValue={app?.description ?? ""} rows={4} maxLength={3000} className={textareaCls} />
      </Field>
      <Field label="주요 기능" hint="한 줄에 하나씩, 최대 12개" error={fieldError("features")}>
        <textarea name="features" defaultValue={(app?.features ?? []).join("\n")} rows={5} className={textareaCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="소개 영상" hint="유튜브 링크 또는 영상 ID" error={fieldError("video")}>
          <input name="video" defaultValue={app?.video_id ?? ""} className={inputCls} placeholder="https://youtu.be/..." />
        </Field>
        <Field label="노출 상태 *" error={fieldError("status")}>
          <select name="status" defaultValue={app?.status ?? "coming_soon"} className={inputCls}>
            {APP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {APP_STATUS_LABEL[s]} — {STATUS_HELP[s]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="정렬 순서" hint="작을수록 앞 (기존 3종: 10·20·30)" error={fieldError("sort")}>
          <input name="sort" type="number" defaultValue={app?.sort ?? 100} className={inputCls} />
        </Field>
      </div>

      {state && !state.field ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button asChild type="button" variant="ghost">
          <Link href="/admin/solutions/apps">취소</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중…" : editing ? "수정 저장" : "앱 추가"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-secondary">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
