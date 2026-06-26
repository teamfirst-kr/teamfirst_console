"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CaseStudyRow } from "@/lib/schemas/case-study";

import { type CaseActionState } from "./actions";

export function CaseForm({
  action,
  initial,
  submitLabel,
}: {
  action: (
    prev: CaseActionState,
    formData: FormData,
  ) => Promise<CaseActionState>;
  initial?: CaseStudyRow | null;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<CaseActionState, FormData>(
    action,
    null,
  );

  const metricsText = (initial?.metrics ?? [])
    .map((m) => `${m.label} | ${m.value}`)
    .join("\n");

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand_name">브랜드명 *</Label>
            <Input id="brand_name" name="brand_name" defaultValue={initial?.brand_name ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">slug (URL, 비우면 자동)</Label>
            <Input id="slug" name="slug" defaultValue={initial?.slug ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">업종</Label>
            <Input id="industry" name="industry" placeholder="예: 뷰티, F&B" defaultValue={initial?.industry ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cover_url">커버 이미지 URL</Label>
            <Input id="cover_url" name="cover_url" placeholder="https://" defaultValue={initial?.cover_url ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="summary">요약 (목록/카드용)</Label>
            <Textarea id="summary" name="summary" rows={2} defaultValue={initial?.summary ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="body">본문 (상세)</Label>
            <Textarea id="body" name="body" rows={8} defaultValue={initial?.body ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="metrics">성과 지표 (한 줄에 &quot;지표명 | 값&quot;)</Label>
            <Textarea
              id="metrics"
              name="metrics"
              rows={3}
              placeholder={"ROAS | 420%\n매출 성장 | +180%\n신규 고객 | 3,200명"}
              defaultValue={metricsText}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">정렬 순서</Label>
            <Input id="sort_order" name="sort_order" inputMode="numeric" defaultValue={initial?.sort_order ?? 0} />
          </div>
          <label className="flex items-center gap-2 self-end rounded-md border border-input px-3 py-2 text-sm">
            <input
              type="checkbox"
              name="publish"
              defaultChecked={initial?.status === "published"}
              className="h-4 w-4"
            />
            공개(published)
          </label>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "저장 중..." : submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
