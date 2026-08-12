import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getCurrentPbClientId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PortalSolutionsPage() {
  const supabase = await createClient();
  const clientId = await getCurrentPbClientId();
  if (!clientId) return null;

  const [{ data: solutions }, { data: entitlements }] = await Promise.all([
    supabase.from("pb_solutions").select("id, name, description, url, sort").order("sort"),
    supabase
      .from("pb_entitlements")
      .select("solution_id, active")
      .eq("client_id", clientId),
  ]);
  const activeSet = new Set(
    (entitlements ?? []).filter((e) => e.active).map((e) => e.solution_id),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">솔루션</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          팀퍼스트 자체 개발 솔루션입니다. 광고 운영은 지금처럼 직접 하시면 됩니다.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {(solutions ?? []).map((s) => {
          const active = activeSet.has(s.id);
          return (
            <div
              key={s.id}
              className={`rounded-2xl border p-6 ${active ? "bg-card shadow-sm" : "bg-muted/40"}`}
            >
              <div className="flex items-center justify-between">
                <h2 className={`font-bold ${active ? "text-secondary" : "text-muted-foreground"}`}>
                  {s.name}
                </h2>
                {!active ? <span className="text-lg">🔒</span> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              {active ? (
                s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    바로가기 ↗
                  </a>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">오픈 준비 중입니다.</p>
                )
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  잠금 —{" "}
                  <Link href="/app/options" className="text-primary hover:underline">
                    솔루션 4종 전체 이용 옵션
                  </Link>
                  으로 오픈할 수 있습니다 (−1%p).
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
