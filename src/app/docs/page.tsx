import Link from "next/link";

const DOC_SECTIONS = [
  {
    title: "Daily workflow",
    body: "Review Silent-30 alerts, inspect skill-gap radar, trigger nudges, and monitor outcomes in one flow.",
  },
  {
    title: "Intervention actions",
    body: "Use nudges, mock assignments, and follow-up checkpoints. Each action is captured in the audit trail.",
  },
  {
    title: "Reporting",
    body: "Export student, alert, and intervention views for compliance and placement review meetings.",
  },
] as const;

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] px-6 py-14 text-[var(--ink)]">
      <div className="mx-auto w-full max-w-[920px] border border-[rgba(26,26,26,0.15)] bg-[var(--paper)] p-8 md:p-10">
        <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--red)]">
          DOCS
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-dm-serif-display)] text-[38px] leading-[1.1]">
          Vigilo quick documentation
        </h1>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {DOC_SECTIONS.map((section, index) => (
            <article key={section.title} className="border border-[rgba(26,26,26,0.15)] bg-[var(--tint)] p-5">
              <p className="font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--muted)]">
                0{index + 1}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-dm-serif-display)] text-[24px] leading-[1.2]">
                {section.title}
              </h2>
              <p className="mt-3 text-[15px] leading-[1.7] text-[var(--muted)]">{section.body}</p>
            </article>
          ))}
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
