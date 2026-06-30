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
  BUDGET_RANGE_OPTIONS,
  CONTRACT_PERIOD_OPTIONS,
  KPI_OPTIONS,
  MARKETING_GOAL_OPTIONS,
  MEETING_CYCLE_OPTIONS,
  PARTNER_CATEGORIES,
  PAYMENT_METHOD_OPTIONS,
  REPORT_CYCLE_OPTIONS,
  STAFF_SIZE_OPTIONS,
  TOOL_OPTIONS,
} from "@/lib/schemas/partner-application";

import {
  submitPartnerApplication,
  type ApplyState,
} from "@/app/(public)/partner/apply/actions";

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

export function PartnerApplicationForm() {
  const [state, formAction, pending] = useActionState<ApplyState, FormData>(
    submitPartnerApplication,
    null,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {/* 1. 회사 기본정보 */}
      <Card>
        <CardHeader>
          <CardTitle>1. 회사 기본정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company_name">대행사명 / 사업자명 *</Label>
            <Input id="company_name" name="company_name" required />
            <FieldError messages={errors.company_name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz_reg_no">사업자등록번호 *</Label>
            <Input
              id="biz_reg_no"
              name="biz_reg_no"
              inputMode="numeric"
              placeholder="000-00-00000"
              required
            />
            <FieldError messages={errors.biz_reg_no} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="business_license">사업자등록증 첨부 *</Label>
            <Input
              id="business_license"
              name="business_license"
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              required
              className="cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
            />
            <p className="text-xs text-muted-foreground">PDF·이미지, 최대 10MB.</p>
            <FieldError messages={errors.business_license} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_person">담당자 성함 / 직책 *</Label>
            <Input id="contact_person" name="contact_person" required />
            <FieldError messages={errors.contact_person} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">직통 연락처 *</Label>
            <Input id="contact_phone" name="contact_phone" required />
            <FieldError messages={errors.contact_phone} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">이메일주소 *</Label>
            <Input id="contact_email" name="contact_email" type="email" required />
            <p className="text-xs text-muted-foreground">
              입점 승인 시 이 주소로 계정이 발급됩니다.
            </p>
            <FieldError messages={errors.contact_email} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">공식 홈페이지 URL</Label>
            <Input id="website" name="website" type="url" placeholder="https://" />
            <FieldError messages={errors.website} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="specialty">
              가장 대행이 자신있는 업종/카테고리
            </Label>
            <Input
              id="specialty"
              name="specialty"
              placeholder="예: 퍼포먼스, 뷰티/패션, F&B 등"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>현재 직원수 *</Label>
            <div className="flex flex-wrap gap-2">
              {STAFF_SIZE_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                >
                  <input
                    type="radio"
                    name="staff_size"
                    value={opt}
                    className="h-4 w-4"
                    required
                  />
                  {opt}
                </label>
              ))}
            </div>
            <FieldError messages={errors.staff_size} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="intro">어필하고 싶은 귀사의 마케팅 능력</Label>
            <Textarea
              id="intro"
              name="intro"
              rows={5}
              placeholder="강점, 운영 철학, 대표 성과 등을 자유롭게 적어주세요."
            />
          </div>
        </CardContent>
      </Card>

      {/* 광고대행 가능 매체 */}
      <Card>
        <CardHeader>
          <CardTitle>광고대행 가능 매체 / 마케팅 영역 *</CardTitle>
          <CardDescription>
            RFP 매칭의 핵심 기준입니다. 가능한 영역을 모두 선택해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <CheckboxGroup name="categories" options={PARTNER_CATEGORIES} columns={2} />
          <FieldError messages={errors.categories} />
        </CardContent>
      </Card>

      {/* 매칭 희망사항 */}
      <Card>
        <CardHeader>
          <CardTitle>매칭 희망사항</CardTitle>
          <CardDescription>
            조건을 좁게 선택할수록 RFP 노출이 줄어듭니다. 폭넓게 선택하실수록
            매칭 기회가 많아집니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>희망 광고주 예산 (복수)</Label>
            <CheckboxGroup name="budget_ranges" options={BUDGET_RANGE_OPTIONS} columns={3} />
          </div>
          <div className="space-y-2">
            <Label>희망 계약기간 (복수)</Label>
            <CheckboxGroup name="contract_periods" options={CONTRACT_PERIOD_OPTIONS} columns={2} />
          </div>
          <label className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-accent w-fit">
            <input type="checkbox" name="performance_based" className="h-4 w-4" />
            성과형 보수(CPA) 계약도 가능합니다
          </label>
        </CardContent>
      </Card>

      {/* 마케팅 목표 / KPI */}
      <Card>
        <CardHeader>
          <CardTitle>강점 및 성과지표</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>개선에 자신있는 마케팅 목표 (복수)</Label>
            <CheckboxGroup name="marketing_goals" options={MARKETING_GOAL_OPTIONS} columns={2} />
          </div>
          <div className="space-y-2">
            <Label>중요하게 보는 성과지표 KPI (복수)</Label>
            <CheckboxGroup name="kpis" options={KPI_OPTIONS} columns={2} />
          </div>
        </CardContent>
      </Card>

      {/* 운영 방식 */}
      <Card>
        <CardHeader>
          <CardTitle>운영 방식</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>제공 가능한 리포트 주기 (복수)</Label>
            <CheckboxGroup name="report_cycles" options={REPORT_CYCLE_OPTIONS} columns={4} />
          </div>
          <div className="space-y-2">
            <Label>희망 미팅 주기 (복수)</Label>
            <CheckboxGroup name="meeting_cycles" options={MEETING_CYCLE_OPTIONS} columns={3} />
          </div>
          <div className="space-y-2">
            <Label>운영 가능한 툴 (복수)</Label>
            <CheckboxGroup name="tools" options={TOOL_OPTIONS} columns={3} />
          </div>
        </CardContent>
      </Card>

      {/* 광고주 특징 */}
      <Card>
        <CardHeader>
          <CardTitle>희망 광고주</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferred_client_traits">
              매칭을 희망하는 광고주의 특징
            </Label>
            <Textarea
              id="preferred_client_traits"
              name="preferred_client_traits"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avoided_client_traits">
              매칭을 희망하지 않는 광고주의 특징
            </Label>
            <Textarea
              id="avoided_client_traits"
              name="avoided_client_traits"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 계약 방식 */}
      <Card>
        <CardHeader>
          <CardTitle>희망 계약 방식 (대금 지불 방식)</CardTitle>
        </CardHeader>
        <CardContent>
          <CheckboxGroup name="payment_methods" options={PAYMENT_METHOD_OPTIONS} columns={1} />
        </CardContent>
      </Card>

      {/* 첨부 파일 */}
      <Card>
        <CardHeader>
          <CardTitle>회사소개서 / 포트폴리오</CardTitle>
          <CardDescription>
            PDF·이미지·ZIP, 파일당 최대 10MB, 최대 5개.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            id="portfolio_files"
            name="portfolio_files"
            type="file"
            multiple
            accept=".pdf,.zip,image/png,image/jpeg,image/webp,application/zip"
            className="cursor-pointer file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
          />
        </CardContent>
      </Card>

      {/* 동의 + 제출 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="fee_agreement"
              className="mt-1 h-4 w-4"
              required
            />
            <span>
              팀퍼스트를 통한 광고주 수주 시 또는 계약연장 시 수수료가 발생하는
              것에 동의합니다. *
            </span>
          </label>
          <FieldError messages={errors.fee_agreement} />
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="privacy_consent"
              className="mt-1 h-4 w-4"
              required
            />
            <span>
              개인정보 처리방침에 동의하며, 입점 검토 목적으로 제공한 정보가
              팀퍼스트 운영팀에 의해 보관·활용되는 것에 동의합니다. *
            </span>
          </label>
          <FieldError messages={errors.privacy_consent} />
          <p className="text-xs text-muted-foreground">
            파트너 대행사 등록은 대행사 등록 계약서 작성이 완료된 후 최종
            완료됩니다.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 items-stretch">
          {state?.error ? (
            <p className="text-sm text-destructive text-center">{state.error}</p>
          ) : null}
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "제출 중..." : "등록 신청"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
