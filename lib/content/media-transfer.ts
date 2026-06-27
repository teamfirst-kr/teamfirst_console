// 매체별 광고계정 이관(권한 위임) 안내. 매체마다 위임 방식이 달라(메타 BM /
// 구글 MCC / 네이버 권한위탁) 운영자가 광고주·대행사에게 안내할 표준 절차.
export type TransferGuide = {
  platform: string;
  label: string;
  steps: string[];
};

export const MEDIA_TRANSFER_GUIDES: Record<string, TransferGuide> = {
  naver: {
    platform: "naver",
    label: "네이버 (검색광고)",
    steps: [
      "광고주 네이버 검색광고 계정 → [도구] → [권한 관리]",
      "대행사 계정 ID(또는 사업자번호) 입력 후 권한 위탁 요청",
      "대행사가 위탁 수락 → 권한위탁 완료 (광고비 청구는 광고주 카드 유지)",
    ],
  },
  kakao: {
    platform: "kakao",
    label: "카카오 (모먼트)",
    steps: [
      "광고주 카카오모먼트 → [설정] → [멤버·권한 관리]",
      "대행사 담당자 카카오계정을 멤버로 초대",
      "역할(광고 운영) 부여 후 대행사 수락",
    ],
  },
  google: {
    platform: "google",
    label: "Google Ads (MCC)",
    steps: [
      "대행사 MCC(관리자 계정)에서 광고주 고객 ID로 연결 요청 발송",
      "광고주 Google Ads → [관리자] → 연결 요청 승인",
      "예산·결제는 광고주 계정 결제수단 유지, 운영 권한만 위임",
    ],
  },
  meta: {
    platform: "meta",
    label: "Meta (비즈니스 관리자 BM)",
    steps: [
      "광고주 비즈니스 관리자(BM) → [비즈니스 설정] → [광고 계정]",
      "[사람/파트너 추가] → 대행사 BM ID로 파트너 권한 부여(광고 관리)",
      "대행사 BM에서 수락 → 결제수단은 광고주 소유 유지",
    ],
  },
  tiktok: {
    platform: "tiktok",
    label: "TikTok (비즈니스 센터)",
    steps: [
      "광고주 TikTok 비즈니스 센터 → [광고 계정] → 자산 공유",
      "대행사 비즈니스 센터 ID로 광고 계정 공유(운영 권한)",
      "대행사 수락 후 운영 시작",
    ],
  },
  youtube: {
    platform: "youtube",
    label: "YouTube (Google Ads 연동)",
    steps: ["Google Ads(MCC) 연결로 처리 — 위 Google Ads 절차와 동일"],
  },
  other: {
    platform: "other",
    label: "기타 매체",
    steps: ["매체사별 권한 위임 정책 확인 후 운영팀이 개별 안내"],
  },
};

export function guidesForPlatforms(platforms: string[]): TransferGuide[] {
  return platforms
    .map((p) => MEDIA_TRANSFER_GUIDES[p])
    .filter((g): g is TransferGuide => !!g);
}
