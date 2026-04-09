import { cn, getInitials } from "@/lib/utils";

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground",
        className,
      )}
    >
      {getInitials(name)}
    </div>
  );
}
