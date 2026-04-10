import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[rgba(26,26,26,0.15)] bg-[var(--paper)]">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--red)]" />
            <span className="font-[family-name:var(--font-dm-serif-display)] text-[22px] text-[var(--ink)]">Vigilo</span>
          </Link>
          <Link href="/login" className="text-sm text-[var(--muted)]">Back to login</Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[900px] px-6 py-16">
        <div className="border border-[rgba(26,26,26,0.15)] bg-[var(--tint)] p-8 md:p-10">
          <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--red)]">FORGOT PASSWORD</p>
          <h1 className="mt-4 font-[family-name:var(--font-dm-serif-display)] text-[40px] leading-[1.1]">Coming soon</h1>
        </div>
      </main>
    </div>
  );
}
