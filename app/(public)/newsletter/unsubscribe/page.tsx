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
    <div className="mx-auto max-w-md px-6 py-24">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Newsletter</p>
      {r.ok ? (
        <>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.01em] text-secondary">수신거부가 완료되었습니다</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">{r.email}</span> 주소로 더 이상 뉴스레터를 보내지 않습니다. 실수로 눌렀다면 아래 버튼으로 바로 되돌릴 수 있습니다.
          </p>
          <div className="mt-6">
            <ResubscribeButton token={token!} />
          </div>
        </>
      ) : (
        <>
          <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.01em] text-secondary">링크가 올바르지 않습니다</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">메일 하단의 수신거부 링크를 다시 눌러주세요. 계속 문제가 있으면 team1st2025@gmail.com 으로 알려주세요.</p>
        </>
      )}
      <Link href="/newsletter" className="mt-10 inline-block text-sm font-semibold text-secondary underline underline-offset-4">
        뉴스레터 보관함으로
      </Link>
    </div>
  );
}
