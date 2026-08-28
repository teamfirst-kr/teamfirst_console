// 계산기 입력값을 세션 내에서 공유 (계산기 → 간편 신청 팝업 / 상세 신청 폼 프리필)
export type CalcState = { b: number; a: 0 | 1; c: 0 | 1 };

const KEY = "tf_calc";

export function saveCalcState(s: CalcState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // 무시
  }
}

export function readCalcState(): CalcState | null {
  try {
    const v = sessionStorage.getItem(KEY);
    if (!v) return null;
    const p = JSON.parse(v) as CalcState;
    return typeof p?.b === "number" && p.b > 0 ? p : null;
  } catch {
    return null;
  }
}
