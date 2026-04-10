import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] px-6 py-14 text-[var(--ink)]">
      <div className="mx-auto w-full max-w-[840px] border border-[rgba(26,26,26,0.15)] bg-[var(--tint)] p-8 md:p-10">
        <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--red)]">
          PRIVACY
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-dm-serif-display)] text-[38px] leading-[1.1]">
          Privacy and data handling
        </h1>

        <div className="mt-7 space-y-5 text-[16px] leading-[1.75] text-[var(--muted)]">
          <p>
            Vigilo processes academic and placement engagement signals only for intervention planning,
            reporting, and placement workflow support.
          </p>
          <p>
            Student-level actions are timestamped, role-scoped, and auditable. Access controls are applied
            to ensure only authorized placement staff can review sensitive records.
          </p>
          <p>
            For production deployment, institutions should define retention, consent, and escalation
            policies according to their compliance requirements.
          </p>
        </div>

        <div className="mt-10 border-t border-[rgba(26,26,26,0.15)] pt-5 text-sm text-[var(--muted)]">
          <Link href="/" className="text-[var(--red)]">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
