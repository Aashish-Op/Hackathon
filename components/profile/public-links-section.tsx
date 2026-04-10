"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useFieldArray, useFormContext } from "react-hook-form";

import type { ProfileBuilderFormValues } from "@/types";
import { SectionShell } from "@/components/profile/section-shell";
import { SortableLinkRow } from "@/components/profile/sortable-link-row";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PublicLinksSection(props: {
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { control, register, watch } = useFormContext<ProfileBuilderFormValues>();
  const sensors = useSensors(useSensor(PointerSensor));
  const { fields, move, append, remove } = useFieldArray({
    control,
    name: "links",
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);

    if (oldIndex >= 0 && newIndex >= 0) {
      move(oldIndex, newIndex);
    }
  }

  return (
    <SectionShell title="Public Profiles" {...props}>
      <div className="space-y-4">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
          <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {fields.map((field, index) => {
                const visibility = watch(`links.${index}.visibility` as const);
                const verified = watch(`links.${index}.verified` as const);

                return (
                  <SortableLinkRow id={field.id} key={field.id}>
                    <div className="grid gap-3 md:grid-cols-[0.7fr_1.2fr_0.8fr_auto_auto]">
                      <Input disabled={!props.isEditing} {...register(`links.${index}.platform` as const)} />
                      <Input disabled={!props.isEditing} {...register(`links.${index}.url` as const)} placeholder="https://..." />
                      <select
                        className="h-10 rounded-xl border border-border bg-muted px-3 text-sm text-foreground"
                        disabled={!props.isEditing}
                        {...register(`links.${index}.visibility` as const)}
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                      <Badge tone={verified ? "emerald" : "slate"}>
                        {verified ? "Verified" : visibility}
                      </Badge>
                      {props.isEditing ? (
                        <Button onClick={() => remove(index)} type="button" variant="ghost">
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </SortableLinkRow>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
        {props.isEditing ? (
          <Button
            onClick={() =>
              append({
                id: `custom-${Date.now()}`,
                platform: "Custom Link",
                icon: "Globe",
                tone: "sky",
                url: "",
                visibility: "public",
                verified: false,
              })
            }
            type="button"
            variant="outline"
          >
            + Add Custom Link
          </Button>
        ) : null}
      </div>
    </SectionShell>
  );
}
