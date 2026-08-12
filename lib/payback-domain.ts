// 페이백 도메인 유틸 — 기간(Asia/Seoul 고정, D18)·영업일·옵션 유효월 판정
// period는 항상 광고비 발생월 'YYYY-MM' (하드 룰 9)

export type Period = string; // 'YYYY-MM'

export function isValidPeriod(p: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(p);
}

// KST 기준 오늘 날짜 문자열 (YYYY-MM-DD)
export function todayKst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

export function currentPeriodKst(): Period {
  return todayKst().slice(0, 7);
}

export function prevPeriod(p: Period): Period {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function nextPeriod(p: Period): Period {
  const [y, m] = p.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// 정산월 말일 (세금계산서 작성일자 — D7)
export function periodLastDay(p: Period): string {
  const [y, m] = p.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${p}-${String(last).padStart(2, "0")}`;
}

// 계산서 발행 기한 = 익월 dueDay일 (기본 10, D7)
export function invoiceDueOf(p: Period, dueDay = 10): string {
  const np = nextPeriod(p);
  return `${np}-${String(dueDay).padStart(2, "0")}`;
}

// 익월 1일 (옵션 적용 시점 — D4)
export function nextMonthFirst(fromDateKst: string): string {
  return `${nextPeriod(fromDateKst.slice(0, 7))}-01`;
}

// ── 영업일 (한국 공휴일 — D18) ──────────────────────────────────────
// 고정 테이블: 필요 시 연도 추가. 대체공휴일 포함.
const KR_HOLIDAYS = new Set<string>([
  // 2026
  "2026-01-01",
  "2026-02-16", "2026-02-17", "2026-02-18", // 설
  "2026-03-01", "2026-03-02", // 삼일절 + 대체
  "2026-05-05",
  "2026-05-24", "2026-05-25", // 석가탄신일 + 대체
  "2026-06-06",
  "2026-08-15", "2026-08-17", // 광복절(토) + 대체
  "2026-09-24", "2026-09-25", "2026-09-26", // 추석
  "2026-10-03", "2026-10-05", // 개천절(토) + 대체
  "2026-10-09",
  "2026-12-25",
  // 2027
  "2027-01-01",
  "2027-02-06", "2027-02-07", "2027-02-08", "2027-02-09", // 설 + 대체
  "2027-03-01",
  "2027-05-05",
  "2027-05-13", // 석가탄신일
  "2027-06-06", "2027-06-07", // 현충일(일) + 대체
  "2027-08-15", "2027-08-16", // 광복절(일) + 대체
  "2027-09-14", "2027-09-15", "2027-09-16", // 추석
  "2027-10-03", "2027-10-04", // 개천절(일) + 대체
  "2027-10-09", "2027-10-11", // 한글날(토) + 대체
  "2027-12-25",
]);

export function isBusinessDay(dateStr: string): boolean {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  return !KR_HOLIDAYS.has(dateStr);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// n영업일 더하기 (이의신청 창 D12: 확정일 + 3영업일)
export function addBusinessDays(dateStr: string, n: number): string {
  let cur = dateStr;
  let remaining = n;
  while (remaining > 0) {
    cur = addDays(cur, 1);
    if (isBusinessDay(cur)) remaining -= 1;
  }
  return cur;
}

// 휴일이면 익영업일 (지급일 §12)
export function nextBusinessDayOnOrAfter(dateStr: string): string {
  let cur = dateStr;
  while (!isBusinessDay(cur)) cur = addDays(cur, 1);
  return cur;
}

// ── 옵션 유효월 판정 (D4 — option_changes.effective_from 기준) ──────
export type OptionChange = {
  field: "all_solutions" | "consulting";
  new_value: boolean;
  effective_from: string; // YYYY-MM-DD
};

// 약정 체결 시 옵션값에서 출발해, 해당 정산월(period) 1일까지 유효해진 변경을 순서대로 적용
export function effectiveOptionsForPeriod(
  base: { all_solutions: boolean; consulting: boolean },
  changes: OptionChange[],
  period: Period,
): { all_solutions: boolean; consulting: boolean } {
  const cutoff = `${period}-01`;
  const applicable = changes
    .filter((c) => c.effective_from <= cutoff)
    .sort((a, b) => a.effective_from.localeCompare(b.effective_from));
  const result = { ...base };
  for (const c of applicable) result[c.field] = c.new_value;
  return result;
}

// 컨설팅 자동 해제 감지 (D3): 직전 2개 확정 정산의 광고비가 연속 미달인지
export function consultingShouldTerminate(
  recentSpends: number[], // 최신순 [직전월, 그 전월]
  minSpend: number,
): boolean {
  return (
    recentSpends.length >= 2 &&
    recentSpends[0] < minSpend &&
    recentSpends[1] < minSpend
  );
}

// 정산서 번호: TF-PB-YYYYMM-#### (확정 시 채번, §4.2)
export function statementNo(period: Period, seq: number): string {
  return `TF-PB-${period.replace("-", "")}-${String(seq).padStart(4, "0")}`;
}
