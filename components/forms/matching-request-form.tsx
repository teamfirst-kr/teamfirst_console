"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MARKETING_GOAL_OPTIONS,
  MEETING_CYCLE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  REPORT_CYCLE_OPTIONS,
  REQUEST_KPI_OPTIONS,
  REQUEST_MEDIA,
  TOOL_OPTIONS,
} from "@/lib/schemas/matching-request";

import {
  submitMatchingRequest,
  type RequestState,
} from "@/app/(client)/client/request/new/actions";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

function CheckboxGroup({
  name,
  options,
  columns = 2,
}: {
  name: string;
  options: readonly { value: string; label: string }[] | readonly string[];
  columns?: number;
}) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {normalized.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-accent"
        >
          <input
            type="checkbox"
            name={name}
            value={opt.value}
            className="h-4 w-4 shrink-0"
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

export function MatchingRequestForm() {
  const [state, formAction, pending] = useActionState<RequestState, FormData>(
    submitMatchingRequest,
    null,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {/* 1. 매칭 기본정보 */}
      <Card>
        <CardHeader>
          <CardTitle>1. 매칭 기본정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand_name">브랜드명 *</Label>
            <Input id="brand_name" name="brand_name" required />
            <FieldError messages={errors.brand_name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_title">담당자 직책 *</Label>
            <Input id="contact_title" name="contact_title" required />
            <FieldError messages={errors.contact_title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일주소 *</Label>
            <Input id="email" name="email" type="email" required />
            <FieldError messages={errors.email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">직통 연락처 *</Label>
            <Input id="phone" name="phone" required />
            <FieldError messages={errors.phone} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="website">브랜드 공식 홈페이지 URL</Label>
            <Input id="website" name="website" type="url" placeholder="https://" />
            <FieldError messages={errors.website} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="category">귀사 추진 카테고리 *</Label>
            <Input
              id="category"
              name="category"
              placeholder="예: 뷰티, 패션, F&B, 앱서비스 등"
              required
            />
            <FieldError messages={errors.category} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="product_intro">주력 제품 / 서비스 소개 *</Label>
            <Textarea id="product_intro" name="product_intro" rows={3} required />
            <FieldError messages={errors.product_intro} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="reason">신규 광고대행사를 모집하게 된 이유 *</Label>
            <Textarea id="reason" name="reason" rows={3} required />
            <FieldError messages={errors.reason} />
          </div>
        </CardContent>
      </Card>

      {/* 2. 마케팅 목표 */}
      <Card>
        <CardHeader>
          <CardTitle>2. 최우선 마케팅 목표 *</CardTitle>
          <CardDescription>최대 2개까지 선택할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <CheckboxGroup name="marketing_goals" options={MARKETING_GOAL_OPTIONS} columns={2} />
          <FieldError messages={errors.marketing_goals} />
        </CardContent>
      </Card>

      {/* 3. 요청 매체 */}
      <Card>
        <CardHeader>
          <CardTitle>3. 광고대행을 요청할 매체 / 영역 *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <CheckboxGroup name="channels" options={REQUEST_MEDIA} columns={2} />
          <FieldError messages={errors.channels} />
        </CardContent>
      </Card>

      {/* 4. 예산 + 증빙 */}
      <Card>
        <CardHeader>
          <CardTitle>4. 월 마케팅 예산 *</CardTitle>
          <CardDescription>
            10만원 단위로 입력해주세요. 지난 3개월 소진액 증빙을 함께 올리시면
            후보 대행사의 분석 정확도가 높아집니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="budget_monthly">월 예산 (원) *</Label>
            <Input
              id="budget_monthly"
              name="budget_monthly"
              type="number"
              min={0}
              step={100000}
              placeholder="예: 30000000"
              required
            />
            <FieldError messages={errors.budget_monthly} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ad_spend_proof">
              지난 3개월 소진액 증빙 (선택)
            </Label>
            <Input
              id="ad_spend_proof"
              name="ad_spend_proof"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              className="cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
            />
            <p className="text-xs text-muted-foreground">
              광고 소진 내역 캡처, 광고비 결제 카드 명세서 등 (PDF·이미지, 10MB
              이하)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 5. 대행 기간 */}
      <Card>
        <CardHeader>
          <CardTitle>5. 희망 대행 기간 *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            id="duration"
            name="duration"
            placeholder="예: 6개월, 1년, 장기 등 (최소 1개월)"
            required
          />
          <FieldError messages={errors.duration} />
        </CardContent>
      </Card>

      {/* 6. KPI */}
      <Card>
        <CardHeader>
          <CardTitle>6. 중요하게 보는 성과지표 (KPI) *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <CheckboxGroup name="kpis" options={REQUEST_KPI_OPTIONS} columns={2} />
          <FieldError messages={errors.kpis} />
        </CardContent>
      </Card>

      {/* 7~9 운영 */}
      <Card>
        <CardHeader>
          <CardTitle>운영 방식 *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>제공받고 싶은 리포트 주기</Label>
            <CheckboxGroup name="report_cycles" options={REPORT_CYCLE_OPTIONS} columns={4} />
            <FieldError messages={errors.report_cycles} />
          </div>
          <div className="space-y-2">
            <Label>희망 미팅 주기</Label>
            <CheckboxGroup name="meeting_cycles" options={MEETING_CYCLE_OPTIONS} columns={3} />
            <FieldError messages={errors.meeting_cycles} />
          </div>
          <div className="space-y-2">
            <Label>필수 운영 툴</Label>
            <CheckboxGroup name="tools" options={TOOL_OPTIONS} columns={3} />
            <FieldError messages={errors.tools} />
          </div>
        </CardContent>
      </Card>

      {/* 10~11 대행사 기준 */}
      <Card>
        <CardHeader>
          <CardTitle>희망 대행사</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferred_agency">
              매칭을 희망하는 대행사 기준 *
            </Label>
            <Textarea id="preferred_agency" name="preferred_agency" rows={3} required />
            <FieldError messages={errors.preferred_agency} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avoided_agency">
              매칭을 희망하지 않는 대행사 특징 (선택)
            </Label>
            <Textarea id="avoided_agency" name="avoided_agency" rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* 12. 계약 방식 */}
      <Card>
        <CardHeader>
          <CardTitle>12. 희망 계약 방식 (대금 지불 방식) *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <CheckboxGroup name="payment_methods" options={PAYMENT_METHOD_OPTIONS} columns={1} />
          <FieldError messages={errors.payment_methods} />
        </CardContent>
      </Card>

      <Card>
        <CardFooter className="flex flex-col gap-3 items-stretch pt-6">
          {state?.error ? (
            <p className="text-sm text-destructive text-center">{state.error}</p>
          ) : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "제출 중..." : "매칭 요청 제출"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
