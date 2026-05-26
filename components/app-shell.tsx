import Link from "next/link";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/(auth)/actions";

type NavItem = { href: string; label: string };

export function AppShell({
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
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background">
        <div className="flex h-14 items-center gap-6 px-6">
          <Link href="/" className="text-sm font-semibold text-secondary">
            TeamFirst
          </Link>
          <span className="text-sm text-muted-foreground">{title}</span>
          <nav className="ml-6 flex items-center gap-4 text-sm">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {email ? (
              <span className="text-xs text-muted-foreground">{email}</span>
            ) : null}
            <form action={logoutAction}>
              <Button variant="ghost" size="sm" type="submit">
                로그아웃
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
