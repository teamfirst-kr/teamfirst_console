import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_APPS,
  DEFAULT_MARKET,
  parseMarketConfig,
  type MarketApp,
  type MarketConfig,
} from "@/lib/solution-market";

// 플랜 설정 (pb_app_settings.solution_market). 키가 없거나 조회에 실패하면 기본값 —
// 마이그레이션 033 적용 전에도 공개 마켓 페이지가 깨지지 않게.
export async function getMarketConfig(): Promise<MarketConfig> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pb_app_settings")
      .select("value")
      .eq("key", "solution_market")
      .maybeSingle();
    return parseMarketConfig(data?.value);
  } catch {
    return DEFAULT_MARKET;
  }
}

// 앱 카탈로그 (sort 순). 공개 조회는 RLS가 숨김 앱을 빼고, 운영자 세션은 전체가 조회된다.
// 테이블이 없으면(033 미적용) 기존 3종 기본값을 쓰고 fallback=true.
export async function getMarketApps(): Promise<{ apps: MarketApp[]; fallback: boolean }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("solution_apps")
      .select("key, name, brand, category, summary, description, features, video_id, status, sort")
      .order("sort", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) return { apps: DEFAULT_APPS, fallback: true };
    return { apps: (data ?? []) as MarketApp[], fallback: false };
  } catch {
    return { apps: DEFAULT_APPS, fallback: true };
  }
}
