// 페이백 요율 계산 — 단일 모듈 (스펙 §3 SSOT)
// 공개 계산기와 정산 엔진이 반드시 이 함수만 사용한다. 로직 중복 작성 금지.
// 하드 룰: 금액은 정수(원), floor 절사, 부동소수점 연산 금지 (D17).

export type RateTier = { min: number; max: number | null; rate: number }; // 원, %
export type RateTable = {
  version: string; // "v1.0"
  tiers: RateTier[]; // D1
  modifiers: { allSolutions: number; consulting: number }; // {1, 2} (%p 차감)
  consultingMinSpend: number; // 7_000_000
};

export type PaybackInput = {
  adSpend: number; // 당월 실집행 광고비 (VAT 제외, 원)
  allSolutions: boolean; // 해당 월 옵션 활성 여부
  consulting: boolean; // 해당 월 옵션 활성 여부 (유예월 포함 — §3)
  invoiceCapable: boolean; // 세금계산서 발행 가능 사업자 여부
};

export type PaybackResult = {
  tierLabel: string; // "700만~2,000만 원"
  baseRate: number; // 9
  modifierTotal: number; // 3
  appliedRate: number; // 6
  supplyValue: number; // floor(adSpend * appliedRate / 100)
  vat: number; // invoiceCapable ? floor(supplyValue * 0.1) : 0
  totalPayout: number; // supplyValue + vat
};

// 만원 단위 라벨 (예: 7,000,000 → "700만")
function manLabel(won: number): string {
  const man = Math.floor(won / 10_000);
  return `${man.toLocaleString("ko-KR")}만`;
}

export function tierLabelOf(tier: RateTier): string {
  if (tier.max === null) return `${manLabel(tier.min)} 원 이상`;
  if (tier.min === 0) return `${manLabel(tier.max)} 원 미만`;
  return `${manLabel(tier.min)}~${manLabel(tier.max)} 원`;
}

// 구간 판정: min ≤ adSpend < max (max=null이면 상한 없음)
export function findTier(table: RateTable, adSpend: number): RateTier {
  const tier = table.tiers.find(
    (t) => adSpend >= t.min && (t.max === null || adSpend < t.max),
  );
  if (!tier) {
    throw new Error(`요율 구간을 찾을 수 없습니다: adSpend=${adSpend}`);
  }
  return tier;
}

// 정수 원 × 요율(%) → floor 절사. 요율은 소수 1자리까지 허용(numeric(4,1)).
// 부동소수점을 피하기 위해 요율을 ×10 정수로 변환해 계산한다.
function applyRate(amountWon: number, ratePercent: number): number {
  const rate10 = Math.round(ratePercent * 10); // 6.5% → 65
  return Math.floor((amountWon * rate10) / 1000);
}

export function calcPayback(table: RateTable, input: PaybackInput): PaybackResult {
  if (!Number.isInteger(input.adSpend) || input.adSpend < 0) {
    throw new Error("광고비는 0 이상의 정수(원)여야 합니다.");
  }

  const tier = findTier(table, input.adSpend);
  const baseRate = tier.rate;

  // 컨설팅 −2%p는 해당 월 옵션이 활성이면 광고비와 무관하게 적용 (§3 — 유예월 포함).
  // 700만 조건은 옵션의 선택/유지 단계(D3)에서만 검증한다.
  const modifierTotal =
    (input.allSolutions ? table.modifiers.allSolutions : 0) +
    (input.consulting ? table.modifiers.consulting : 0);

  const appliedRate = Math.max(0, baseRate - modifierTotal);
  const supplyValue = applyRate(input.adSpend, appliedRate);
  const vat = input.invoiceCapable ? Math.floor(supplyValue / 10) : 0;

  return {
    tierLabel: tierLabelOf(tier),
    baseRate,
    modifierTotal,
    appliedRate,
    supplyValue,
    vat,
    totalPayout: supplyValue + vat,
  };
}

// DB 행(pb_rate_tables) → RateTable 변환
export function rateTableFromRow(row: {
  version: string;
  tiers: unknown;
  modifiers: unknown;
  consulting_min_spend: number;
}): RateTable {
  return {
    version: row.version,
    tiers: row.tiers as RateTier[],
    modifiers: row.modifiers as RateTable["modifiers"],
    consultingMinSpend: row.consulting_min_spend,
  };
}

// 컨설팅 옵션 선택 가능 여부 (D3 — 선택/유지 단계 검증)
export function consultingEligible(table: RateTable, adSpend: number): boolean {
  return adSpend >= table.consultingMinSpend;
}
