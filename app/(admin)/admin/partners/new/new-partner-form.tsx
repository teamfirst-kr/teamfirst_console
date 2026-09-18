"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PARTNER_CATEGORIES,
  STAFF_SIZE_OPTIONS,
} from "@/lib/schemas/partner-application";

import { createPartnerByAdmin, type CreatePartnerResult } from "./actions";

const inputCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary";
const textareaCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

// 초기 상태 선택지 — contracted는 RFP 발송 대상에 바로 포함되므로 라벨로 명시
const STATUS_OPTIONS = [
  { value: "contracted", label: "계약 완료 (입점)", desc: "RFP 발송 대상에 바로 포함됩니다." },
  { value: "reviewing", label: "검토 중", desc: "RFP 발송 대상이 아닙니다." },
  { value: "pending", label: "검토 대기", desc: "공개 신청서 접수와 같은 상태입니다." },
] as const;

type FormState = {
  company_name: string;
  biz_reg_no: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  specialty: string;
  staff_size: string;
  intro: string;
  categories: string[];
  status: "pending" | "reviewing" | "contracted";
  admin_memo: string;
};

export function NewPartnerForm() {
  const router = useRouter();
  const [f, setF] = useState<FormState>({
    company_name: "",
    biz_reg_no: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    specialty: "",
    staff_size: "",
    intro: "",
    categories: [],
    status: "contracted",
    admin_memo: "",
  });
  const [pending, start] = useTransition();
  const [result, setResult] = useState<CreatePartnerResult | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const toggleCategory = (v: string) =>
    set("categories", f.categories.includes(v) ? f.categories.filter((c) => c !== v) : [...f.categories, v]);

  const err = (key: string) => (result && !result.ok ? result.fieldErrors?.[key]?.[0] : undefined);

  function submit() {
    setResult(null);
    start(async () => {
      const r = await createPartnerByAdmin({
        ...f,
        staff_size: (f.staff_size || null) as (typeof STAFF_SIZE_OPTIONS)[number] | null,
      });
      setResult(r);
      if (r.ok) router.push(`/admin/partners/${r.id}`);
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="대행사명 *" error={err("company_name")}>
            <input value={f.company_name} onChange={(e) => set("company_name", e.target.value)} className={inputCls} />
          </Field>
          <Field label="사업자등록번호 *" error={err("biz_reg_no")}>
            <input value={f.biz_reg_no} onChange={(e) => set("biz_reg_no", e.target.value)} placeholder="000-00-00000" className={inputCls} />
          </Field>
          <Field label="담당자 성함/직책 *" error={err("contact_person")}>
            <input value={f.contact_person} onChange={(e) => set("contact_person", e.target.value)} className={inputCls} />
          </Field>
          <Field label="담당자 이메일 *" error={err("contact_email")}>
            <input type="email" value={f.contact_email} onChange={(e) => set("contact_email", e.target.value)} className={inputCls} />
          </Field>
          <Field label="연락처 *" error={err("contact_phone")}>
            <input value={f.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} placeholder="010-0000-0000" className={inputCls} />
          </Field>
          <Field label="홈페이지" error={err("website")}>
            <input value={f.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={inputCls} />
          </Field>
          <Field label="직원수" error={err("staff_size")}>
            <select value={f.staff_size} onChange={(e) => set("staff_size", e.target.value)} className={inputCls}>
              <option value="">선택 안 함</option>
              {STAFF_SIZE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="자신있는 업종/카테고리" error={err("specialty")}>
            <input value={f.specialty} onChange={(e) => set("specialty", e.target.value)} className={inputCls} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>광고대행 가능 매체 *</CardTitle>
        </CardHeader>
        <CardContent>
          {err("categories") ? <p className="mb-2 text-xs text-destructive">{err("categories")}</p> : null}
          <div className="grid gap-2 sm:grid-cols-2">
            {PARTNER_CATEGORIES.map((c) => (
              <label key={c.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-input px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={f.categories.includes(c.value)}
                  onChange={() => toggleCategory(c.value)}
                  className="h-4 w-4"
                />
                <span className="break-keep">{c.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>초기 상태 · 메모</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {STATUS_OPTIONS.map((o) => (
              <label key={o.value} className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-input px-3 py-2.5 text-sm">
                <input
                  type="radio"
                  name="status"
                  checked={f.status === o.value}
                  onChange={() => set("status", o.value)}
                  className="mt-0.5 h-4 w-4"
                />
                <span>
                  <span className="font-medium text-foreground">{o.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{o.desc}</span>
                </span>
              </label>
            ))}
          </div>
          <Field label="소개글" error={err("intro")}>
            <textarea rows={3} value={f.intro} onChange={(e) => set("intro", e.target.value)} className={textareaCls} />
          </Field>
          <Field label="운영자 메모" error={err("admin_memo")}>
            <textarea rows={2} value={f.admin_memo} onChange={(e) => set("admin_memo", e.target.value)} className={textareaCls} />
          </Field>
        </CardContent>
      </Card>

      {result && !result.ok ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{result.error}</div>
      ) : null}

      <div className="flex gap-2">
        <Button onClick={submit} disabled={pending}>
          {pending ? "등록 중..." : "대행사 등록"}
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href="/admin/partners">취소</Link>
        </Button>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-secondary">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
