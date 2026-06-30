"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  upsertInvoiceProfile,
  type InvoiceProfileState,
} from "./actions";

export type InvoiceProfileValues = {
  company_name: string;
  biz_reg_no: string;
  representative: string | null;
  address: string | null;
  business_type: string | null;
  business_item: string | null;
  invoice_email: string;
  contact_name: string | null;
  contact_phone: string | null;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="text-xs text-destructive">{messages[0]}</p>;
}

export function InvoiceProfileForm({
  initial,
}: {
  initial: InvoiceProfileValues | null;
}) {
  const [state, formAction, pending] = useActionState<
    InvoiceProfileState,
    FormData
  >(upsertInvoiceProfile, null);
  const errs = (state && !state.ok && state.fieldErrors) || {};

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="company_name">상호 *</Label>
          <Input
            id="company_name"
            name="company_name"
            defaultValue={initial?.company_name ?? ""}
            required
          />
          <FieldError messages={errs.company_name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz_reg_no">사업자등록번호 *</Label>
          <Input
            id="biz_reg_no"
            name="biz_reg_no"
            inputMode="numeric"
            placeholder="숫자 10자리"
            pattern="\d{3}-?\d{2}-?\d{5}"
            title="사업자등록번호 10자리를 입력해주세요. (하이픈 선택)"
            defaultValue={initial?.biz_reg_no ?? ""}
            required
          />
          <FieldError messages={errs.biz_reg_no} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="representative">대표자명</Label>
          <Input
            id="representative"
            name="representative"
            defaultValue={initial?.representative ?? ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">사업장 주소</Label>
          <Input
            id="address"
            name="address"
            defaultValue={initial?.address ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_type">업태</Label>
          <Input
            id="business_type"
            name="business_type"
            placeholder="예: 서비스업"
            defaultValue={initial?.business_type ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business_item">종목</Label>
          <Input
            id="business_item"
            name="business_item"
            placeholder="예: 광고대행"
            defaultValue={initial?.business_item ?? ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="invoice_email">계산서 수신 이메일 *</Label>
          <Input
            id="invoice_email"
            name="invoice_email"
            type="email"
            defaultValue={initial?.invoice_email ?? ""}
            required
          />
          <FieldError messages={errs.invoice_email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_name">담당자명</Label>
          <Input
            id="contact_name"
            name="contact_name"
            defaultValue={initial?.contact_name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">담당자 연락처</Label>
          <Input
            id="contact_phone"
            name="contact_phone"
            defaultValue={initial?.contact_phone ?? ""}
          />
        </div>
      </div>

      {state?.ok ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      ) : null}
      {state && !state.ok ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중..." : "발행정보 저장"}
        </Button>
      </div>
    </form>
  );
}
