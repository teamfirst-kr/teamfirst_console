"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { submitApplyFollowup, type FollowupState } from "./actions";

export function ApplyFollowupForm({
  token,
  hasLicense,
  defaults,
}: {
  token: string;
  hasLicense: boolean;
  defaults: {
    invoice_email: string;
    bank_name: string;
    bank_account: string;
    bank_holder: string;
    solution_login_id: string;
  };
}) {
  const [state, formAction, pending] = useActionState<FollowupState, FormData>(
    submitApplyFollowup,
    null,
  );

  if (state?.ok) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-2xl">✅</p>
        <p className="mt-2 font-semibold text-emerald-800">
          추가 정보가 저장되었습니다
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          담당자 검토 후 다음 절차(약정서 발송)를 메일로 안내드립니다.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="token" value={token} />

      <div>
        <Label htmlFor="business_license">
          사업자등록증 {hasLicense ? "(제출 완료 — 교체 시에만 첨부)" : "*"}
        </Label>
        {hasLicense ? (
          <p className="mb-1.5 mt-1 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            ✓ 이미 제출되었습니다. 파일을 다시 올리면 교체됩니다.
          </p>
        ) : null}
        <Input
          id="business_license"
          name="business_license"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          required={!hasLicense}
          className="pt-1.5"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          PDF/JPG/PNG, 10MB 이하 — 사업자등록번호·대표자 정보는 등록증으로
          확인합니다.
        </p>
      </div>

      <div>
        <Label htmlFor="invoice_email">세금계산서 발행 이메일</Label>
        <Input
          id="invoice_email"
          name="invoice_email"
          type="email"
          placeholder="tax@company.co.kr"
          defaultValue={defaults.invoice_email}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          정산서·계산서 발행 안내를 받을 세무 담당 이메일
        </p>
      </div>

      <div>
        <Label>페이백 입금 계좌</Label>
        <div className="mt-1.5 grid gap-3 sm:grid-cols-3">
          <Input name="bank_name" placeholder="은행" defaultValue={defaults.bank_name} />
          <Input
            name="bank_account"
            placeholder="계좌번호"
            defaultValue={defaults.bank_account}
          />
          <Input
            name="bank_holder"
            placeholder="예금주"
            defaultValue={defaults.bank_holder}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="solution_login_id">솔루션 접속 희망 ID (선택)</Label>
        <Input
          id="solution_login_id"
          name="solution_login_id"
          autoComplete="off"
          placeholder="예: teamfirst_brand (영문·숫자)"
          defaultValue={defaults.solution_login_id}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          미입력 시 활성화 단계에서 별도 안내드립니다.
        </p>
      </div>

      {state && !state.ok ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "저장 중..." : "추가 정보 제출"}
      </Button>
    </form>
  );
}
