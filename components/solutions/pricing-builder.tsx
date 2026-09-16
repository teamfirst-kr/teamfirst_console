"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YouTubeEmbed } from "@/components/payback/youtube-embed";
import { SOLUTION_DETAILS } from "@/components/payback/solution-details";
import { submitQuickLead } from "@/app/(public)/apply/lead-actions";
import { trackConversion } from "@/components/analytics/track";
import {
  BUNDLE_DISCOUNT,
  CATCHLOG_EXTRA_PER_100K,
  CATCHLOG_MAX_PV,
  CATCHLOG_TIERS,
  FIXED_PRICES,
  catchlogMonthly,
  quote,
  type Billing,
  type SolutionKey,
} from "@/lib/solution-pricing";
import { InlineHtmlDoc } from "./inline-html-doc";
import { SOLUTION_CATALOG, type SolutionInfo } from "./solution-catalog";

// 솔루션 구독 페이지 본문 — 상단 예상 구독료 박스(결제 주기·선택·견적·문의) +
// 솔루션별 섹션: 제목(중앙) → 소개 영상 + 가격표 → 상세 소개 문서(구 팝업 HTML 인라인).
// 요금 계산은 lib/solution-pricing.ts 단일 모듈만 사용한다.

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const manPv = (pv: number) => `월 ${Math.round(pv / 10_000)}만 PV`;
const ALL_KEYS: SolutionKey[] = ["log", "report", "bid"];
const PV_OPTIONS = Array.from({ length: CATCHLOG_MAX_PV / 100_000 }, (_, i) => (i + 1) * 100_000);

export function PricingBuilder() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [pv, setPv] = useState<number>(CATCHLOG_TIERS[0].pv);
  const [selected, setSelected] = useState<SolutionKey[]>(ALL_KEYS);
  const [brand, setBrand] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 상세 문서(iframe) 안의 CTA는 postMessage(tf-open-apply)를 보낸다 → 페이지 하단 간편 신청 팝업 오픈
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type === "tf-open-apply") {
        document.getElementById("solution-modal-apply-cta")?.click();
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const q = useMemo(() => quote(selected, billing, pv), [selected, billing, pv]);
  const unit = billing === "yearly" ? "연" : "월";
  const isOn = (k: SolutionKey) => selected.includes(k);
  const toggle = (k: SolutionKey) =>
    setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : ALL_KEYS.filter((x) => x === k || s.includes(x))));

  const valid = selected.length > 0 && brand.trim().length > 0 && phone.replace(/\D/g, "").length >= 9;

  async function submit() {
    if (busy || !valid || sent) return;
    setBusy(true);
    setErr(null);
    try {
      const keys = ALL_KEYS.filter(isOn);
      const source = `sub:${keys.join("+")}/${billing === "yearly" ? "Y" : "M"}${keys.includes("log") ? `/pv${Math.round(pv / 10_000)}` : ""}`;
      const res = await submitQuickLead({ brand, phone, budget: q.total, source, label: "🧩 솔루션 구독 문의" });
      if (!res.ok) {
        setErr("접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      setSent(true);
      trackConversion("Purchase", { content_name: `solution_subscribe_${keys.join("_")}`, value: q.total, currency: "KRW" }, "purchase");
    } catch {
      setErr("접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* ── 예상 구독료 박스 ── */}
      <section id="quote" className="mx-auto max-w-6xl scroll-mt-20 px-6 pt-12">
        <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-lg font-extrabold text-secondary">예상 구독료</p>
                <div className="inline-flex rounded-lg border bg-background p-1 text-sm font-medium">
                  {(["monthly", "yearly"] as Billing[]).map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBilling(b)}
                      aria-pressed={billing === b}
                      className={"rounded-md px-3.5 py-1.5 transition-colors " + (billing === b ? "bg-secondary text-white" : "text-muted-foreground hover:text-foreground")}
                    >
                      {b === "monthly" ? "월간 결제" : "연간 결제"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {SOLUTION_CATALOG.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => toggle(c.key)}
                    aria-pressed={isOn(c.key)}
                    className={
                      "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors " +
                      (isOn(c.key) ? "border-secondary bg-secondary text-white" : "border-border bg-background text-muted-foreground hover:text-foreground")
                    }
                  >
                    {isOn(c.key) ? "✓ " : "+ "}
                    {c.brand}
                  </button>
                ))}
                {isOn("log") ? (
                  <select
                    aria-label="CatchLog 월 페이지뷰"
                    value={pv}
                    onChange={(e) => setPv(Number(e.target.value))}
                    className="rounded-full border bg-background px-3 py-1.5 text-sm"
                  >
                    {PV_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        CatchLog {manPv(p)}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>

              {q.items.length === 0 ? (
                <p className="mt-5 text-sm text-muted-foreground">솔루션을 1개 이상 선택하세요.</p>
              ) : (
                <dl className="mt-5 space-y-1.5 text-sm">
                  {q.items.map((i) => {
                    const c = SOLUTION_CATALOG.find((x) => x.key === i.key)!;
                    return (
                      <div key={i.key} className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">
                          {c.brand} <span className="text-xs">· {c.name}{i.key === "log" ? ` (${manPv(pv)})` : ""}</span>
                        </dt>
                        <dd className="font-medium">{won(i.price)}</dd>
                      </div>
                    );
                  })}
                  {q.discountRate > 0 ? (
                    <div className="flex justify-between gap-3 text-emerald-700">
                      <dt>번들 할인 {q.discountRate}% ({q.items.length}종 구독)</dt>
                      <dd className="font-medium">−{won(q.discount)}</dd>
                    </div>
                  ) : null}
                  <div className="flex items-baseline justify-between gap-3 border-t pt-2">
                    <dt className="font-bold text-secondary">합계 / {unit} (VAT 별도)</dt>
                    <dd className="text-2xl font-extrabold text-secondary">{won(q.total)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                    <dt>VAT 포함</dt>
                    <dd>{won(q.totalWithVat)}</dd>
                  </div>
                </dl>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                2종 구독 시 전체 금액 {BUNDLE_DISCOUNT[2]}% · 3종 구독 시 {BUNDLE_DISCOUNT[3]}% 할인. 광고비 페이백 고객에게는 3종 모두 <strong>무료</strong>입니다.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              {sent ? (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">✅ 구독 문의가 접수되었습니다. 담당자가 곧 연락드립니다.</div>
              ) : (
                <>
                  <p className="text-sm font-bold text-secondary">구독 문의</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">브랜드명과 연락처만 남겨주시면 세팅 안내를 드립니다.</p>
                  <div className="mt-3 space-y-2">
                    <Input placeholder="브랜드명 *" value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={100} />
                    <Input placeholder="연락처 * (010-0000-0000)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} />
                  </div>
                  {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}
                  <Button className="mt-3 w-full" disabled={!valid || busy} onClick={submit}>
                    {busy ? "접수 중…" : "구독 문의하기"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 솔루션별: 제목 → 영상 + 가격표 → 상세 소개 ── */}
      {SOLUTION_CATALOG.map((c) => (
        <SolutionSection key={c.key} info={c} billing={billing} pv={pv} on={isOn(c.key)} />
      ))}
    </>
  );
}

function SolutionSection({ info: c, billing, pv, on }: { info: SolutionInfo; billing: Billing; pv: number; on: boolean }) {
  const unit = billing === "yearly" ? "연" : "월";
  const price = c.key === "log" ? catchlogMonthly(pv) * (billing === "yearly" ? 12 : 1) : FIXED_PRICES[c.key][billing];

  return (
    <section id={c.key} className="mx-auto max-w-6xl scroll-mt-16 px-6 pt-20 md:pt-24">
      <div className="text-center">
        <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
          {c.no} · {c.brand}
        </span>
        <h2 className="mt-3 break-keep text-3xl font-extrabold text-secondary md:text-4xl">{c.name}</h2>
        <p className="mx-auto mt-3 max-w-2xl break-keep text-muted-foreground">{c.tagline}</p>
      </div>

      <div className="mt-8 grid items-start gap-6 md:grid-cols-2">
        {/* 소개 영상 */}
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0B1530] shadow-xl md:sticky md:top-20">
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-2 text-[11px] font-medium text-white/50">{c.videoTitle}</span>
          </div>
          <YouTubeEmbed videoId={c.videoId} videoTitle={c.videoTitle} trackingKey={`sub_${c.key}`} label={`${c.brand} 소개 영상 보기`} />
        </div>

        {/* 가격표 */}
        <div className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold text-secondary">{c.brand} 요금제</p>
              <p className="text-xs text-muted-foreground">{c.key === "log" ? "사이트 1개 기준 · 전 기능 포함" : "계정 1개 기준 · 전 기능 포함"}</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">VAT 별도</span>
          </div>

          {c.key === "log" ? (
            <>
              <table className="mt-4 w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 font-medium">월 페이지뷰</th>
                    <th className="py-2 text-right font-medium">월 요금</th>
                  </tr>
                </thead>
                <tbody>
                  {CATCHLOG_TIERS.map((t) => (
                    <tr key={t.pv} className={"border-b " + (pv === t.pv ? "bg-sky-50/60" : "")}>
                      <td className="py-2.5">{manPv(t.pv)}</td>
                      <td className="py-2.5 text-right text-base font-extrabold text-secondary">{won(t.monthly)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {manPv(CATCHLOG_TIERS[CATCHLOG_TIERS.length - 1].pv)} 초과 시 10만 PV당 {won(CATCHLOG_EXTRA_PER_100K)} 추가. 연간 결제 선택 시 월 요금 × 12로 계산됩니다.
              </p>
            </>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 font-medium">결제 주기</th>
                  <th className="py-2 text-right font-medium">요금</th>
                </tr>
              </thead>
              <tbody>
                <tr className={"border-b " + (billing === "monthly" ? "bg-sky-50/60" : "")}>
                  <td className="py-2.5">월간</td>
                  <td className="py-2.5 text-right text-base font-extrabold text-secondary">{won(FIXED_PRICES[c.key].monthly)} / 월</td>
                </tr>
                <tr className={"border-b " + (billing === "yearly" ? "bg-sky-50/60" : "")}>
                  <td className="py-2.5">
                    연간 <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">2개월 무료</span>
                  </td>
                  <td className="py-2.5 text-right text-base font-extrabold text-secondary">{won(FIXED_PRICES[c.key].yearly)} / 연</td>
                </tr>
              </tbody>
            </table>
          )}

          <div className="mt-4">
            <p className="text-sm font-bold text-secondary">포함 기능</p>
            <ul className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
              {c.included.map((f) => (
                <li key={f} className="flex gap-2 text-foreground/85">
                  <span className="text-emerald-600">✓</span>
                  <span className="break-keep">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-xs">
              {on ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">✓ 예상 구독료에 포함됨</span>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">예상 구독료에 미포함</span>
              )}
              <a href="#quote" className="ml-2 font-semibold text-primary underline-offset-2 hover:underline">
                상단에서 선택 ↑
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              선택 기준 <strong className="text-lg font-extrabold text-secondary">{won(price)}</strong> / {unit}
            </p>
          </div>
        </div>
      </div>

      {/* 상세 소개 (구 팝업 문서 원문) */}
      <div className="mt-6 overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-b bg-card px-5 py-3 text-sm font-bold text-secondary">{c.name} 상세 소개</div>
        <InlineHtmlDoc html={SOLUTION_DETAILS[c.key] ?? ""} title={`${c.name} 상세 소개`} />
      </div>
    </section>
  );
}
