// 광고 계정 권한 부여·광고비 신고에 쓰는 매체 목록 (ad_platform enum)
export const AD_PLATFORM_OPTIONS = [
  { value: "naver", label: "네이버" },
  { value: "kakao", label: "카카오" },
  { value: "google", label: "구글" },
  { value: "meta", label: "메타" },
  { value: "tiktok", label: "틱톡" },
  { value: "youtube", label: "유튜브" },
  { value: "other", label: "기타" },
] as const;

export type AdSpendEntry = {
  period_yearmonth: string; // 'YYYY-MM'
  platform_amounts: Record<string, number>;
};

export function isValidYearMonth(v: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}
