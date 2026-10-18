"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { subscribeNewsletter } from "@/app/(public)/newsletter/actions";
import { trackEvent } from "@/components/analytics/track";
import { ORG_TYPES } from "@/lib/newsletter/constants";

// 뉴스레터 등록 폼 — 랜딩 하단·뉴스레터 페이지·호 상세(열람 잠금) 공용.
// 사업자번호 + 브랜드명 + 이메일은 필수 (열람·수신 조건). 성공 시 서버가 열람 쿠키를 심고 refresh로 잠금을 푼다.
export function NewsletterSubscribeForm({
  source,
  submitLabel = "구독 신청",
  refreshOnSuccess = false,
}: {
  source: string;
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

  function submit() {
    if (!valid || pending) return;
    setErr(null);
    start(async () => {
      const r = await subscribeNewsletter({ email, brandName, bizRegNo: bizDigits, orgType, source, consent });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      if (r.mismatch) {
        setErr("이미 등록된 이메일인데 사업자등록번호가 등록 정보와 다릅니다. 등록 당시 번호로 다시 입력하거나, 받으신 메일의 '웹에서 보기' 링크로 열람해주세요.");
        return;
      }
      trackEvent("newsletter_subscribe", { source, org_type: orgType, already: !!r.already });
      if (refreshOnSuccess) {
        router.refresh();
        return;
      }
      setDone(r.already ? "이미 등록된 이메일입니다. 다음 호를 기다려주세요." : "등록이 완료되었습니다. 다음 호부터 메일로 받아보실 수 있습니다.");
    });
  }

  if (done) {
    return (
      <div className="border-t border-secondary pt-4">
        <p className="text-sm font-semibold text-secondary">{done}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          지난 호는{" "}
          <Link href="/newsletter" className="underline underline-offset-2">
            보관함
          </Link>
          에서 바로 읽을 수 있습니다.
        </p>
      </div>
    );
  }

  const field = "h-11 w-full border-b border-border bg-transparent px-0 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:border-secondary focus:outline-none";

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">브랜드명</span>
          <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className={field} maxLength={100} required placeholder="예: 팀퍼스트" />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">사업자등록번호</span>
          <input value={bizRegNo} onChange={(e) => setBizRegNo(e.target.value)} className={field} inputMode="numeric" maxLength={12} required placeholder="000-00-00000" />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">업무용 이메일</span>
          <input type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} required placeholder="name@company.com" />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">소속</span>
          <select value={orgType} onChange={(e) => setOrgType(e.target.value)} className={field + " cursor-pointer"}>
            {ORG_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#000C31]" />
        <span>
          팀퍼스트 뉴스레터 및 광고성 정보(서비스 홍보·상담 안내) 수신에 동의합니다. 입력한 정보는 뉴스레터 발송과 서비스 안내에만 사용되며, 언제든 메일 하단에서 수신거부할 수 있습니다.{" "}
          <Link href="/privacy" className="underline underline-offset-2" target="_blank">
            개인정보처리방침
          </Link>
        </span>
      </label>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
      <button
        type="submit"
        disabled={!valid || pending}
        className="inline-flex h-11 w-full items-center justify-center bg-secondary px-6 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground sm:w-auto"
      >
        {pending ? "처리 중" : submitLabel}
      </button>
    </form>
  );
}
