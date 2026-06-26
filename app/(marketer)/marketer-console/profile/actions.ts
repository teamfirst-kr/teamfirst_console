"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getCurrentMarketerId } from "@/lib/auth";
import type { Json } from "@/types/database";
import type { MarketerPortfolioItem } from "@/lib/schemas/marketer";

export type ProfileState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

function parsePortfolio(raw: string): MarketerPortfolioItem[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [title, url] = l.split("|").map((s) => s.trim());
      return { title: title || url || "", url: url || title || "" };
    })
    .filter((p) => p.url);
}

// 마케터 본인 프로필 수정. slug/category/status/공개여부는 운영자 영역이라
// 여기서 변경하지 않는다(허용 컬럼만 업데이트).
export async function updateMyProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const marketerId = await getCurrentMarketerId();
  if (!marketerId) return { ok: false, error: "마케터 정보를 찾을 수 없습니다." };

  const supabase = await createClient();
  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("marketers")
    .update({
      headline: String(formData.get("headline") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      skills,
      portfolio: parsePortfolio(
        String(formData.get("portfolio") ?? ""),
      ) as unknown as Json,
      career_years: Number(formData.get("career_years")) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", marketerId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/marketer-console/profile");
  revalidatePath("/marketer-console");
  return { ok: true, message: "프로필이 저장되었습니다." };
}
