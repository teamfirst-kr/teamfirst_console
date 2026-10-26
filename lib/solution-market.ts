import type { SolutionAppRow, SolutionAppStatus } from "@/types/database";

// 팀퍼스트 솔루션 마켓 — 플랜·앱 카탈로그 단일 모듈 (공개 마켓 페이지·어드민이 공유).
// 플랜 = 구독 주기당 선택 가능한 앱 수 + 초대 가능한 직원 수 + 월 구독료. 금액은 정수(원), VAT 별도.
// 플랜 값은 운영자가 /admin/solutions/pricing 에서 수정(pb_app_settings.solution_market)하고,
// DEFAULT_MARKET은 설정이 없거나 손상됐을 때의 기본값이다.

export type Billing = "monthly" | "yearly";

export const PLAN_KEYS = ["choice", "plus", "max"] as const; // 프로 폐지 (D-090)
export type PlanKey = (typeof PLAN_KEYS)[number];

export type MarketPlan = {
  key: PlanKey;
  name: string;
  tagline: string;
  apps: number | null; // 구독 주기당 선택 가능한 앱 수 (null = 무제한)
  seats: number; // 초대 가능한 직원 수 (계정 소유자 본인 제외)
  monthly: number; // 월 구독료
};

export type MarketConfig = {
  plans: MarketPlan[]; // 항상 PLAN_KEYS 순서
  yearlyMonths: number; // 연간 결제 = 월 구독료 × N개월
  featured: PlanKey; // "추천" 배지 플랜
};

export const DEFAULT_MARKET: MarketConfig = {
  plans: [
    { key: "choice", name: "초이스", tagline: "개인 사용", apps: 1, seats: 0, monthly: 29_000 },
    { key: "plus", name: "플러스", tagline: "소규모 팀", apps: 3, seats: 2, monthly: 49_000 },
    { key: "max", name: "맥스", tagline: "모든 앱 무제한", apps: null, seats: 10, monthly: 149_000 },
  ],
  yearlyMonths: 10,
  featured: "plus",
};

// 저장된 설정의 구조 버전. 버전이 다르면(프로 플랜이 있던 4단계 시절 저장분) 무시하고 기본값을 쓴다.
export const MARKET_CONFIG_VERSION = 2;

export const PLAN_LIMITS = { nameMax: 20, taglineMax: 40, appsMax: 99, seatsMax: 999, priceMax: 100_000_000 } as const;

export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === "string" && (PLAN_KEYS as readonly string[]).includes(v);
}

const intIn = (v: unknown, min: number, max: number): number | null =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null;

// DB(JSONB) 설정을 필드 단위로 검증해 기본값과 병합 — 손상된 필드만 기본값으로 대체.
export function parseMarketConfig(value: unknown): MarketConfig {
  const d = DEFAULT_MARKET;
  if (!value || typeof value !== "object") return d;
  const v = value as Record<string, unknown>;
  if (v.version !== MARKET_CONFIG_VERSION) return d;
  const inPlans = Array.isArray(v.plans) ? (v.plans as unknown[]) : [];

  const plans = d.plans.map((def): MarketPlan => {
    const raw = inPlans.find(
      (p): p is Record<string, unknown> => !!p && typeof p === "object" && (p as Record<string, unknown>).key === def.key,
    );
    if (!raw) return { ...def };
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    return {
      key: def.key,
      name: name && name.length <= PLAN_LIMITS.nameMax ? name : def.name,
      tagline: typeof raw.tagline === "string" ? raw.tagline.trim().slice(0, PLAN_LIMITS.taglineMax) : def.tagline,
      apps: raw.apps === null ? null : (intIn(raw.apps, 1, PLAN_LIMITS.appsMax) ?? def.apps),
      seats: intIn(raw.seats, 0, PLAN_LIMITS.seatsMax) ?? def.seats,
      monthly: intIn(raw.monthly, 1, PLAN_LIMITS.priceMax) ?? def.monthly,
    };
  });

  return {
    plans,
    yearlyMonths: intIn(v.yearlyMonths, 1, 12) ?? d.yearlyMonths,
    featured: isPlanKey(v.featured) ? v.featured : d.featured,
  };
}

export function getPlan(cfg: MarketConfig, key: PlanKey): MarketPlan {
  return cfg.plans.find((p) => p.key === key) ?? cfg.plans[0];
}

// 결제 주기당 청구액 (연간 = 월 구독료 × yearlyMonths)
export function planPrice(plan: MarketPlan, billing: Billing, cfg: MarketConfig): number {
  return billing === "yearly" ? plan.monthly * cfg.yearlyMonths : plan.monthly;
}

// 연간 결제 시 무료로 제공되는 개월 수
export function freeMonths(cfg: MarketConfig): number {
  return Math.max(0, 12 - cfg.yearlyMonths);
}

// 사용 인원 = 본인 + 초대 직원
export function planUsers(plan: MarketPlan): number {
  return plan.seats + 1;
}

export function fitsPlan(plan: MarketPlan, appCount: number): boolean {
  return plan.apps === null || appCount <= plan.apps;
}

// 초이스 대비 할인 — 초이스(1명·앱 1개)로 같은 구성(앱 N개 × 사용 인원)을 쓸 때의 금액을 정가로 본다.
// 무제한 플랜은 현재 이용 가능한 앱 수로 계산. 초이스 자신이거나 할인이 없으면 null.
export function choiceComparison(
  plan: MarketPlan,
  cfg: MarketConfig,
  availableApps: number,
): { listMonthly: number; discountPct: number; apps: number; users: number } | null {
  const choice = cfg.plans.find((p) => p.key === "choice");
  if (!choice || plan.key === "choice") return null;
  const apps = plan.apps ?? availableApps;
  if (apps <= 0) return null;
  const users = planUsers(plan);
  const unit = choice.monthly / ((choice.apps ?? 1) * planUsers(choice));
  const listMonthly = Math.round(unit * apps * users);
  const discountPct = Math.round((1 - plan.monthly / listMonthly) * 100);
  return discountPct > 0 ? { listMonthly, discountPct, apps, users } : null;
}

// 앱 N개를 담을 수 있는 가장 저렴한 플랜
export function recommendPlan(appCount: number, cfg: MarketConfig): MarketPlan {
  const fitting = cfg.plans.filter((p) => fitsPlan(p, appCount)).sort((a, b) => a.monthly - b.monthly);
  return fitting[0] ?? cfg.plans[cfg.plans.length - 1];
}

export const appsLabel = (plan: MarketPlan): string => (plan.apps === null ? "모든 앱 무제한" : `앱 ${plan.apps}개 선택`);
export const seatsLabel = (plan: MarketPlan): string =>
  plan.seats === 0 ? "본인 1인 사용" : `직원 최대 ${plan.seats}명 초대`;

// 앱당·인당 월 단가 (운영자 요금 설정 화면)
export function unitPrices(plan: MarketPlan): { perApp: number | null; perUser: number } {
  return {
    perApp: plan.apps === null ? null : Math.round(plan.monthly / plan.apps),
    perUser: Math.round(plan.monthly / planUsers(plan)),
  };
}

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 요금 구성 점검 — 운영자 요금 설정 화면에 경고로 노출한다.
//  ① 플랜 순서(초이스→맥스)와 가격 순서가 다름
//  ② 하위 플랜 여러 개를 구독하는 편이 상위 플랜보다 싸지는 가격 역전 (인원도 계정 수만큼 늘어 손해가 없음)
//  ③ 현재 오픈된 앱 수가 적어 여러 플랜의 앱 수 차이가 체감되지 않음
export function pricingWarnings(cfg: MarketConfig, availableApps: number): string[] {
  const warnings: string[] = [];
  const plans = cfg.plans;

  for (let i = 1; i < plans.length; i++) {
    if (plans[i].monthly <= plans[i - 1].monthly) {
      warnings.push(`${plans[i].name} 요금이 ${plans[i - 1].name}보다 낮거나 같습니다 — 플랜 순서와 가격 순서를 맞춰주세요.`);
    }
  }

  for (const hi of plans) {
    if (hi.apps === null) continue;
    for (const lo of plans) {
      if (lo === hi || lo.apps === null || lo.monthly >= hi.monthly || lo.apps >= hi.apps) continue;
      const copies = Math.ceil(hi.apps / lo.apps);
      if (copies >= 2 && copies * lo.monthly < hi.monthly) {
        warnings.push(
          `${lo.name} ${copies}개(${won(copies * lo.monthly)})로 앱 ${copies * lo.apps}개·${copies * planUsers(lo)}명을 쓰는 편이 ${hi.name}(${won(hi.monthly)})보다 저렴합니다.`,
        );
      }
    }
  }

  const covering = plans.filter((p) => p.apps === null || p.apps >= availableApps);
  if (availableApps > 0 && covering.length >= 2) {
    warnings.push(
      `현재 오픈된 앱이 ${availableApps}개라 ${covering.map((p) => p.name).join("·")} 플랜은 모든 앱을 쓸 수 있습니다 — 지금은 인원 수만 차이가 납니다.`,
    );
  }
  return warnings;
}

// ── 앱 카탈로그 ─────────────────────────────────────────────────────────
export const APP_CATEGORY_KEYS = ["performance", "workspace", "content"] as const;
export type AppCategory = (typeof APP_CATEGORY_KEYS)[number];
export const APP_CATEGORIES: { key: AppCategory; label: string; desc: string }[] = [
  { key: "performance", label: "퍼포먼스 마케팅", desc: "광고 성과 분석 · 리포트 · 입찰 최적화" },
  { key: "workspace", label: "사내 업무", desc: "스케줄 관리 등 팀 운영 도구" },
  { key: "content", label: "콘텐츠 제작", desc: "광고 소재 · 콘텐츠 제작 도구" },
];
export function categoryLabel(key: string): string {
  return APP_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export const APP_STATUSES = ["available", "coming_soon", "hidden"] as const satisfies readonly SolutionAppStatus[];
export const APP_STATUS_LABEL: Record<SolutionAppStatus, string> = {
  available: "이용 가능",
  coming_soon: "출시 예정",
  hidden: "숨김",
};
export const APP_KEY_RE = /^[a-z][a-z0-9-]{1,23}$/;

export type MarketApp = Omit<SolutionAppRow, "created_at" | "updated_at">;

export const appLabel = (a: Pick<MarketApp, "brand" | "name">): string => a.brand?.trim() || a.name;

// 카탈로그 테이블이 없을 때(마이그레이션 033 미적용)의 기본값 — 033·038 시드와 동일
export const DEFAULT_APPS: MarketApp[] = [
  {
    key: "log",
    name: "로그분석 솔루션",
    brand: "CatchLog",
    category: "performance",
    summary: "부정클릭 차단부터 실방문·전환 분석까지, 광고비가 새는 지점을 숫자로 진단합니다.",
    description: null,
    features: [],
    video_id: null,
    status: "available",
    sort: 10,
  },
  {
    key: "report",
    name: "자동리포트 솔루션",
    brand: "AUTO REPORT",
    category: "performance",
    summary: "네이버 검색광고 리포트를 일·주·월 단위로 자동 생성해 메일함으로 보내드립니다.",
    description: null,
    features: [],
    video_id: null,
    status: "available",
    sort: 20,
  },
  {
    key: "bid",
    name: "자동 ROAS 최적화 솔루션",
    brand: "AUTO BID",
    category: "performance",
    summary: "목표 ROAS만 정해두면 소재·키워드별 입찰가를 매주 자동으로 조정합니다.",
    description: null,
    features: [],
    video_id: null,
    status: "available",
    sort: 30,
  },
  {
    key: "meta-ads",
    name: "메타 광고 운영 솔루션",
    brand: "Meta Ads Dashboard",
    category: "performance",
    summary: "메타 광고 계정 여러 개를 한 화면에서 보고, 소재 중지·예산 증액·알람·리포트를 규칙대로 자동화합니다.",
    description: null,
    features: [],
    video_id: null,
    status: "available",
    sort: 40,
  },
];

// ── 구독 문의 리드 source ──────────────────────────────────────────────
// pb_leads.source = "sub:p=<플랜>/<M|Y>/<앱키+앱키…>"
//   "*" = 전체 앱(무제한 플랜), 마지막 "~N" = 길이 제한으로 생략된 앱 N개.
// "sub:" 접두는 레거시 개별 요금 문의(lib/solution-pricing)와 공유한다 —
// 어드민 목록·대시보드의 필터(source LIKE 'sub:%')가 그대로 동작.
export const MARKET_SOURCE_MAX = 200;
export type MarketSource = { plan: PlanKey; billing: Billing; apps: string[] | "all"; omitted: number };

export function encodeMarketSource(plan: PlanKey, billing: Billing, apps: string[] | "all"): string {
  const head = `sub:p=${plan}/${billing === "yearly" ? "Y" : "M"}/`;
  if (apps === "all") return `${head}*`;
  const keys = Array.from(new Set(apps)).filter((k) => APP_KEY_RE.test(k));
  const build = (listed: string[]) => {
    const omitted = keys.length - listed.length;
    return head + [...listed, ...(omitted > 0 ? [`~${omitted}`] : [])].join("+");
  };
  let listed = keys;
  while (listed.length > 0 && build(listed).length > MARKET_SOURCE_MAX) listed = listed.slice(0, -1);
  return build(listed);
}

export function parseMarketSource(source: string | null | undefined): MarketSource | null {
  const m = /^sub:p=([a-z]+)\/(M|Y)\/(.*)$/.exec(source ?? "");
  if (!m || !isPlanKey(m[1])) return null;
  const billing: Billing = m[2] === "Y" ? "yearly" : "monthly";
  if (m[3] === "*") return { plan: m[1], billing, apps: "all", omitted: 0 };
  let omitted = 0;
  const apps: string[] = [];
  for (const token of m[3].split("+")) {
    const o = /^~(\d+)$/.exec(token);
    if (o) omitted += Number(o[1]);
    else if (APP_KEY_RE.test(token)) apps.push(token);
  }
  return { plan: m[1], billing, apps, omitted };
}

// 관리자 표시용: "플러스 · 월간 · CatchLog, AUTO BID 외 2개"
export function describeMarketSource(src: MarketSource, cfg: MarketConfig, nameOf: (key: string) => string): string {
  const appsText =
    src.apps === "all"
      ? "전체 앱"
      : `${src.apps.map(nameOf).join(", ") || "앱 미선택"}${src.omitted > 0 ? ` 외 ${src.omitted}개` : ""}`;
  return [getPlan(cfg, src.plan).name, src.billing === "yearly" ? "연간" : "월간", appsText].join(" · ");
}
