import {
  REQUEST_STAGES,
  stageIndexForStatus,
} from "@/lib/schemas/matching-request";

// 매칭 요청의 전체 단계를 항상 보여주는 진행바.
// 완료=체크, 현재=강조, 예정=비활성.
export function RequestProgress({ status }: { status: string }) {
  const current = stageIndexForStatus(status);
  const cancelled = status === "cancelled";

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[520px] items-start">
        {REQUEST_STAGES.map((s, i) => {
          const done = !cancelled && i < current;
          const active = !cancelled && i === current;
          const last = i === REQUEST_STAGES.length - 1;
          return (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex w-20 flex-col items-center gap-1.5 text-center">
                <span
                  className={
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition " +
                    (done
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-secondary text-white ring-4 ring-secondary/15"
                        : "bg-muted text-muted-foreground")
                  }
                >
                  {done ? "✓" : i + 1}
                </span>
                <span
                  className={
                    "text-[11px] leading-tight " +
                    (active
                      ? "font-bold text-secondary"
                      : done
                        ? "text-foreground"
                        : "text-muted-foreground")
                  }
                >
                  {s.label}
                </span>
              </div>
              {!last ? (
                <div
                  className={
                    "mx-1 mt-4 h-0.5 flex-1 rounded " +
                    (!cancelled && i < current ? "bg-primary" : "bg-muted")
                  }
                />
              ) : null}
            </div>
          );
        })}
      </div>
      {cancelled ? (
        <p className="mt-3 text-xs font-medium text-destructive">
          취소된 요청입니다.
        </p>
      ) : null}
    </div>
  );
}
