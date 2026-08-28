import Link from "next/link";

import { DateText } from "@/components/date-text";
import { createClient } from "@/lib/supabase/server";
import { SURVEY_REASONS } from "@/lib/apply-survey";

export const dynamic = "force-dynamic";

// /apply 이탈 설문 전체 조회 — 사유별 집계 + 1:1 상담 요청 + 전체 응답
export default async function PaybackSurveysPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pb_apply_surveys")
    .select(
      "id, reason, phone, detail, match_interest, brand_name, monthly_budget, current_rate, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = data ?? [];
  const consultRequests = rows.filter((r) => r.phone);
  const countByReason = new Map<string, number>();
  for (const r of rows) {
    countByReason.set(r.reason, (countByReason.get(r.reason) ?? 0) + 1);
  }
  const reasonLabel = (code: string) =>
    SURVEY_REASONS[code as keyof typeof SURVEY_REASONS] ?? code;
  const matchInfo = (s: (typeof rows)[number]) => {
    if (s.match_interest === null || s.match_interest === undefined) return null;
    const parts: string[] = [];
    if (s.brand_name) parts.push(s.brand_name);
    if (s.current_rate) parts.push(`현재 ${s.current_rate}%`);
    if (s.monthly_budget)
      parts.push(`월 ${Number(s.monthly_budget).toLocaleString()}원`);
    return (
      <span
        className={
          "mt-0.5 block break-keep text-xs " +
          (s.match_interest
            ? "font-semibold text-emerald-600"
            : "text-muted-foreground")
        }
      >
        🤝 동일 % 매칭: {s.match_interest ? "예" : "아니오"}
        {parts.length ? ` — ${parts.join(" · ")}` : ""}
        {s.match_interest && s.current_rate && !s.brand_name
          ? " (신원 미입력)"
          : ""}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">신청 이탈 설문</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            /apply 페이지에서 &ldquo;신청을 망설이는 이유&rdquo; 응답과 1:1
            전화상담 요청을 조회합니다. (최근 500건)
          </p>
        </div>
        <Link
          href="/admin/payback"
          className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
        >
          ← 파이프라인
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          조회 실패: {error.message}
          <span className="block text-xs">
            최신 마이그레이션(021·023·024 — pb_apply_surveys) 실행 여부를 확인하세요.
          </span>
        </div>
      ) : null}

      {/* 사유별 집계 */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.entries(SURVEY_REASONS) as [string, string][]).map(
          ([code, label]) => (
            <div key={code} className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold text-secondary">
                {countByReason.get(code) ?? 0}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  건
                </span>
              </p>
            </div>
          ),
        )}
      </section>

      {/* 1:1 상담 요청 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          📞 1:1 전화상담 요청 ({consultRequests.length})
        </h2>
        {consultRequests.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            상담 요청이 없습니다
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">연락처</th>
                  <th className="px-4 py-2.5 font-medium">망설인 이유</th>
                  <th className="px-4 py-2.5 font-medium">요청 시각</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {consultRequests.map((s) => (
                  <tr key={s.id} className="bg-primary/[0.03]">
                    <td className="px-4 py-2.5">
                      <a
                        href={`tel:${(s.phone ?? "").replace(/[^\d+]/g, "")}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {s.phone}
                      </a>
                      {s.brand_name ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {s.brand_name}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5">
                      {reasonLabel(s.reason)}
                      {s.detail ? (
                        <span className="mt-0.5 block whitespace-pre-wrap break-keep text-xs text-muted-foreground">
                          💬 {s.detail}
                        </span>
                      ) : null}
                      {matchInfo(s)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <DateText value={s.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 전체 응답 */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          전체 응답 ({rows.length})
        </h2>
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
            아직 응답이 없습니다
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">이유</th>
                  <th className="px-4 py-2.5 font-medium">상담 요청</th>
                  <th className="px-4 py-2.5 font-medium">응답 시각</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5">
                      {reasonLabel(s.reason)}
                      {s.detail ? (
                        <span className="mt-0.5 block whitespace-pre-wrap break-keep text-xs text-muted-foreground">
                          💬 {s.detail}
                        </span>
                      ) : null}
                      {matchInfo(s)}
                    </td>
                    <td className="px-4 py-2.5">
                      {s.phone ? (
                        <span className="font-semibold text-primary">
                          📞 {s.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <DateText value={s.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
