import { redirect } from "next/navigation";

// /admin 진입 시 대시보드로 리다이렉트 (인덱스 라우트 없음 → 404 방지).
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
