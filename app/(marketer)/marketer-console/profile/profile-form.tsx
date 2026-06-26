"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MarketerRow } from "@/lib/schemas/marketer";

import { updateMyProfile, type ProfileState } from "./actions";

export function ProfileForm({ marketer }: { marketer: MarketerRow }) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateMyProfile,
    null,
  );

  const portfolioText = (marketer.portfolio ?? [])
    .map((p) => `${p.title} | ${p.url}`)
    .join("\n");

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="headline">한 줄 소개</Label>
            <Input id="headline" name="headline" defaultValue={marketer.headline ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="career_years">경력(년)</Label>
            <Input id="career_years" name="career_years" inputMode="numeric" defaultValue={marketer.career_years ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">상세 소개</Label>
            <Textarea id="bio" name="bio" rows={6} defaultValue={marketer.bio ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">스킬 (쉼표로 구분)</Label>
            <Input id="skills" name="skills" placeholder="Meta Ads, GA4, CRM" defaultValue={(marketer.skills ?? []).join(", ")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">포트폴리오 (한 줄에 &quot;제목 | URL&quot;)</Label>
            <Textarea id="portfolio" name="portfolio" rows={3} defaultValue={portfolioText} />
          </div>
          <p className="text-xs text-muted-foreground">
            이름·분야·공개 여부는 운영팀이 관리합니다. 변경이 필요하면 운영팀에
            문의해주세요.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          {state?.ok ? (
            <p className="text-sm text-emerald-600">{state.message}</p>
          ) : state && !state.ok ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "저장 중..." : "프로필 저장"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
