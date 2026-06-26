"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MARKETER_CATEGORIES } from "@/lib/schemas/marketer";

import { submitMarketerRequest, type MarketerRequestState } from "./actions";

export function MarketerRequestForm() {
  const [state, formAction, pending] = useActionState<
    MarketerRequestState,
    FormData
  >(submitMarketerRequest, null);

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="brand_name">브랜드명 *</Label>
            <Input id="brand_name" name="brand_name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">필요한 마케터 분야 *</Label>
            <select
              id="category"
              name="category"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {MARKETER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget_range">월 예산 (선택)</Label>
            <Input id="budget_range" name="budget_range" placeholder="예: 월 300~500만원" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">달성하고 싶은 목표 (선택)</Label>
            <Input id="goal" name="goal" placeholder="예: 신규 고객 확보, ROAS 개선" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">상세 요청 (선택)</Label>
            <Textarea id="message" name="message" rows={4} placeholder="브랜드 상황과 필요한 역량을 적어주세요." />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "제출 중..." : "마케터 매칭 신청"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            로그인되어 있지 않으면 로그인 후 다시 신청해주세요.
          </p>
        </CardFooter>
      </Card>
    </form>
  );
}
