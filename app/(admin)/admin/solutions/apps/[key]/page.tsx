import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { appLabel, type MarketApp } from "@/lib/solution-market";

import { AppForm } from "../app-form";

export const dynamic = "force-dynamic";

export default async function EditMarketAppPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("solution_apps")
    .select("key, name, brand, category, summary, description, features, video_id, status, sort")
    .eq("key", key)
    .maybeSingle();
  if (!data) notFound();
  const app = data as MarketApp;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/solutions/apps" className="text-xs text-muted-foreground hover:underline">
          ← 앱 카탈로그
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">{appLabel(app)} 수정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          저장 즉시 공개 마켓 페이지(/solutions)에 반영됩니다. 기존 3종(CatchLog·AUTO REPORT·AUTO BID)의 영상·상세
          기능은 코드의 상세 콘텐츠가 우선 표시됩니다.
        </p>
      </div>
      <AppForm app={app} />
    </div>
  );
}
