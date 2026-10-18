"use client";

import { useState, useTransition } from "react";

import { submitQuickLead } from "@/app/(public)/apply/lead-actions";
import { trackConversion } from "@/components/analytics/track";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BUDGET_OPTIONS } from "@/lib/newsletter/constants";

// 뉴스레터 호 하단 "팀퍼스트에 상담 신청하기" — 브랜드명·월 마케팅 예산·연락처 → pb_leads (운영자 즉시 알림)
export function NewsletterConsultForm({ slug, defaultBrand }: { slug: string; defaultBrand?: string }) {
  const [brand, setBrand] = useState(defaultBrand ?? "");
  const [budget, setBudget] = useState<number>(BUDGET_OPTIONS[2].value);
  const [phone, setPhone] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const valid = brand.trim().length > 0 && phone.replace(/\D/g, "").length >= 9;

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
        <p className="font-bold text-emerald-800">✅ 상담 신청이 접수되었습니다</p>
        <p className="mt-1 text-xs text-emerald-700">담당자가 영업일 기준 1일 내에 연락드립니다.</p>
      </div>
    );
  }

  return (
    <form
      className="grid gap-2 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid || pending) return;
        setErr(null);
        start(async () => {
          const r = await submitQuickLead({
            brand,
            phone,
            budget,
            source: `nl:${slug}`.slice(0, 40),
            label: "📰 뉴스레터 상담 신청",
            budgetLabel: "월 마케팅 예산",
          });
          if (!r.ok) {
            setErr("접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
            return;
          }
          setDone(true);
          trackConversion("Lead", { content_name: `newsletter_consult_${slug}`, value: budget, currency: "KRW" }, "lead");
        });
      }}
    >
      <Input placeholder="브랜드명 *" value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={100} required aria-label="브랜드명" />
      <select aria-label="월 마케팅 예산" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
        {BUDGET_OPTIONS.map((b) => (
          <option key={b.value} value={b.value}>
            월 마케팅 예산 · {b.label}
          </option>
        ))}
      </select>
      <Input placeholder="연락처 * (010-0000-0000)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} required aria-label="연락처" />
      {err ? <p className="text-xs text-red-600 sm:col-span-3">{err}</p> : null}
      <Button type="submit" disabled={!valid || pending} className="sm:col-span-3">
        {pending ? "접수 중…" : "팀퍼스트에 상담 신청하기"}
      </Button>
    </form>
  );
}
