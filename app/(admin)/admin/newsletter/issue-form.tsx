"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CTA, NEWSLETTER_CATEGORIES } from "@/lib/newsletter/constants";
import { renderMarkdown } from "@/lib/newsletter/markdown";
import { ISSUE_TEMPLATE_MD } from "@/lib/newsletter/template";
import type { NewsletterIssueRow } from "@/types/database";

import type { IssueActionState } from "./actions";

export function IssueForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: IssueActionState, fd: FormData) => Promise<IssueActionState>;
  initial?: NewsletterIssueRow | null;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<IssueActionState, FormData>(action, null);
  const [body, setBody] = useState(initial?.body_md ?? "");
  const [preview, setPreview] = useState(false);

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">제목 *</Label>
            <Input id="title" name="title" defaultValue={initial?.title ?? ""} required maxLength={200} placeholder="예: 10월 매체 업데이트 — 메타 BLS 기준 상향, 네이버 브랜드검색 개편" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <select id="category" name="category" defaultValue={initial?.category ?? "general"} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {NEWSLETTER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue_no">호수 (Vol.)</Label>
            <Input id="issue_no" name="issue_no" inputMode="numeric" defaultValue={initial?.issue_no ?? ""} placeholder="예: 1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">slug (URL, 비우면 제목으로 자동)</Label>
            <Input id="slug" name="slug" defaultValue={initial?.slug ?? ""} placeholder="2026-10-media-update" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover_url">커버 이미지 URL</Label>
            <Input id="cover_url" name="cover_url" defaultValue={initial?.cover_url ?? ""} placeholder="https://" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="summary">요약 (목록 카드·메일 프리헤더, 1~2문장)</Label>
            <Textarea id="summary" name="summary" rows={2} defaultValue={initial?.summary ?? ""} maxLength={400} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="body_md">본문 (마크다운)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!body.trim() || window.confirm("현재 본문을 템플릿으로 바꿀까요?")) setBody(ISSUE_TEMPLATE_MD);
                  }}
                >
                  5개 섹션 템플릿 불러오기
                </Button>
                <Button type="button" variant={preview ? "default" : "outline"} size="sm" onClick={() => setPreview((v) => !v)}>
                  {preview ? "편집으로" : "미리보기"}
                </Button>
              </div>
            </div>
            {preview ? (
              <div className="nl-body min-h-[320px] rounded-md border bg-background p-5" dangerouslySetInnerHTML={{ __html: renderMarkdown(body, "web") }} />
            ) : (
              <Textarea id="body_md" name="body_md" rows={22} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-[13px] leading-relaxed" />
            )}
            {preview ? <input type="hidden" name="body_md" value={body} /> : null}
            <p className="text-xs text-muted-foreground">
              지원 문법: <code>## 제목</code> <code>### 소제목</code> <code>- 목록</code> <code>1. 번호</code> <code>**굵게**</code> <code>[링크](https://…)</code> <code>![이미지](https://…)</code>{" "}
              <code>&gt; 인용(코멘트 박스)</code> <code>| 표 | 열 |</code> <code>---</code> 구분선
            </p>
          </div>

          <div className="space-y-2 md:col-span-2 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-bold text-secondary">마무리 CTA (주제와 이어지는 문구 → 상담 신청 양식)</p>
            <p className="text-xs text-muted-foreground">
              호 끝에 이 문구와 함께 “팀퍼스트에 상담 신청하기” 양식(브랜드명·월 마케팅 예산·연락처)이 자동으로 붙습니다. 비우면 기본 문구: “{DEFAULT_CTA.title}”
            </p>
            <div className="mt-2 grid gap-3">
              <div className="space-y-1">
                <Label htmlFor="cta_title">CTA 제목</Label>
                <Input id="cta_title" name="cta_title" defaultValue={initial?.cta_title ?? ""} placeholder={DEFAULT_CTA.title} maxLength={120} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cta_body">CTA 설명</Label>
                <Textarea id="cta_body" name="cta_body" rows={2} defaultValue={initial?.cta_body ?? ""} placeholder={DEFAULT_CTA.body} maxLength={500} />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm md:col-span-2">
            <input type="checkbox" name="publish" defaultChecked={initial?.status === "published"} className="h-4 w-4" />
            공개(published) — 체크하면 /newsletter 에 노출되고 구독자 발송이 가능해집니다
          </label>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "저장 중…" : submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
