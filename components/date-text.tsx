import { format, formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

// 전 화면 공통 날짜 표기: 절대일자(YYYY.MM.DD) + 마우스오버 시 상대시간 tooltip.
export function DateText({
  value,
  fallback = "-",
}: {
  value: string | Date | null | undefined;
  fallback?: string;
}) {
  if (!value) return <>{fallback}</>;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return <>{fallback}</>;
  return (
    <time
      dateTime={d.toISOString()}
      title={formatDistanceToNow(d, { addSuffix: true, locale: ko })}
    >
      {format(d, "yyyy.MM.dd")}
    </time>
  );
}
