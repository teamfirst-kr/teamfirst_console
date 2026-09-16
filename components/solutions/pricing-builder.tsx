"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { YouTubeEmbed } from "@/components/payback/youtube-embed";
import { submitQuickLead } from "@/app/(public)/apply/lead-actions";
import { trackConversion } from "@/components/analytics/track";
import {
  BUNDLE_DISCOUNT,
  CATCHLOG_EXTRA_PER_100K,
  CATCHLOG_MAX_PV,
  CATCHLOG_TIERS,
  FIXED_PRICES,
  SOLUTION_KEYS,
  catchlogMonthly,
  encodeSubscriptionSource,
  quote,
  type Billing,
  type SolutionKey,
} from "@/lib/solution-pricing";
import { SOLUTION_CATALOG, type SolutionInfo } from "./solution-catalog";

// 솔루션 구독 페이지 본문.
//  ① 예상 구독료 박스 — 결제 주기(월간/연간)·솔루션 선택 칩·CatchLog PV·견적·구독 문의 (선택은 여기서만)
//  ② 섹션 점프 내비 (CatchLog / AUTO REPORT / AUTO BID)
//  ③ 솔루션별 섹션 — 제목(중앙) → 소개 영상(상단 고정) + 요금제(영상 높이에 맞춤) → 상세 소개(네이티브, 라이트)
//  ④ 박스가 화면 밖으로 나가면 하단 고정 요약 바(합계 + 구독 문의로 이동) — 페이지 끝(크로스셀·푸터)에서는 숨김
// 요금 계산은 lib/solution-pricing.ts 단일 모듈만 사용한다.

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const manPv = (pv: number) => `월 ${Math.round(pv / 10_000)}만 PV`;
const ALL_KEYS = SOLUTION_KEYS;
const PV_OPTIONS = Array.from({ length: CATCHLOG_MAX_PV / 100_000 }, (_, i) => (i + 1) * 100_000);

// **강조** 마크업 렌더러 — 본문(muted)에서는 진한 세미볼드, 헤드라인(이미 extrabold navy)에서는 브랜드 블루로 구분
function Rich({ text, strongClass = "font-semibold text-secondary" }: { text: string; strongClass?: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className={strongClass}>
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function PricingBuilder() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [pv, setPv] = useState<number>(CATCHLOG_TIERS[0].pv);
  const [selected, setSelected] = useState<SolutionKey[]>(ALL_KEYS);
  const [brand, setBrand] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [quoteVisible, setQuoteVisible] = useState(true);
  const [pastEnd, setPastEnd] = useState(false);
  const quoteRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // 예상 구독료 박스가 화면 밖으로 나가면 하단 요약 바 노출.
  // 단, 솔루션 섹션 끝(하단 크로스셀·푸터 영역)에 도달하면 숨겨 푸터 마지막 줄을 가리지 않는다.
  useEffect(() => {
    const q = quoteRef.current;
    const end = endRef.current;
    if (!q || !end || typeof IntersectionObserver === "undefined") return;
    const qo = new IntersectionObserver(([e]) => setQuoteVisible(e.isIntersecting), { threshold: 0 });
    const eo = new IntersectionObserver(([e]) => setPastEnd(e.isIntersecting || e.boundingClientRect.top < 0), { threshold: 0 });
    qo.observe(q);
    eo.observe(end);
    return () => {
      qo.disconnect();
      eo.disconnect();
    };
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
      const source = encodeSubscriptionSource(keys, billing, pv);
      const res = await submitQuickLead({
        brand,
        phone,
        budget: q.total,
        source,
        label: "🧩 솔루션 구독 문의",
        budgetLabel: `예상 구독료 / ${unit} (VAT 별도)`,
      });
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
      {/* ── ① 예상 구독료 박스 ── */}
      <section id="quote" ref={quoteRef} className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-10 pt-12 md:pb-12">
        <div className="rounded-2xl border bg-card p-5 shadow-sm md:p-7">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-extrabold text-secondary">예상 구독료</p>
                  <p className="text-xs text-muted-foreground">구독할 솔루션과 결제 주기를 고르면 바로 계산됩니다.</p>
                </div>
                <div className="inline-flex rounded-lg border bg-background p-1 text-sm font-medium" role="group" aria-label="결제 주기">
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

        {/* ② 섹션 점프 내비 */}
        <nav aria-label="솔루션 바로가기" className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-xs text-muted-foreground">자세히 보기:</span>
          {SOLUTION_CATALOG.map((c) => (
            <a
              key={c.key}
              href={`#${c.key}`}
              className="rounded-full border bg-card px-3.5 py-1.5 font-semibold text-secondary transition-colors hover:border-secondary/40 hover:bg-secondary/5"
            >
              {c.brand} <span className="font-normal text-muted-foreground">· {c.name}</span>
            </a>
          ))}
        </nav>
      </section>

      {/* ── ③ 솔루션별 섹션 ── */}
      {SOLUTION_CATALOG.map((c, idx) => (
        <SolutionSection key={c.key} info={c} billing={billing} pv={pv} on={isOn(c.key)} alt={idx % 2 === 1} />
      ))}
      {/* 섹션 끝 센티널 — 여기를 지나면(크로스셀·푸터) 요약 바 숨김 */}
      <div ref={endRef} aria-hidden className="h-px" />

      {/* ── ④ 하단 고정 요약 바 ── */}
      {!quoteVisible && !pastEnd && q.items.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-sm leading-tight">
              <span className="font-semibold text-secondary">{q.items.length}종 선택</span>
              <span className="text-muted-foreground">· {billing === "yearly" ? "연간" : "월간"}</span>
              <strong className="text-base font-extrabold text-secondary">{won(q.total)}</strong>
              <span className="text-xs text-muted-foreground">
                / {unit}
                <span className="hidden sm:inline"> · VAT 별도</span>
              </span>
              {q.discountRate > 0 ? <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-bold text-emerald-700">{q.discountRate}% 할인</span> : null}
            </p>
            <Button asChild size="sm" className="shrink-0">
              <a href="#quote">구독 문의 ↑</a>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SolutionSection({ info: c, billing, pv, on, alt }: { info: SolutionInfo; billing: Billing; pv: number; on: boolean; alt: boolean }) {
  const unit = billing === "yearly" ? "연" : "월";
  const price = c.key === "log" ? catchlogMonthly(pv) * (billing === "yearly" ? 12 : 1) : FIXED_PRICES[c.key][billing];

  return (
    <section id={c.key} className={"scroll-mt-16 border-t py-16 md:py-20 " + (alt ? "bg-muted/40" : "bg-background")}>
      <div className="mx-auto max-w-6xl px-6">
        {/* 제목 */}
        <div className="text-center">
          <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
            {c.no} · {c.brand}
          </span>
          <h2 className="mt-3 break-keep text-3xl font-extrabold text-secondary md:text-4xl">{c.name}</h2>
          <p className="mx-auto mt-3 max-w-2xl break-keep text-muted-foreground">{c.tagline}</p>
        </div>

        {/* 영상(상단 고정) + 요금제(영상 높이에 맞춤) */}
        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:items-stretch">
          <div className="self-start overflow-hidden rounded-2xl border border-white/15 bg-[#0B1530] shadow-xl">
            <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-2 truncate text-[11px] font-medium text-white/50">{c.videoTitle}</span>
            </div>
            <YouTubeEmbed videoId={c.videoId} videoTitle={c.videoTitle} trackingKey={`sub_${c.key}`} label={`${c.brand} 소개 영상 보기`} />
          </div>

          <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-base font-extrabold text-secondary">{c.brand} 요금제</p>
                <p className="text-xs text-muted-foreground">{c.key === "log" ? "사이트 1개 기준 · 전 기능 포함" : "계정 1개 기준 · 전 기능 포함"}</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">VAT 별도</span>
            </div>

            {c.key === "log" ? (
              <>
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] text-muted-foreground">
                      <th className="py-1.5 font-medium">월 페이지뷰</th>
                      <th className="py-1.5 text-right font-medium">월 요금</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CATCHLOG_TIERS.map((t) => (
                      <tr key={t.pv} className={"border-b " + (pv === t.pv ? "bg-sky-50/70" : "")}>
                        <td className="py-2">{manPv(t.pv)}</td>
                        <td className="py-2 text-right font-extrabold text-secondary">{won(t.monthly)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  {manPv(CATCHLOG_TIERS[CATCHLOG_TIERS.length - 1].pv)} 초과 시 10만 PV당 {won(CATCHLOG_EXTRA_PER_100K)} 추가 · 연간 결제 시 월 요금 × 12
                </p>
              </>
            ) : (
              <>
                <table className="mt-3 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] text-muted-foreground">
                      <th className="py-1.5 font-medium">결제 주기</th>
                      <th className="py-1.5 text-right font-medium">요금</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={"border-b " + (billing === "monthly" ? "bg-sky-50/70" : "")}>
                      <td className="py-2.5">월간</td>
                      <td className="py-2.5 text-right font-extrabold text-secondary">{won(FIXED_PRICES[c.key].monthly)} / 월</td>
                    </tr>
                    <tr className={"border-b " + (billing === "yearly" ? "bg-sky-50/70" : "")}>
                      <td className="py-2.5">
                        연간 <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">2개월 무료</span>
                      </td>
                      <td className="py-2.5 text-right font-extrabold text-secondary">{won(FIXED_PRICES[c.key].yearly)} / 연</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                  연간 결제 시 월 요금 12개월분에서 2개월분이 할인됩니다. 다른 솔루션과 함께 구독하면 번들 할인이 추가 적용됩니다.
                </p>
              </>
            )}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t pt-3">
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
              <p className="text-xs text-muted-foreground">
                선택 기준 <strong className="text-base font-extrabold text-secondary">{won(price)}</strong> / {unit}
              </p>
            </div>
          </div>
        </div>

        {/* 상세 소개 — 헤드라인 · 상세 기능 · 실행 로직 · 도입 효과 */}
        <div className="mt-14 md:mt-16">
          <div className="max-w-3xl">
            <h3 className="break-keep text-2xl font-extrabold leading-snug text-secondary md:text-[28px]">
              {c.headline[0]}
              <br />
              <Rich text={c.headline[1]} strongClass="font-extrabold text-[#004AAD]" />
            </h3>
            <p className="mt-4 break-keep leading-relaxed text-muted-foreground">{c.intro}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {c.chips.map((h) => (
                <span key={h} className="rounded-full border border-secondary/20 bg-secondary/5 px-2.5 py-1 text-[11px] font-semibold text-secondary">
                  {h}
                </span>
              ))}
            </div>
          </div>

          <SubHeading>상세 기능</SubHeading>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.map((f) => (
              <li key={f.title} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-lg" aria-hidden>
                    {f.icon}
                  </span>
                  <p className="break-keep font-bold text-secondary">{f.title}</p>
                </div>
                <p className="mt-3 break-keep text-sm leading-relaxed text-muted-foreground">
                  <Rich text={f.body} />
                </p>
              </li>
            ))}
          </ul>

          <SubHeading>실행 로직</SubHeading>
          <ol className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {c.steps.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl border bg-card p-5 shadow-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-extrabold text-white">{i + 1}</span>
                <p className="mt-3 break-keep font-bold text-secondary">{s.title}</p>
                <p className="mt-2 break-keep text-sm leading-relaxed text-muted-foreground">
                  <Rich text={s.body} />
                </p>
              </li>
            ))}
          </ol>

          <SubHeading>도입 효과</SubHeading>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {c.stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-5 text-center">
                <p className="text-2xl font-extrabold text-primary md:text-[28px]">{s.value}</p>
                <p className="mt-1.5 break-keep text-sm font-semibold text-secondary">{s.label}</p>
                {s.sub ? <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p> : null}
              </div>
            ))}
          </div>
          <p className="mt-6 break-keep text-center text-sm text-muted-foreground">{c.closing}</p>
        </div>
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-12 flex items-center gap-3">
      <p className="text-sm font-extrabold uppercase tracking-wider text-secondary">{children}</p>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
