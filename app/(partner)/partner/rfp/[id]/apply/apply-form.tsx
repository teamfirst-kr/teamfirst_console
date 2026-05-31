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

export function RfpApplyForm({
  requestId,
  contactEmail,
}: {
  requestId: string;
  contactEmail?: string | null;
}) {
  const action = submitRfpApplication.bind(null, requestId);
  const [state, formAction, pending] = useActionState<ApplyRfpState, FormData>(
    action,
    null,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" encType="multipart/form-data">
      <Card>
        <CardHeader>
          <CardTitle>제안 내용</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="approach">
              이 광고주에 대한 제안 개요 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="approach"
              name="approach"
              rows={5}
              placeholder="이 RFP를 어떻게 풀어갈지, 핵심 전략과 운영 방향을 적어주세요."
              required
            />
            <FieldError messages={errors.approach} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="past_clients">
              광고대행을 진행한 광고주명{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="past_clients"
              name="past_clients"
              rows={5}
              placeholder={"한 줄에 하나씩 적어주세요.\n예)\n브랜드A — 퍼포먼스(메타·구글) 운영, ROAS 350%\n브랜드B — 네이버 SA 운영 2년"}
              required
            />
            <FieldError messages={errors.past_clients} />
            <p className="text-xs text-muted-foreground">
              매출/ROAS/운영 기간 등 비교 가능한 정량 지표를 함께 적으면 선정에
              유리합니다.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="strengths_weaknesses">귀사의 강점 / 약점</Label>
            <Textarea
              id="strengths_weaknesses"
              name="strengths_weaknesses"
              rows={4}
              placeholder="강점과 보완 중인 영역을 솔직하게 적어주세요."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="differentiation">차별점</Label>
            <Textarea
              id="differentiation"
              name="differentiation"
              rows={3}
              placeholder="다른 대행사와 차별화되는 부분을 적어주세요."
            />
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
            <Label htmlFor="attachments">추가 첨부 자료</Label>
            <Input
              id="attachments"
              name="attachments"
              type="file"
              multiple
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
            />
            <p className="text-xs text-muted-foreground">
              포트폴리오·제안서 등을 첨부할 수 있습니다. (개별 20MB 이하, 최대 5개)
            </p>
            <FieldError messages={errors.attachments} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>견적 / 일정</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quote_monthly">
              월 견적 (원) <span className="text-destructive">*</span>
            </Label>
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
          {contactEmail ? (
            <p className="text-xs text-muted-foreground text-center">
              지원 결과는 <strong>{contactEmail}</strong> 으로 안내됩니다.
            </p>
          ) : null}
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
