import { HealthPanel } from "@/features/health/components/health-panel";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:px-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Next.js Full-Stack Starter</h1>
        <p className="max-w-2xl text-foreground/80">
          Frontend and backend are separated into dedicated folders, with API routes in
          the App Router and server logic in reusable services.
        </p>
      </section>

      <section className="rounded-xl border border-foreground/15 p-6">
        <h2 className="mb-3 text-xl font-medium">Backend Connectivity Check</h2>
        <p className="mb-4 text-sm text-foreground/80">
          The panel below calls <code>/api/health</code>, which uses shared backend
          services and typed response models.
        </p>
        <HealthPanel />
      </section>
    </main>
  );
}
