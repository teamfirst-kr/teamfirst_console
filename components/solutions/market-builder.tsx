"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitQuickLead } from "@/app/(public)/apply/lead-actions";
import { trackConversion } from "@/components/analytics/track";
import {
  APP_CATEGORIES,
  appLabel,
  appsLabel,
  categoryLabel,
  choiceComparison,
  encodeMarketSource,
  fitsPlan,
  freeMonths,
  getPlan,
  planPrice,
  planUsers,
  recommendPlan,
  seatsLabel,
  type AppCategory,
  type Billing,
  type MarketApp,
  type MarketConfig,
  type MarketPlan,
  type PlanKey,
} from "@/lib/solution-market";

import { AppDetailSection, hasAppDetail, type AppPickState } from "./app-detail";

// 솔루션 마켓 본문 (공개 /solutions).
//  ① 플랜 — 월간/연간 토글 + 플랜 카드
//  ② 앱 고르기 — 카테고리 탭 + 앱 카드(담기) | 내 구성(플랜·앱·인원·금액 + 구독 문의)
//     플랜 한도를 넘겨 담으면 담을 수 있는 가장 저렴한 플랜으로 자동 변경, 작은 플랜을 고르면 선택을 줄인다
//  ③ 앱 상세 섹션 (#앱키 — 페이백 랜딩 링크 대상)
//  ④ 내 구성 박스를 지나 내려가면 하단 고정 요약 바 (상세 섹션 끝 이후에는 숨김)
// 요금 계산은 lib/solution-market.ts만 사용한다.

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export function MarketBuilder({ config, apps }: { config: MarketConfig; apps: MarketApp[] }) {
  const listed = useMemo(() => apps.filter((a) => a.status !== "hidden"), [apps]);
  const available = useMemo(() => listed.filter((a) => a.status === "available"), [listed]);

  const [billing, setBilling] = useState<Billing>("monthly");
  const [planKey, setPlanKey] = useState<PlanKey>(config.featured);
  const [selected, setSelected] = useState<string[]>(() => {
    const p = getPlan(config, config.featured);
    return available.slice(0, p.apps ?? available.length).map((a) => a.key);
  });
  const [cat, setCat] = useState<AppCategory | "all">("all");
  const [notice, setNotice] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cartAbove, setCartAbove] = useState(false);
  const [pastEnd, setPastEnd] = useState(false);
  const cartRef = useRef<HTMLElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // 내 구성 박스를 지나 내려가면(박스가 화면 위로 사라지면) 하단 요약 바 노출 — 플랜·앱을 고르는 동안에는 숨김.
  // 상세 섹션 끝(크로스셀·푸터)을 지나면 다시 숨겨 푸터를 가리지 않는다.
  useEffect(() => {
    const cart = cartRef.current;
    const end = endRef.current;
    if (!cart || !end || typeof IntersectionObserver === "undefined") return;
    const co = new IntersectionObserver(([e]) => setCartAbove(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    const eo = new IntersectionObserver(([e]) => setPastEnd(e.isIntersecting || e.boundingClientRect.top < 0), { threshold: 0 });
    co.observe(cart);
    eo.observe(end);
    return () => {
      co.disconnect();
      eo.disconnect();
    };
  }, []);

  const plan = getPlan(config, planKey);
  const unlimited = plan.apps === null;
  const price = planPrice(plan, billing, config);
  const unit = billing === "yearly" ? "연" : "월";
  const free = freeMonths(config);
  const cheapest = [...config.plans].sort((a, b) => a.monthly - b.monthly)[0];
  const fromText = `${cheapest.name} 월 ${won(cheapest.monthly)}부터`;
  const order = (keys: string[]) => available.filter((a) => keys.includes(a.key)).map((a) => a.key);
  const pickedApps = unlimited ? available : available.filter((a) => selected.includes(a.key));
  const cheaperFit = !unlimited && selected.length > 0 ? recommendPlan(selected.length, config) : null;
  const showCheaper = !!cheaperFit && cheaperFit.key !== plan.key && cheaperFit.monthly < plan.monthly;

  function choosePlan(key: PlanKey) {
    const p = getPlan(config, key);
    setPlanKey(key);
    setNotice(null);
    if (p.apps !== null && selected.length > p.apps) {
      setSelected(selected.slice(0, p.apps));
      setNotice(`${p.name} 플랜은 앱 ${p.apps}개까지라 선택을 ${p.apps}개로 줄였어요.`);
    }
  }

  function toggleApp(key: string) {
    setNotice(null);
    if (selected.includes(key)) {
      setSelected(selected.filter((k) => k !== key));
      return;
    }
    const next = order([...selected, key]);
    if (!fitsPlan(plan, next.length)) {
      const up = recommendPlan(next.length, config);
      setPlanKey(up.key);
      setNotice(`앱 ${next.length}개는 ${up.name} 플랜부터 담을 수 있어 ${up.name} 플랜으로 바꿨어요.`);
    }
    setSelected(next);
  }

  const pickOf = (a: MarketApp): AppPickState => ({
    on: selected.includes(a.key),
    included: unlimited && a.status === "available",
    available: a.status === "available",
    onToggle: () => toggleApp(a.key),
    fromText,
  });

  const valid = (unlimited || selected.length > 0) && brand.trim().length > 0 && phone.replace(/\D/g, "").length >= 9;

  async function submit() {
    if (busy || !valid || sent) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await submitQuickLead({
        brand,
        phone,
        budget: price,
        source: encodeMarketSource(plan.key, billing, unlimited ? "all" : order(selected)),
        label: "🧩 솔루션 마켓 구독 문의",
        budgetLabel: `플랜 구독료 / ${unit} (VAT 별도)`,
        extraRows: [
          ["플랜", `${plan.name} · ${billing === "yearly" ? "연간" : "월간"} · ${seatsLabel(plan)}`],
          ["선택 앱", unlimited ? "전체 앱 (무제한)" : pickedApps.map(appLabel).join(", ")],
        ],
        adminLink: "/admin/solutions#leads",
      });
      if (!res.ok) {
        setErr("접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      setSent(true);
      trackConversion("Purchase", { content_name: `market_${plan.key}`, value: price, currency: "KRW" }, "purchase");
    } catch {
      setErr("접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  const countOf = (key: AppCategory) => listed.filter((a) => a.category === key).length;
  const shown = cat === "all" ? listed : listed.filter((a) => a.category === cat);
  const details = listed.filter(hasAppDetail);
  const tabs: { key: AppCategory | "all"; label: string; n: number }[] = [
    { key: "all", label: "전체", n: listed.length },
    // 앱이 있는 카테고리만 탭으로 — 2개 이상일 때만 탭 노출 (출시 순서 미정 카테고리를 미리 드러내지 않음)
    ...APP_CATEGORIES.map((c) => ({ key: c.key, label: c.label, n: countOf(c.key) })).filter((t) => t.n > 0),
  ];
  const showTabs = tabs.length > 2;

  return (
    <>
      {/* ── ① 플랜 ── */}
      <section id="plans" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-14 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">PLANS</p>
            <h2 className="mt-2 break-keep text-2xl font-extrabold text-secondary md:text-[28px]">플랜을 고르세요</h2>
            <p className="mt-1 break-keep text-sm text-muted-foreground">쓸 앱 개수와 함께 쓸 인원에 맞춰 고르면 됩니다. 앱은 아래에서 담아요.</p>
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
                {b === "monthly" ? "월간 결제" : `연간 결제${free > 0 ? ` · ${free}개월 무료` : ""}`}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-3">
          {config.plans.map((p) => (
            <PlanCard
              key={p.key}
              plan={p}
              price={planPrice(p, billing, config)}
              billing={billing}
              free={free}
              featured={p.key === config.featured}
              compare={choiceComparison(p, config, available.length)}
              yearlyMonths={config.yearlyMonths}
              active={p.key === planKey}
              availableCount={available.length}
              onChoose={() => choosePlan(p.key)}
            />
          ))}
        </div>
      </section>

      {/* ── ② 앱 고르기 + 내 구성 ── */}
      <section id="apps" className="scroll-mt-16 border-t bg-muted/30 py-14">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">APPS</p>
          <h2 className="mt-2 break-keep text-2xl font-extrabold text-secondary md:text-[28px]">쓸 앱을 담으세요</h2>
          <p className="mt-1 break-keep text-sm text-muted-foreground">
            {plan.name} 플랜 · {appsLabel(plan)} — 구독 주기마다 다른 앱으로 바꿀 수 있습니다.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div>
              {showTabs ? (
              <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="카테고리">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={cat === t.key}
                    onClick={() => setCat(t.key)}
                    className={
                      "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors " +
                      (cat === t.key ? "border-secondary bg-secondary text-white" : "border-border bg-background text-muted-foreground hover:text-foreground")
                    }
                  >
                    {t.label}
                    <span className="ml-1.5 text-xs font-medium opacity-70">{t.n}</span>
                  </button>
                ))}
              </div>
              ) : null}

              {notice ? (
                <p className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800" role="status">
                  {notice}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                {shown.map((a) => (
                  <AppCard key={a.key} app={a} pick={pickOf(a)} hasDetail={hasAppDetail(a)} />
                ))}
                {cat === "all" ? (
                  <ComingCard
                    title="새로운 솔루션도 순차 오픈합니다"
                    body="팀퍼스트가 사내에서 쓰던 도구를 마켓용으로 다듬고 있어요. 출시되면 구독 중인 플랜에서 바로 선택할 수 있습니다."
                  />
                ) : null}
              </div>
            </div>

            {/* 내 구성 */}
            <aside id="cart" ref={cartRef} className="scroll-mt-20 rounded-2xl border bg-card p-5 shadow-sm lg:sticky lg:top-20">
              <div className="flex items-center justify-between">
                <p className="text-lg font-extrabold text-secondary">내 구성</p>
                <a href="#plans" className="text-xs font-semibold text-primary hover:underline">
                  플랜 바꾸기
                </a>
              </div>
              <div className="mt-3 rounded-xl bg-secondary px-4 py-3 text-white">
                <p className="text-[11px] font-medium text-white/70">{billing === "yearly" ? "연간 결제" : "월간 결제"}</p>
                <p className="text-lg font-extrabold">
                  {plan.name}
                  {plan.tagline ? <span className="ml-1.5 text-sm font-medium text-white/70">· {plan.tagline}</span> : null}
                </p>
              </div>

              <dl className="mt-4 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">앱</dt>
                  <dd className="font-semibold text-secondary">{unlimited ? "무제한" : `${selected.length} / ${plan.apps}개`}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">인원</dt>
                  <dd className="font-semibold text-secondary">
                    {seatsLabel(plan)}
                    {plan.seats > 0 ? <span className="font-normal text-muted-foreground"> (총 {planUsers(plan)}명)</span> : null}
                  </dd>
                </div>
              </dl>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {unlimited ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    모든 앱 이용 · 현재 {available.length}개 + 신규 앱 자동 포함
                  </span>
                ) : pickedApps.length === 0 ? (
                  <span className="text-xs text-muted-foreground">왼쪽에서 앱을 1개 이상 담아주세요.</span>
                ) : (
                  pickedApps.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => toggleApp(a.key)}
                      className="rounded-full border border-secondary/20 bg-secondary/5 px-2.5 py-1 text-xs font-semibold text-secondary hover:bg-secondary/10"
                      aria-label={`${appLabel(a)} 빼기`}
                    >
                      {appLabel(a)} ×
                    </button>
                  ))
                )}
              </div>

              {showCheaper && cheaperFit ? (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  앱 {selected.length}개만 쓰신다면{" "}
                  <button type="button" className="font-bold underline underline-offset-2" onClick={() => choosePlan(cheaperFit.key)}>
                    {cheaperFit.name}(월 {won(cheaperFit.monthly)})
                  </button>
                  로도 충분해요. 직원 초대가 더 필요하면 지금 플랜을 유지하세요.
                </p>
              ) : null}

              <div className="mt-4 border-t pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-secondary">합계 / {unit} (VAT 별도)</span>
                  <span className="text-2xl font-extrabold text-secondary">{won(price)}</span>
                </div>
                {billing === "yearly" ? (
                  <p className="text-right text-xs text-emerald-700">
                    월 {won(Math.round(price / 12))}꼴{free > 0 ? ` · ${free}개월 무료` : ""}
                  </p>
                ) : null}
                <p className="text-right text-xs text-muted-foreground">VAT 포함 {won(price + Math.floor(price / 10))}</p>
              </div>

              <div className="mt-4 rounded-xl border bg-muted/30 p-3.5">
                {sent ? (
                  <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">✅ 구독 문의가 접수되었습니다. 담당자가 곧 연락드립니다.</div>
                ) : (
                  <>
                    <p className="text-sm font-bold text-secondary">구독 문의</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">브랜드명과 연락처를 남겨주시면 계정 세팅을 안내드립니다.</p>
                    <div className="mt-3 space-y-2">
                      <Input placeholder="브랜드명 *" value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={100} />
                      <Input placeholder="연락처 * (010-0000-0000)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} />
                    </div>
                    {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}
                    <Button className="mt-3 w-full" disabled={!valid || busy} onClick={submit}>
                      {busy ? "접수 중…" : "이 구성으로 구독 문의"}
                    </Button>
                  </>
                )}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                구독 주기마다 사용할 앱을 다시 고를 수 있습니다. 변경은 다음 결제일부터 적용됩니다.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* ── ③ 앱 상세 ── */}
      {details.map((a, idx) => (
        <AppDetailSection key={a.key} app={a} pick={pickOf(a)} alt={idx % 2 === 1} />
      ))}
      {/* 상세 끝 센티널 — 여기를 지나면(크로스셀·푸터) 요약 바 숨김 */}
      <div ref={endRef} aria-hidden className="h-px" />

      {/* ── ④ 하단 고정 요약 바 ── */}
      {cartAbove && !pastEnd ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-sm leading-tight">
              <span className="font-semibold text-secondary">{plan.name}</span>
              <span className="text-muted-foreground">· 앱 {unlimited ? "무제한" : `${selected.length}/${plan.apps}`}</span>
              <strong className="text-base font-extrabold text-secondary">{won(price)}</strong>
              <span className="text-xs text-muted-foreground">
                / {unit}
                <span className="hidden sm:inline"> · VAT 별도</span>
              </span>
            </p>
            <Button asChild size="sm" className="shrink-0">
              <a href="#cart">구독 문의 ↑</a>
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PlanCard({
  plan: p,
  price,
  billing,
  free,
  featured,
  active,
  availableCount,
  onChoose,
  compare,
  yearlyMonths,
}: {
  plan: MarketPlan;
  price: number;
  billing: Billing;
  free: number;
  featured: boolean;
  active: boolean;
  availableCount: number;
  onChoose: () => void;
  compare: ReturnType<typeof choiceComparison>;
  yearlyMonths: number;
}) {
  const listPrice = compare ? (billing === "yearly" ? compare.listMonthly * yearlyMonths : compare.listMonthly) : null;
  const coversAll = p.apps !== null && availableCount > 0 && p.apps >= availableCount;
  return (
    <div
      className={
        "relative flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-shadow " +
        (active ? "border-secondary ring-2 ring-secondary/20" : "hover:shadow-md")
      }
    >
      {featured ? (
        <span className="absolute -top-2.5 left-5 rounded-full bg-[#004AAD] px-2.5 py-0.5 text-[11px] font-bold text-white">추천</span>
      ) : null}
      <p className="text-lg font-extrabold text-secondary">{p.name}</p>
      <p className="text-xs text-muted-foreground">{p.tagline || " "}</p>
      {/* 초이스 대비 할인 — 정가(초이스로 같은 구성을 쓸 때) 취소선 */}
      <p className="mt-4 flex min-h-[22px] flex-wrap items-center gap-1.5 text-sm">
        {compare && listPrice !== null ? (
          <>
            <span className="text-muted-foreground line-through decoration-muted-foreground/70">{won(listPrice)}</span>
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-extrabold text-red-600">{compare.discountPct}% 할인</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">기준 요금</span>
        )}
      </p>
      <p>
        <span className="text-[28px] font-extrabold tracking-tight text-secondary">{won(price)}</span>
        <span className="ml-1 text-sm text-muted-foreground">/ {billing === "yearly" ? "연" : "월"}</span>
      </p>
      <p className={"text-xs " + (billing === "yearly" ? "text-emerald-700" : "text-muted-foreground")}>
        {billing === "yearly"
          ? `월 ${won(Math.round(price / 12))}꼴${free > 0 ? ` · ${free}개월 무료` : ""}`
          : free > 0
            ? `연간 결제 시 ${free}개월 무료`
            : " "}
      </p>
      {compare ? (
        <p className="mt-1 text-[11px] text-muted-foreground">
          초이스로 앱 {compare.apps}개 × {compare.users}명{p.apps === null ? "(현재 오픈 앱 기준)" : ""} 이용 시 대비
        </p>
      ) : null}
      <ul className="mt-4 space-y-1.5 text-sm">
        <li className="flex gap-2">
          <span className="font-bold text-primary">✓</span>
          <span className="font-semibold text-secondary">{appsLabel(p)}</span>
        </li>
        <li className="flex gap-2">
          <span className="font-bold text-primary">✓</span>
          <span>
            {seatsLabel(p)}
            {p.seats > 0 ? <span className="text-muted-foreground"> (총 {planUsers(p)}명)</span> : null}
          </span>
        </li>
        <li className="flex gap-2">
          <span className="font-bold text-primary">✓</span>
          <span>구독 주기마다 앱 교체</span>
        </li>
        {p.apps === null ? (
          <li className="flex gap-2 text-emerald-700">
            <span className="font-bold">✓</span>
            <span>새로 출시되는 앱 자동 포함</span>
          </li>
        ) : coversAll ? (
          <li className="flex gap-2 text-emerald-700">
            <span className="font-bold">✓</span>
            <span>현재 오픈된 앱 {availableCount}개 모두 이용 가능</span>
          </li>
        ) : null}
      </ul>
      <div className="mt-auto pt-5">
        <Button type="button" className="w-full" variant={active ? "default" : "outline"} aria-pressed={active} onClick={onChoose}>
          {active ? "✓ 선택한 플랜" : "이 플랜 선택"}
        </Button>
      </div>
    </div>
  );
}

function AppCard({ app: a, pick, hasDetail }: { app: MarketApp; pick: AppPickState; hasDetail: boolean }) {
  return (
    <div className={"flex flex-col rounded-2xl border bg-card p-5 shadow-sm " + (pick.on || pick.included ? "border-secondary/60 ring-1 ring-secondary/20" : "")}>
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-bold text-secondary">{categoryLabel(a.category)}</span>
        {!pick.available ? <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">출시 예정</span> : null}
      </div>
      <p className="mt-3 text-lg font-extrabold leading-tight text-secondary">{appLabel(a)}</p>
      {a.brand ? <p className="mt-0.5 text-xs font-medium text-muted-foreground">{a.name}</p> : null}
      <p className="mt-2 flex-1 break-keep text-sm leading-relaxed text-muted-foreground">{a.summary}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        {hasDetail ? (
          <a href={`#${a.key}`} className="text-xs font-semibold text-primary underline-offset-2 hover:underline">
            자세히 보기 →
          </a>
        ) : (
          <span />
        )}
        {!pick.available ? (
          <Button size="sm" variant="outline" disabled>
            출시 예정
          </Button>
        ) : pick.included ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">✓ 포함</span>
        ) : (
          <Button size="sm" variant={pick.on ? "default" : "outline"} aria-pressed={pick.on} onClick={pick.onToggle}>
            {pick.on ? "✓ 담김" : "+ 담기"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ComingCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-dashed bg-background/60 p-5">
      <p className="text-xs font-bold text-amber-700">COMING SOON</p>
      <p className="mt-2 break-keep font-bold text-secondary">{title}</p>
      <p className="mt-1.5 break-keep text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
