"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { subscribeNewsletter } from "@/app/(public)/newsletter/actions";
import { trackEvent } from "@/components/analytics/track";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORG_TYPES } from "@/lib/newsletter/constants";

// 뉴스레터 등록 폼 — 랜딩 하단·뉴스레터 페이지·호 상세(열람 잠금) 공용.
// 사업자번호 + 브랜드명 + 이메일은 필수 (열람·수신 조건). 성공 시 서버가 열람 쿠키를 심고 refresh로 잠금을 푼다.
export function NewsletterSubscribeForm({
  source,
  dark = false,
  submitLabel = "📬 무료로 구독하기",
  refreshOnSuccess = false,
}: {
  source: string;
  dark?: boolean;
  submitLabel?: string;
  refreshOnSuccess?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [brandName, setBrandName] = useState("");
  const [bizRegNo, setBizRegNo] = useState("");
  const [orgType, setOrgType] = useState("brand");
  const [consent, setConsent] = useState(false);
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const bizDigits = bizRegNo.replace(/\D/g, "");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) && brandName.trim().length > 0 && bizDigits.length === 10 && consent;
  const muted = dark ? "text-white/70" : "text-muted-foreground";
  const inputCls = dark ? "border-white/20 bg-white/10 text-white placeholder:text-white/50" : "";

  function submit() {
    if (!valid || pending) return;
    setErr(null);
    start(async () => {
      const r = await subscribeNewsletter({ email, brandName, bizRegNo: bizDigits, orgType, source, consent });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      trackEvent("newsletter_subscribe", { source, org_type: orgType, already: !!r.already });
      if (refreshOnSuccess) {
        router.refresh();
        return;
      }
      setDone(r.already ? "이미 등록된 이메일입니다. 다음 호를 기다려주세요!" : "등록이 완료되었습니다. 다음 호부터 메일로 받아보실 수 있어요.");
    });
  }

  if (done) {
    return (
      <div className={"rounded-xl border p-5 text-center " + (dark ? "border-white/20 bg-white/10" : "border-emerald-200 bg-emerald-50")}>
        <p className={"text-base font-bold " + (dark ? "text-white" : "text-emerald-800")}>✅ {done}</p>
        <p className={"mt-1 text-xs " + muted}>
          지난 호는{" "}
          <Link href="/newsletter" className="underline">
            뉴스레터 보관함
          </Link>
          에서 바로 읽을 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="브랜드명 *" value={brandName} onChange={(e) => setBrandName(e.target.value)} className={inputCls} maxLength={100} required aria-label="브랜드명" />
        <Input
          placeholder="사업자등록번호 * (10자리)"
          value={bizRegNo}
          onChange={(e) => setBizRegNo(e.target.value)}
          className={inputCls}
          inputMode="numeric"
          maxLength={12}
          required
          aria-label="사업자등록번호"
        />
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="업무용 이메일 *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          required
          aria-label="이메일"
        />
        <select
          aria-label="소속 유형"
          value={orgType}
          onChange={(e) => setOrgType(e.target.value)}
          className={"flex h-10 w-full rounded-md border px-3 text-sm " + (dark ? "border-white/20 bg-white/10 text-white [&>option]:text-secondary" : "border-input bg-background")}
        >
          {ORG_TYPES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <label className={"flex cursor-pointer items-start gap-2 text-xs leading-relaxed " + muted}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#004AAD]" />
        <span>
          팀퍼스트 뉴스레터와 서비스 안내 메일 수신에 동의합니다. 입력한 정보는 뉴스레터 발송과 서비스 안내에만 사용되며, 언제든 메일 하단에서 수신거부할 수 있습니다.{" "}
          <Link href="/privacy" className="underline" target="_blank">
            개인정보처리방침
          </Link>
        </span>
      </label>
      {err ? <p className={"text-xs " + (dark ? "text-red-300" : "text-red-600")}>{err}</p> : null}
      <Button type="submit" disabled={!valid || pending} className={"w-full sm:w-auto " + (dark ? "bg-white text-secondary hover:bg-white/90" : "")}>
        {pending ? "처리 중…" : submitLabel}
      </Button>
    </form>
  );
}
