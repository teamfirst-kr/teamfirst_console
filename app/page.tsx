export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-3xl font-bold text-secondary">
          TeamFirst 운영 콘솔
        </h1>
        <p className="text-muted-foreground">
          광고주와 검증된 광고 대행사를 매칭하는 양면 플랫폼.
        </p>
        <p className="text-sm text-muted-foreground">
          MVP 1주차 셋업 완료 — Next.js 15 · Tailwind · shadcn/ui · Supabase
        </p>
      </div>
    </main>
  );
}
