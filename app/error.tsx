"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-lg font-semibold text-secondary">
        문제가 발생했습니다
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        일시적인 오류일 수 있습니다. 다시 시도해도 계속되면 운영팀에
        문의해주세요.
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
