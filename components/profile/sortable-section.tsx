"use client";

import { useSortable } from "@dnd-kit/sortable";

import { StudentIcon } from "@/components/student/icon-map";

export function SortableSection({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef } = useSortable({ id });

  return (
    <div ref={setNodeRef}>
      <div className="mb-3 flex justify-end">
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          type="button"
          {...attributes}
          {...listeners}
        >
          <StudentIcon name="Menu" />
          Reorder
        </button>
      </div>
      {children}
    </div>
  );
}
