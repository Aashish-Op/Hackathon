import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={`card-${index}`} className="h-40" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Skeleton className="h-[360px] xl:col-span-3" />
        <Skeleton className="h-[360px] xl:col-span-2" />
      </div>
      <Skeleton className="h-[420px]" />
      <Skeleton className="h-[460px]" />
    </div>
  );
}
