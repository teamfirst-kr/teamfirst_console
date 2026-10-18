// CSV 셀 이스케이프 — 따옴표 처리 + 수식 주입(=,+,-,@,탭,CR) 방어 + 제어문자 제거
export function csvCell(v: string | null | undefined): string {
  let s = String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
