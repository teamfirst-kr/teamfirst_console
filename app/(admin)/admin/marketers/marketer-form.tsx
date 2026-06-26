"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MARKETER_CATEGORIES,
  type MarketerRow,
} from "@/lib/schemas/marketer";

import { type MarketerActionState } from "./actions";

export function MarketerForm({
  action,
  initial,
  submitLabel,
}: {
  action: (
    prev: MarketerActionState,
    formData: FormData,
  ) => Promise<MarketerActionState>;
  initial?: MarketerRow | null;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<
    MarketerActionState,
    FormData
  >(action, null);

  const portfolioText = (initial?.portfolio ?? [])
    .map((p) => `${p.title} | ${p.url}`)
    .join("\n");

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="display_name">마케터 이름 *</Label>
            <Input id="display_name" name="display_name" defaultValue={initial?.display_name ?? ""} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">slug (URL, 비우면 자동)</Label>
            <Input id="slug" name="slug" placeholder="예: hong-gildong" defaultValue={initial?.slug ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="contact_email">이메일 (로그인 계정 발급용)</Label>
            <Input id="contact_email" name="contact_email" type="email" placeholder="marketer@example.com" defaultValue={initial?.contact_email ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">분야 *</Label>
            <select
              id="category"
              name="category"
              defaultValue={initial?.category ?? "performance"}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {MARKETER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cohort_year">코호트 연도</Label>
              <Input id="cohort_year" name="cohort_year" inputMode="numeric" placeholder="2025" defaultValue={initial?.cohort_year ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="career_years">경력(년)</Label>
              <Input id="career_years" name="career_years" inputMode="numeric" placeholder="7" defaultValue={initial?.career_years ?? ""} />
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="headline">한 줄 소개</Label>
            <Input id="headline" name="headline" defaultValue={initial?.headline ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="bio">상세 소개</Label>
            <Textarea id="bio" name="bio" rows={5} defaultValue={initial?.bio ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="skills">스킬 (쉼표로 구분)</Label>
            <Input id="skills" name="skills" placeholder="Meta Ads, GA4, CRM" defaultValue={(initial?.skills ?? []).join(", ")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="portfolio">포트폴리오 (한 줄에 &quot;제목 | URL&quot;)</Label>
            <Textarea
              id="portfolio"
              name="portfolio"
              rows={3}
              placeholder={"브랜드A 캠페인 | https://...\n블로그 | https://..."}
              defaultValue={portfolioText}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sort_order">정렬 순서 (작을수록 위)</Label>
            <Input id="sort_order" name="sort_order" inputMode="numeric" defaultValue={initial?.sort_order ?? 0} />
          </div>
          <label className="flex items-center gap-2 self-end rounded-md border border-input px-3 py-2 text-sm">
            <input
              type="checkbox"
              name="publish"
              defaultChecked={initial?.status === "published"}
              className="h-4 w-4"
            />
            공개(published) — 체크 해제 시 비공개(draft)
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
