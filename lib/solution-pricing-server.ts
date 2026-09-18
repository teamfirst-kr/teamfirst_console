import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_PRICING,
  parseSolutionPricingConfig,
  type SolutionPricingConfig,
} from "@/lib/solution-pricing";

// pb_app_settings.solution_pricing 키에서 요금 설정을 읽는다 (서버 전용).
// 키가 없거나 조회 실패 시 코드 기본값(DEFAULT_PRICING) 사용 — 공개 요금 페이지가 깨지지 않게.
export async function getSolutionPricing(): Promise<SolutionPricingConfig> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pb_app_settings")
      .select("value")
      .eq("key", "solution_pricing")
      .maybeSingle();
    return parseSolutionPricingConfig(data?.value);
  } catch {
    return DEFAULT_PRICING;
  }
}
