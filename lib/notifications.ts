import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type NotifyInput = {
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
};

// 서버 액션에서 호출: 대상 사용자에게 인앱 알림 적재. service_role 사용(임의 사용자
// 대상 insert). 실패해도 호출부 흐름을 막지 않는다.
export async function notify(
  userId: string | null | undefined,
  input: NotifyInput,
): Promise<void> {
  if (!userId) return;
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert({
      user_id: userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    });
  } catch {
    // 알림 적재 실패는 무시
  }
}

// 여러 대상에게 동일 알림
export async function notifyMany(
  userIds: (string | null | undefined)[],
  input: NotifyInput,
): Promise<void> {
  const ids = userIds.filter((v): v is string => !!v);
  if (ids.length === 0) return;
  try {
    const admin = createAdminClient();
    await admin.from("notifications").insert(
      ids.map((user_id) => ({
        user_id,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      })),
    );
  } catch {
    // 무시
  }
}
