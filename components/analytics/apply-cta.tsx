"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { readCalcState } from "@/lib/calc-state";
import { submitQuickLead } from "@/app/(public)/apply/lead-actions";
import { trackConversion } from "./track";

// 페이백 신청 유도 CTA — 클릭 시 Meta AddToCart(장바구니) 전환 발화 후
// 간편 신청 팝업(브랜드명+연락처 → 즉시 리드 저장) 오픈. DB 최대 확보용 2단계 캡처:
// 1단계 미니폼 제출 or '추가 정보 입력하기'로 정식 신청(/apply, 프리필) 이동.
export function ApplyCtaLink({
  location,
  className,
  children,
}: {
  location: string; // "hero" | "calculator" | "footer" | "solution_modal" 등
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const valid = brand.trim().length > 0 && phone.replace(/\D/g, "").length >= 9;

  // 정식 신청 링크 — 입력한 브랜드/연락처를 쿼리로 넘겨 프리필
  const applyHref = () => {
    const q = new URLSearchParams();
    if (brand.trim()) q.set("brand", brand.trim());
    if (phone.trim()) q.set("phone", phone.trim());
    const s = q.toString();
    return s ? `/apply?${s}` : "/apply";
  };

  function openModal() {
    trackConversion("AddToCart", { content_name: location }, "add_to_cart");
    setOpen(true);
  }

  async function submit() {
    if (busy || !valid || sent) return;
    setErrMsg(null);
    setBusy(true);
    try {
      const calc = readCalcState();
      const res = await submitQuickLead({
        brand,
        phone,
        budget: calc?.b ?? null,
        source: location,
      });
      if (res.ok) {
        setSent(true);
        trackConversion("Lead", { content_name: location }, "generate_lead");
      } else {
        setErrMsg(
          "일시적 오류로 접수되지 않았습니다. 잠시 후 다시 시도하시거나 '추가 정보 입력하기'로 신청해주세요.",
        );
      }
    } catch {
      setErrMsg(
        "일시적 오류로 접수되지 않았습니다. 잠시 후 다시 시도하시거나 '추가 정보 입력하기'로 신청해주세요.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="lg" className={className} onClick={openModal}>
        {children}
      </Button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
              onClick={() => setOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-label="페이백 간편 신청"
            >
              <div
                className="w-full rounded-t-2xl bg-card p-6 text-left shadow-2xl sm:max-w-sm sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="break-keep text-base font-bold leading-snug text-secondary">
                    {sent ? "✅ 신청이 접수되었습니다!" : "페이백 신청"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="닫기"
                    className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    ✕
                  </button>
                </div>

                {sent ? (
                  <>
                    <p className="mt-2 break-keep text-sm leading-relaxed text-muted-foreground">
                      담당자가 <strong className="text-foreground">1영업일 내</strong>{" "}
                      연락드립니다. 지금 추가 정보를 입력해두시면 검토가 더
                      빨라져요.
                    </p>
                    <Button asChild className="mt-4 w-full">
                      <Link href={applyHref()}>📎 추가 정보 입력하기 →</Link>
                    </Button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="mt-2.5 w-full text-center text-xs text-muted-foreground hover:underline"
                    >
                      나중에 할게요
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mt-1.5 break-keep text-xs leading-relaxed text-muted-foreground">
                      브랜드명과 연락처만 남겨주시면 담당자가 바로 연락드립니다.
                    </p>
                    <div className="mt-3 space-y-2">
                      <input
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="브랜드명 *"
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                      />
                      <input
                        type="tel"
                        inputMode="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="연락처 * (010-0000-0000)"
                        className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                      />
                      {errMsg ? (
                        <p className="break-keep rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                          {errMsg}
                        </p>
                      ) : null}
                      <Button
                        className="w-full"
                        disabled={busy || !valid}
                        onClick={submit}
                      >
                        {busy ? "접수 중..." : "신청"}
                      </Button>
                    </div>
                    <div className="mt-3 border-t pt-3 text-center">
                      <Link
                        href={applyHref()}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        추가 정보 입력하기 → (정식 신청 페이지)
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
