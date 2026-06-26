"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

// RFP 인쇄/PDF 저장 버튼. 브라우저 인쇄 대화상자에서 "PDF로 저장"을 선택하면
// 한글이 완벽하게 렌더링된 RFP PDF를 받을 수 있다.
export function PrintButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (auto) {
      const t = setTimeout(() => window.print(), 600);
      return () => clearTimeout(t);
    }
  }, [auto]);

  return (
    <Button onClick={() => window.print()} className="gap-2">
      <Printer className="h-4 w-4" />
      PDF로 저장 / 인쇄
    </Button>
  );
}
