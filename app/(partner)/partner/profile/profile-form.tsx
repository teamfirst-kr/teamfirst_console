"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PARTNER_CATEGORIES, STAFF_SIZE_OPTIONS } from "@/lib/schemas/partner-application";

import { updatePartnerProfile, type ProfileFormValues, type ProfileState } from "./actions";

export type { ProfileFormValues };

export function PartnerProfileForm({ initial: saved }: { initial: ProfileFormValues }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updatePartnerProfile, null);
  const err = (k: string) => (state && !state.ok ? state.fieldErrors?.[k]?.[0] : undefined);
  // 검증 오류 시 React가 폼을 리셋하므로 제출했던 값을 defaultValue로 되돌려준다
  const initial = state && !state.ok && state.values ? state.values : saved;

  return (
    <form action={action} className="space-y-8">
      <Fieldset title="기본 정보">
        <Grid>
          <Field label="대행사명 *" name="company_name" defaultValue={initial.company_name} error={err("company_name")} />
          <Field label="대표자" name="representative" defaultValue={initial.representative} error={err("representative")} />
          <Field label="설립연도" name="established_year" defaultValue={initial.established_year} placeholder="예: 2018" inputMode="numeric" error={err("established_year")} />
          <div>
            <Label htmlFor="staff_size">직원수 *</Label>
            <select id="staff_size" name="staff_size" defaultValue={initial.staff_size} className="mt-1 flex h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">선택</option>
              {STAFF_SIZE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ErrorText text={err("staff_size")} />
          </div>
          <Field label="웹사이트" name="website" defaultValue={initial.website} placeholder="https://" error={err("website")} />
          <Field label="주소" name="address" defaultValue={initial.address} error={err("address")} />
        </Grid>
      </Fieldset>

      <Fieldset title="담당자 연락처" desc="RFP 도착 알림과 운영팀 연락에 사용됩니다.">
        <Grid>
          <Field label="담당자 성함 / 직책 *" name="contact_person" defaultValue={initial.contact_person} error={err("contact_person")} />
          <Field label="이메일 *" name="contact_email" type="email" defaultValue={initial.contact_email} error={err("contact_email")} />
          <Field label="직통 연락처 *" name="contact_phone" defaultValue={initial.contact_phone} inputMode="tel" error={err("contact_phone")} />
        </Grid>
      </Fieldset>

      <Fieldset title="광고대행 가능 매체 *" desc="RFP 매칭의 핵심 기준입니다. 운영 가능한 매체를 모두 선택해주세요.">
        <div className="grid gap-2 sm:grid-cols-2">
          {PARTNER_CATEGORIES.map((c) => (
            <label key={c.value} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40">
              <input type="checkbox" name="categories" value={c.value} defaultChecked={initial.categories.includes(c.value)} className="h-4 w-4 accent-[#004AAD]" />
              {c.label}
            </label>
          ))}
        </div>
        <ErrorText text={err("categories")} />
      </Fieldset>

      <Fieldset title="소개 · 강점">
        <div className="space-y-4">
          <div>
            <Label htmlFor="specialty">전문 분야 (한 줄)</Label>
            <Input id="specialty" name="specialty" defaultValue={initial.specialty} maxLength={300} placeholder="예: 커머스 퍼포먼스 · 네이버 SA 중심" />
            <ErrorText text={err("specialty")} />
          </div>
          <div>
            <Label htmlFor="intro">대행사 소개</Label>
            <Textarea id="intro" name="intro" defaultValue={initial.intro} rows={6} maxLength={3000} placeholder="운영 철학, 팀 구성, 대표 성과 등" />
            <ErrorText text={err("intro")} />
          </div>
          <div>
            <Label htmlFor="strengths">강점 키워드</Label>
            <Input id="strengths" name="strengths" defaultValue={initial.strengths} placeholder="콤마로 구분 · 예: 데이터 기반 운영, 빠른 소재 제작" />
            <ErrorText text={err("strengths")} />
          </div>
          <div>
            <Label htmlFor="notable_clients">주요 클라이언트</Label>
            <Textarea id="notable_clients" name="notable_clients" defaultValue={initial.notable_clients} rows={3} placeholder="콤마 또는 줄바꿈으로 구분" />
            <ErrorText text={err("notable_clients")} />
          </div>
        </div>
      </Fieldset>

      {state && !state.ok ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state && state.ok ? <p className="text-sm text-emerald-700">✅ {state.message}</p> : null}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중…" : "변경 사항 저장"}
        </Button>
      </div>
    </form>
  );
}

function Fieldset({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="text-base font-bold text-secondary">{title}</h2>
      {desc ? <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  name,
  error,
  ...rest
}: { label: string; name: string; error?: string } & Omit<React.ComponentProps<typeof Input>, "name">) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...rest} />
      <ErrorText text={error} />
    </div>
  );
}

function ErrorText({ text }: { text?: string }) {
  return text ? <p className="mt-1 text-xs text-destructive">{text}</p> : null;
}
