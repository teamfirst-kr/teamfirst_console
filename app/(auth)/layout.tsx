import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold text-secondary">
          TeamFirst
        </Link>
        <Link
          href="/"
          className="text-sm text-muted-foreground transition hover:text-secondary"
        >
          ← 메인으로
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </main>
    </div>
  );
}
