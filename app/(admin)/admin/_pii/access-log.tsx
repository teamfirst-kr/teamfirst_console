import { DateText } from "@/components/date-text";
import { createClient } from "@/lib/supabase/server";
import { PII_ENTITY_LABEL, PII_FIELD_LABEL, PII_VIEW_ACTION, type PiiEntity, type PiiField } from "@/lib/pii";

type LogRow = {
  id: string;
  entity: string;
  entity_id: string | null;
  diff: { field?: string } | null;
  created_at: string;
  actor: { email: string | null } | null;
};

// 개인정보 원문 열람 기록 (최근 N건) — 누가·언제·어떤 정보를 열람했는지
export async function PiiAccessLog({ limit = 30 }: { limit?: number }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pb_audit_logs")
    .select("id, entity, entity_id, diff, created_at, actor:users(email)")
    .eq("action", PII_VIEW_ACTION)
    .order("created_at", { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as unknown as LogRow[];

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-bold text-secondary">🔒 개인정보 열람 기록</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          목록의 연락처·이메일·문의 내용은 마스킹되어 있으며, &lsquo;보기&rsquo;로 원문을 열람하면 아래에 기록됩니다. (최근 {limit}건)
        </p>
      </div>
      {error ? (
        <p className="px-4 py-3 text-xs text-destructive">열람 기록을 불러오지 못했습니다.</p>
      ) : rows.length === 0 ? (
        <p className="px-4 py-3 text-xs text-muted-foreground">아직 열람 기록이 없습니다.</p>
      ) : (
        <ul className="divide-y text-xs">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-4 py-2">
              <span className="text-muted-foreground">
                <DateText value={r.created_at} />
              </span>
              <span className="font-semibold text-foreground">{r.actor?.email ?? "알 수 없음"}</span>
              <span className="text-muted-foreground">
                {PII_ENTITY_LABEL[r.entity as PiiEntity] ?? r.entity} · {PII_FIELD_LABEL[(r.diff?.field ?? "all") as PiiField | "all"] ?? r.diff?.field}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground/70">{r.entity_id?.slice(0, 8)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
