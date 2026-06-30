"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { STAFF_SIZE_OPTIONS } from "@/lib/schemas/partner-application";

import {
  updatePartnerInfo,
  type ActionResult,
  type EditablePartnerInput,
} from "./actions";

export function EditPartnerForm({
  partnerId,
  initial,
}: {
  partnerId: string;
  initial: EditablePartnerInput;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [form, setForm] = useState<EditablePartnerInput>(initial);

  function set(key: keyof EditablePartnerInput, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    setResult(null);
    startTransition(async () => {
      const r = await updatePartnerInfo(partnerId, form);
      setResult(r);
      if (r.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          ✎ 정보 수정
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>기본 정보 수정</CardTitle>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          닫기
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <EditField
          label="대행사명"
          value={form.company_name}
          onChange={(v) => set("company_name", v)}
        />
        <EditField
          label="사업자등록번호"
          value={form.biz_reg_no}
          placeholder="000-00-00000"
          onChange={(v) => set("biz_reg_no", v)}
        />
        <EditField
          label="담당자"
          value={form.contact_person}
          onChange={(v) => set("contact_person", v)}
        />
        <EditField
          label="연락처"
          value={form.contact_phone}
          onChange={(v) => set("contact_phone", v)}
        />
        <EditField
          label="이메일"
          type="email"
          value={form.contact_email}
          onChange={(v) => set("contact_email", v)}
        />
        <EditField
          label="웹사이트"
          placeholder="https://"
          value={form.website}
          onChange={(v) => set("website", v)}
        />
        <div className="space-y-1.5">
          <Label className="text-xs">인원 규모</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={form.staff_size}
            onChange={(e) => set("staff_size", e.target.value)}
          >
            <option value="">선택</option>
            {STAFF_SIZE_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <EditField
          label="전문 분야"
          value={form.specialty}
          className="sm:col-span-2"
          onChange={(v) => set("specialty", v)}
        />
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs">마케팅 능력 소개</Label>
          <Textarea
            rows={4}
            value={form.intro}
            onChange={(e) => set("intro", e.target.value)}
          />
        </div>

        {result && !result.ok ? (
          <p className="text-sm text-destructive sm:col-span-2">
            {result.error}
          </p>
        ) : null}

        <div className="flex gap-2 sm:col-span-2">
          <Button size="sm" onClick={submit} disabled={pending}>
            {pending ? "저장 중..." : "저장"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            취소
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EditField({
  label,
  value,
  onChange,
  type,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label className="text-xs">{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
