"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { submitRfpApplication, type ApplyRfpState } from "./actions";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function RfpApplyForm({ requestId }: { requestId: string }) {
  const action = submitRfpApplication.bind(null, requestId);
  const [state, formAction, pending] = useActionState<ApplyRfpState, FormData>(
    action,
    null,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>제안 내용</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="approach">제안 개요 *</Label>
            <Textarea
              id="approach"
              name="approach"
              rows={5}
              placeholder="이 광고주에게 어떤 방식으로 접근할지 적어주세요."
              required
            />
            <FieldError messages={errors.approach} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team_composition">투입 팀 구성</Label>
            <Textarea
              id="team_composition"
              name="team_composition"
              rows={2}
              placeholder="예: PM 1, 디자이너 1, 매체 2"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="similar_cases">유사 사례</Label>
            <Textarea id="similar_cases" name="similar_cases" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="differentiation">차별점</Label>
            <Textarea id="differentiation" name="differentiation" rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>견적 / 일정</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quote_monthly">월 견적 (원) *</Label>
            <Input
              id="quote_monthly"
              name="quote_monthly"
              type="number"
              min={0}
              step={100000}
              placeholder="예: 5000000"
              required
            />
            <FieldError messages={errors.quote_monthly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_available">가능 시작일</Label>
            <Input id="start_available" name="start_available" type="date" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 items-stretch">
          {state?.error ? (
            <p className="text-sm text-destructive text-center">{state.error}</p>
          ) : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "제출 중..." : "지원서 제출"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
