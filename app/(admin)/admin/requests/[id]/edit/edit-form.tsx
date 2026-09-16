"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MARKETING_GOAL_OPTIONS,
  MEETING_CYCLE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  REPORT_CYCLE_OPTIONS,
  REQUEST_KPI_OPTIONS,
  REQUEST_MEDIA,
  TOOL_OPTIONS,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";

import { updateRequestBrief, type EditRequestState } from "../actions";

const inputCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary";
const textareaCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

// 광고주 제출 폼과 동일 필드를 한 화면에 펼친 운영자 수정 폼.
// 검증은 서버 액션에서 동일 스키마(matchingRequestSchema)로 수행.
export function RequestEditForm({
  requestId,
  brief,
}: {
  requestId: string;
  brief: Partial<MatchingBrief>;
}) {
  const [state, formAction, pending] = useActionState<EditRequestState, FormData>(
    updateRequestBrief,
    null,
  );

  // 매체 선택은 매체별 예산 입력 활성화와 연동되므로 controlled로 관리
  const [channels, setChannels] = useState<Set<string>>(
    () => new Set(brief.channels ?? []),
  );

  function toggleChannel(v: string) {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  const err = (key: string) =>
    state && "fieldErrors" in state ? state.fieldErrors?.[key]?.[0] : undefined;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="request_id" value={requestId} />

      <Card>
        <CardHeader>
          <CardTitle>광고주 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="상호 (사업자명) *" error={err("company_name")}>
            <input name="company_name" defaultValue={brief.company_name ?? ""} className={inputCls} />
          </Field>
          <Field label="사업자등록번호 *" error={err("biz_reg_no")}>
            <input name="biz_reg_no" defaultValue={brief.biz_reg_no ?? ""} placeholder="000-00-00000" className={inputCls} />
          </Field>
          <Field label="대표자명 *" error={err("representative")}>
            <input name="representative" defaultValue={brief.representative ?? ""} className={inputCls} />
          </Field>
          <Field label="브랜드명 *" error={err("brand_name")}>
            <input name="brand_name" defaultValue={brief.brand_name ?? ""} className={inputCls} />
          </Field>
          <Field label="담당자명 *" error={err("contact_name")}>
            <input name="contact_name" defaultValue={brief.contact_name ?? ""} className={inputCls} />
          </Field>
          <Field label="담당자 직책 *" error={err("contact_title")}>
            <input name="contact_title" defaultValue={brief.contact_title ?? ""} className={inputCls} />
          </Field>
          <Field label="이메일 *" error={err("email")}>
            <input name="email" type="email" defaultValue={brief.email ?? ""} className={inputCls} />
          </Field>
          <Field label="연락처 *" error={err("phone")}>
            <input name="phone" defaultValue={brief.phone ?? ""} placeholder="010-1234-5678" className={inputCls} />
          </Field>
          <Field label="홈페이지" error={err("website")}>
            <input name="website" defaultValue={brief.website ?? ""} placeholder="https://" className={inputCls} />
          </Field>
          <Field label="추진 카테고리 *" error={err("category")}>
            <input name="category" defaultValue={brief.category ?? ""} className={inputCls} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>브리프</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="주력 제품 / 서비스 소개 *" error={err("product_intro")}>
            <textarea name="product_intro" rows={4} defaultValue={brief.product_intro ?? ""} className={textareaCls} />
          </Field>
          <Field label="신규 대행사 모집 이유 *" error={err("reason")}>
            <textarea name="reason" rows={4} defaultValue={brief.reason ?? ""} className={textareaCls} />
          </Field>

          <CheckGroup
            label="마케팅 목표 * (최대 2개)"
            name="marketing_goals"
            options={[...MARKETING_GOAL_OPTIONS]}
            defaults={brief.marketing_goals ?? []}
            error={err("marketing_goals")}
          />

          <div>
            <p className="mb-1.5 text-sm font-semibold text-secondary">
              요청 매체 * <span className="font-normal text-muted-foreground">(선택 매체별 집행 예정 월평균 예산도 입력)</span>
            </p>
            {err("channels") ? (
              <p className="mb-1.5 text-xs text-destructive">{err("channels")}</p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              {REQUEST_MEDIA.map((m) => {
                const on = channels.has(m.value);
                return (
                  <div
                    key={m.value}
                    className={
                      "rounded-lg border px-3 py-2.5 " +
                      (on ? "border-primary/50 bg-primary/5" : "border-input")
                    }
                  >
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name="channels"
                        value={m.value}
                        checked={on}
                        onChange={() => toggleChannel(m.value)}
                        className="h-4 w-4"
                      />
                      <span className="break-keep">{m.label}</span>
                    </label>
                    {on ? (
                      <div className="mt-2 flex items-center gap-1.5 pl-6">
                        <input
                          name={`planned_budget_${m.value}`}
                          inputMode="numeric"
                          defaultValue={
                            brief.planned_budgets?.[m.value]
                              ? String(brief.planned_budgets[m.value])
                              : ""
                          }
                          placeholder="월 예산"
                          className="h-8 w-36 rounded-md border border-input bg-background px-2 text-right text-xs"
                        />
                        <span className="text-xs text-muted-foreground">원</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <Field label="희망 대행 기간 *" error={err("duration")}>
            <input name="duration" defaultValue={brief.duration ?? ""} placeholder="예: 6개월" className={inputCls} />
          </Field>

          <CheckGroup
            label="중요 성과지표(KPI) *"
            name="kpis"
            options={[...REQUEST_KPI_OPTIONS]}
            defaults={brief.kpis ?? []}
            error={err("kpis")}
          />
          <CheckGroup
            label="리포트 주기 *"
            name="report_cycles"
            options={[...REPORT_CYCLE_OPTIONS]}
            defaults={brief.report_cycles ?? []}
            error={err("report_cycles")}
          />
          <CheckGroup
            label="미팅 주기 *"
            name="meeting_cycles"
            options={[...MEETING_CYCLE_OPTIONS]}
            defaults={brief.meeting_cycles ?? []}
            error={err("meeting_cycles")}
          />
          <CheckGroup
            label="운영 툴 *"
            name="tools"
            options={[...TOOL_OPTIONS]}
            defaults={brief.tools ?? []}
            error={err("tools")}
          />
          <CheckGroup
            label="희망 계약 방식 *"
            name="payment_methods"
            options={[...PAYMENT_METHOD_OPTIONS]}
            defaults={brief.payment_methods ?? []}
            error={err("payment_methods")}
          />

          <Field label="매칭 희망 대행사 기준 *" error={err("preferred_agency")}>
            <textarea name="preferred_agency" rows={3} defaultValue={brief.preferred_agency ?? ""} className={textareaCls} />
          </Field>
          <Field label="비희망 대행사 특징" error={err("avoided_agency")}>
            <textarea name="avoided_agency" rows={3} defaultValue={brief.avoided_agency ?? ""} className={textareaCls} />
          </Field>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="analysis_access_intent"
              defaultChecked={brief.analysis_access_intent ?? false}
              className="h-4 w-4"
            />
            성과조회(분석) 권한 부여 의향 있음
          </label>
        </CardContent>
      </Card>

      {state && "error" in state ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중..." : "수정사항 저장"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <a href={`/admin/requests/${requestId}`}>취소</a>
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-secondary">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function CheckGroup({
  label,
  name,
  options,
  defaults,
  error,
}: {
  label: string;
  name: string;
  options: string[];
  defaults: string[];
  error?: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-secondary">{label}</p>
      {error ? <p className="mb-1.5 text-xs text-destructive">{error}</p> : null}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              name={name}
              value={o}
              defaultChecked={defaults.includes(o)}
              className="h-4 w-4"
            />
            <span className="break-keep">{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
