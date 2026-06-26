import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import {
  REQUEST_MEDIA,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";

const MEDIA_LABEL = Object.fromEntries(
  REQUEST_MEDIA.map((m) => [m.value, m.label]),
);

export type BoardRequest = {
  id: string;
  title: string;
  brief: MatchingBrief | null;
  budget_monthly: number | null;
  status: string;
  submitted_at: string | null;
  created_at: string | null;
};

// 매칭 라이프사이클을 운영자가 한눈에 보는 파이프라인 칸반.
const PIPELINE: { key: string; label: string; statuses: string[]; tint: string }[] =
  [
    { key: "intake", label: "검수 대기", statuses: ["submitted"], tint: "bg-amber-50 border-amber-200" },
    { key: "rfp", label: "RFP · 수집", statuses: ["rfp_sent", "collecting"], tint: "bg-sky-50 border-sky-200" },
    { key: "curate", label: "후보 선정", statuses: ["curating", "candidates_sent"], tint: "bg-indigo-50 border-indigo-200" },
    { key: "meeting", label: "미팅", statuses: ["meeting_scheduled"], tint: "bg-emerald-50 border-emerald-200" },
    { key: "closed", label: "종료", statuses: ["closed_won", "closed_lost", "cancelled"], tint: "bg-slate-100 border-slate-200" },
  ];

export function RequestBoard({ requests }: { requests: BoardRequest[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
      {PIPELINE.map((col) => {
        const items = requests.filter((r) => col.statuses.includes(r.status));
        return (
          <div key={col.key} className="flex flex-col">
            <div
              className={`mb-3 flex items-center justify-between rounded-lg border px-3 py-2 ${col.tint}`}
            >
              <span className="text-sm font-semibold text-foreground">
                {col.label}
              </span>
              <span className="rounded-full bg-white/70 px-2 text-xs font-bold text-foreground">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed py-6 text-center text-xs text-muted-foreground">
                  없음
                </p>
              ) : (
                items.map((r) => {
                  const brief = (r.brief ?? {}) as MatchingBrief;
                  const channels = (brief.channels ?? []).slice(0, 2);
                  return (
                    <Link
                      key={r.id}
                      href={`/admin/requests/${r.id}`}
                      className="block rounded-lg border bg-card p-3 shadow-sm transition hover:border-primary hover:shadow-md"
                    >
                      <div className="font-medium text-foreground">{r.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {brief.category}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {channels.map((c) => (
                          <span
                            key={c}
                            className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                          >
                            {MEDIA_LABEL[c] ?? c}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {r.budget_monthly
                            ? `${r.budget_monthly.toLocaleString()}원`
                            : "예산 협의"}
                        </span>
                        <span>
                          {r.submitted_at
                            ? formatDistanceToNow(new Date(r.submitted_at), {
                                addSuffix: true,
                                locale: ko,
                              })
                            : ""}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
