import Link from "next/link";

import { setSubscriptionByToken } from "../actions";
import { ResubscribeButton } from "./resubscribe-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "뉴스레터 수신거부 — TeamFirst", robots: { index: false } };

// 메일 하단 "수신거부" 링크 — 토큰만으로 즉시 처리 (원클릭)
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const r = token ? await setSubscriptionByToken(token, "unsubscribed") : { ok: false as const };

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      {r.ok ? (
        <>
          <p className="text-3xl">👋</p>
          <h1 className="mt-3 text-2xl font-extrabold text-secondary">수신거부가 완료되었습니다</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{r.email}</span> 주소로 더 이상 뉴스레터를 보내지 않습니다.
          </p>
          <div className="mt-6 space-y-2">
            <ResubscribeButton token={token!} />
            <p className="text-xs text-muted-foreground">
              실수로 눌렀다면 위 버튼으로 바로 되돌릴 수 있습니다.
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold text-secondary">링크가 올바르지 않습니다</h1>
          <p className="mt-2 text-sm text-muted-foreground">메일 하단의 수신거부 링크를 다시 눌러주세요. 계속 문제가 있으면 team1st2025@gmail.com 으로 알려주세요.</p>
        </>
      )}
      <Link href="/newsletter" className="mt-8 inline-block text-sm text-primary hover:underline">
        뉴스레터 보관함으로 →
      </Link>
    </div>
  );
}
