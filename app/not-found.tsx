import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl font-bold text-secondary">404</p>
      <p className="text-sm text-muted-foreground">
        요청하신 페이지를 찾을 수 없습니다.
      </p>
      <Button asChild>
        <Link href="/">홈으로</Link>
      </Button>
    </div>
  );
}
