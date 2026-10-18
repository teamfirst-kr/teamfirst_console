import Link from "next/link";

import { UnsubscribeConfirm } from "./unsubscribe-confirm";

export const dynamic = "force-dynamic";
export const metadata = { title: "뉴스레터 수신거부 — TeamFirst", robots: { index: false } };

// 메일 하단 "수신거부" 링크 — GET은 확인 화면만 보여주고, 실제 처리는 버튼(POST 서버 액션)으로.
// (메일 보안 게이트웨이·미리보기가 링크를 자동 열어도 수신거부되지 않도록)
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = !!token && /^[a-f0-9]{48}$/.test(token);

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Newsletter</p>
      {valid ? (
        <UnsubscribeConfirm token={token!} />
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
