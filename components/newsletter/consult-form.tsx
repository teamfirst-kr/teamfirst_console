"use client";

import { useState, useTransition } from "react";

import { submitQuickLead } from "@/app/(public)/apply/lead-actions";
import { trackConversion } from "@/components/analytics/track";
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
      <div className="border-t border-secondary pt-4">
        <p className="text-sm font-semibold text-secondary">상담 신청이 접수되었습니다.</p>
        <p className="mt-1 text-xs text-muted-foreground">담당자가 영업일 기준 1일 내에 연락드립니다.</p>
      </div>
    );
  }

  const field = "h-11 w-full border-b border-border bg-transparent px-0 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:border-secondary focus:outline-none";

  return (
    <form
      className="space-y-4"
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
            label: "뉴스레터 상담 신청",
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
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-3">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">브랜드명</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className={field} maxLength={100} required placeholder="브랜드명" />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">월 마케팅 예산</span>
          <select value={budget} onChange={(e) => setBudget(Number(e.target.value))} className={field + " cursor-pointer"}>
            {BUDGET_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">연락처</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} inputMode="tel" maxLength={20} required placeholder="010-0000-0000" />
        </label>
      </div>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
      <button
        type="submit"
        disabled={!valid || pending}
        className="inline-flex h-11 items-center justify-center bg-secondary px-6 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        {pending ? "접수 중" : "상담 신청하기"}
      </button>
    </form>
  );
}
