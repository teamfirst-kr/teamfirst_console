import Link from "next/link";

import { logoutAction } from "@/app/(auth)/actions";
import { AppNav } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import { getMyNotifications } from "@/components/notification-actions";

type NavItem = { href: string; label: string };

export async function AppShell({
  title,
  nav,
  email,
  children,
}: {
  title: string;
  nav: NavItem[];
  email: string | undefined;
  children: React.ReactNode;
}) {
  let unread = 0;
  try {
    unread = (await getMyNotifications()).unread;
  } catch {
    unread = 0;
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* 사이드바 */}
      <aside className="hidden md:flex md:w-60 md:flex-col bg-secondary text-secondary-foreground">
        <div className="h-14 flex items-center px-5 border-b border-white/10">
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-white"
          >
            TeamFirst
          </Link>
        </div>
        <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-white/40">
          {title}
        </div>
        <AppNav items={nav} />
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 flex items-center justify-between">
            {email ? (
              <p className="px-2 text-xs text-white/50 truncate" title={email}>
                {email}
              </p>
            ) : (
              <span />
            )}
            <NotificationBell initialUnread={unread} />
          </div>
          <form action={logoutAction}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
            >
              로그아웃
            </Button>
          </form>
        </div>
      </aside>

      {/* 모바일 상단바 */}
      <div className="md:hidden fixed inset-x-0 top-0 z-10 flex h-12 items-center justify-between bg-secondary px-4 text-secondary-foreground">
        <Link href="/" className="text-sm font-bold text-white">
          TeamFirst · {title}
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell initialUnread={unread} />
          <form action={logoutAction}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              로그아웃
            </Button>
          </form>
        </div>
      </div>

      <main className="flex-1 pt-12 md:pt-0">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
