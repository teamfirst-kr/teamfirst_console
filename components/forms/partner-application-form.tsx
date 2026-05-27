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
  PARTNER_CATEGORIES,
  STAFF_SIZE_OPTIONS,
} from "@/lib/schemas/partner-application";

import {
  submitPartnerApplication,
  type ApplyState,
} from "@/app/(public)/partner/apply/actions";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function PartnerApplicationForm() {
  const [state, formAction, pending] = useActionState<ApplyState, FormData>(
    submitPartnerApplication,
    null,
  );
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {/* 회사 기본정보 */}
      <Card>
        <CardHeader>
          <CardTitle>회사 정보</CardTitle>
          <CardDescription>입점 검토에 필요한 기본 정보입니다.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="company_name">회사명 *</Label>
            <Input id="company_name" name="company_name" required />
            <FieldError messages={errors.company_name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz_reg_no">사업자등록번호 *</Label>
            <Input
              id="biz_reg_no"
              name="biz_reg_no"
              placeholder="000-00-00000"
              required
            />
            <FieldError messages={errors.biz_reg_no} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="representative">대표자명</Label>
            <Input id="representative" name="representative" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="established_year">설립 연도</Label>
            <Input
              id="established_year"
              name="established_year"
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              placeholder="2020"
            />
            <FieldError messages={errors.established_year} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff_size">인원 규모</Label>
            <select
              id="staff_size"
              name="staff_size"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="">선택</option>
              {STAFF_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="website">웹사이트</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://"
            />
            <FieldError messages={errors.website} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">주소</Label>
            <Input id="address" name="address" />
          </div>
        </CardContent>
      </Card>

      {/* 담당자 */}
      <Card>
        <CardHeader>
          <CardTitle>담당자</CardTitle>
          <CardDescription>
            검토 결과와 계약서를 받을 담당자입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_person">담당자명</Label>
            <Input id="contact_person" name="contact_person" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">연락처</Label>
            <Input id="contact_phone" name="contact_phone" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="contact_email">이메일 *</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              required
            />
            <p className="text-xs text-muted-foreground">
              입점 승인 시 이 주소로 계정이 발급됩니다.
            </p>
            <FieldError messages={errors.contact_email} />
          </div>
        </CardContent>
      </Card>

      {/* 전문 분야 / 강점 */}
      <Card>
        <CardHeader>
          <CardTitle>전문 분야 및 강점</CardTitle>
          <CardDescription>
            매칭에 활용되는 정보입니다. 정확히 작성할수록 적합한 RFP를 받습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>전문 분야 * (복수 선택)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PARTNER_CATEGORIES.map((cat) => (
                <label
                  key={cat.value}
                  className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    name="categories"
                    value={cat.value}
                    className="h-4 w-4"
                  />
                  {cat.label}
                </label>
              ))}
            </div>
            <FieldError messages={errors.categories} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strengths">강점 키워드</Label>
            <Input
              id="strengths"
              name="strengths"
              placeholder="예: 메타광고, 그로스해킹, 데이터분석 (콤마로 구분)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notable_clients">주요 클라이언트</Label>
            <Input
              id="notable_clients"
              name="notable_clients"
              placeholder="예: 회사A, 회사B (콤마로 구분)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="intro">소개글</Label>
            <Textarea
              id="intro"
              name="intro"
              rows={5}
              placeholder="회사의 차별점, 운영 철학 등을 자유롭게 적어주세요."
            />
          </div>
        </CardContent>
      </Card>

      {/* 동의 + 제출 */}
      <Card>
        <CardContent className="pt-6 space-y-4">
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
            사업자등록증, 포트폴리오 파일은 입점 검토 단계에서 운영자가 별도로
            요청드립니다.
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
