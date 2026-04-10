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
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import type { ProfileBuilderFormValues, ProfileSection } from "@/types";
import {
  PROFILE_SECTION_META,
  PROFILE_SECTION_ORDER,
  STUDENT_PROFILE_FORM_DEFAULTS,
} from "@/lib/constants";
import { profileBuilderSchema } from "@/lib/validations";
import { AcademicDetailsSection } from "@/components/profile/academic-details-section";
import { AdditionalDetailsSection } from "@/components/profile/additional-details-section";
import { BasicInfoSection } from "@/components/profile/basic-info-section";
import { CertificationsSection } from "@/components/profile/certifications-section";
import { ContestRatingsSection } from "@/components/profile/contest-ratings-section";
import { ExperienceSection } from "@/components/profile/experience-section";
import { JobPreferencesSection } from "@/components/profile/job-preferences-section";
import { ProfilePreviewModal } from "@/components/profile/profile-preview-modal";
import { ProjectsSection } from "@/components/profile/projects-section";
import { PublicLinksSection } from "@/components/profile/public-links-section";
import { ResumeSection } from "@/components/profile/resume-section";
import { SkillsSection } from "@/components/profile/skills-section";
import { SortableSection } from "@/components/profile/sortable-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function cloneDefaults() {
  return JSON.parse(JSON.stringify(STUDENT_PROFILE_FORM_DEFAULTS)) as ProfileBuilderFormValues;
}

function countFilled(value: unknown): { filled: number; total: number } {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return { filled: 0, total: 1 };
    }

    return value.reduce(
      (accumulator, entry) => {
        const counts = countFilled(entry);
        return {
          filled: accumulator.filled + counts.filled,
          total: accumulator.total + counts.total,
        };
      },
      { filled: 0, total: 0 },
    );
  }

  if (typeof value === "string") {
    return { filled: value.trim().length > 0 ? 1 : 0, total: 1 };
  }

  if (typeof value === "number") {
    return { filled: Number.isFinite(value) ? 1 : 0, total: 1 };
  }

  if (typeof value === "boolean") {
    return { filled: 1, total: 1 };
  }

  if (value && typeof value === "object") {
    return Object.values(value).reduce(
      (accumulator, entry) => {
        const counts = countFilled(entry);
        return {
          filled: accumulator.filled + counts.filled,
          total: accumulator.total + counts.total,
        };
      },
      { filled: 0, total: 0 },
    );
  }

  return { filled: 0, total: 1 };
}

function getSectionCompletion(values: ProfileBuilderFormValues, section: ProfileSection) {
  const counts = countFilled(values[section]);
  const completion = Math.round((counts.filled / Math.max(1, counts.total)) * 100);
  const status =
    completion >= 95 ? "complete" : completion >= 45 ? "partial" : "incomplete";

  return { completion, status };
}

export default function ProfileBuilderPage() {
  const sensors = useSensors(useSensor(PointerSensor));
  const [sectionOrder, setSectionOrder] = React.useState<ProfileSection[]>(PROFILE_SECTION_ORDER);
  const [editingSections, setEditingSections] = React.useState<Record<ProfileSection, boolean>>(
    PROFILE_SECTION_ORDER.reduce(
      (accumulator, section) => ({ ...accumulator, [section]: false }),
      {} as Record<ProfileSection, boolean>,
    ),
  );
  const [savedSnapshot, setSavedSnapshot] = React.useState<ProfileBuilderFormValues>(cloneDefaults);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const form = useForm<ProfileBuilderFormValues>({
    defaultValues: cloneDefaults(),
    resolver: zodResolver(profileBuilderSchema),
    mode: "onChange",
  });

  const values = useWatch({ control: form.control }) as ProfileBuilderFormValues;

  React.useEffect(() => {
    const stored = window.localStorage.getItem("placeguard-student-profile-draft");

    if (stored) {
      const parsed = JSON.parse(stored) as ProfileBuilderFormValues;
      form.reset(parsed);
      setSavedSnapshot(parsed);
    }
  }, [form]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      if (form.formState.isDirty) {
        const currentValues = form.getValues();
        window.localStorage.setItem(
          "placeguard-student-profile-draft",
          JSON.stringify(currentValues),
        );
        toast.success("Draft saved");
      }
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [form]);

  React.useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        event.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form.formState.isDirty]);

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sectionOrder.indexOf(active.id as ProfileSection);
    const newIndex = sectionOrder.indexOf(over.id as ProfileSection);

    if (oldIndex >= 0 && newIndex >= 0) {
      setSectionOrder((current) => arrayMove(current, oldIndex, newIndex));
    }
  }

  async function saveSection(section: ProfileSection) {
    const valid = await form.trigger(section);

    if (!valid) {
      toast.error("Please fix validation errors before saving.");
      return;
    }

    const nextSnapshot = form.getValues();
    setSavedSnapshot(nextSnapshot);
    setEditingSections((current) => ({ ...current, [section]: false }));
    toast.success("Section saved");
  }

  function cancelSection(section: ProfileSection) {
    form.resetField(section, { defaultValue: savedSnapshot[section] });
    setEditingSections((current) => ({ ...current, [section]: false }));
  }

  const completionSummary = PROFILE_SECTION_ORDER.map((section) => ({
    section,
    ...getSectionCompletion(values, section),
  }));

  const overallCompletion = Math.round(
    completionSummary.reduce((sum, entry) => sum + entry.completion, 0) /
      completionSummary.length,
  );

  const sectionProps = (section: ProfileSection) => {
    const meta = PROFILE_SECTION_META.find((entry) => entry.id === section);
    const live = completionSummary.find((entry) => entry.section === section);

    return {
      completion: live?.completion ?? meta?.completion ?? 0,
      status: (live?.status ?? meta?.status ?? "incomplete") as
        | "complete"
        | "partial"
        | "incomplete",
      aiTip: meta?.aiTip,
      isEditing: editingSections[section],
      onEdit: () =>
        setEditingSections((current) => ({ ...current, [section]: true })),
      onSave: () => void saveSection(section),
      onCancel: () => cancelSection(section),
    };
  };

  const sectionMap: Record<ProfileSection, React.ReactNode> = {
    basic: <BasicInfoSection {...sectionProps("basic")} />,
    academic: <AcademicDetailsSection {...sectionProps("academic")} />,
    resume: <ResumeSection {...sectionProps("resume")} />,
    links: <PublicLinksSection {...sectionProps("links")} />,
    contests: <ContestRatingsSection {...sectionProps("contests")} />,
    certifications: <CertificationsSection {...sectionProps("certifications")} />,
    projects: <ProjectsSection {...sectionProps("projects")} />,
    experience: <ExperienceSection {...sectionProps("experience")} />,
    skills: <SkillsSection {...sectionProps("skills")} />,
    preferences: <JobPreferencesSection {...sectionProps("preferences")} />,
    additional: <AdditionalDetailsSection {...sectionProps("additional")} />,
  };

  return (
    <FormProvider {...form}>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <CardTitle>{`Profile ${overallCompletion}% Complete`}</CardTitle>
              <CardDescription>
                Complete your profile to improve placement probability by up to +23%.
              </CardDescription>
              <p className="text-sm text-muted-foreground">Last updated a few minutes ago</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setPreviewOpen(true)} variant="outline">
                Preview Public Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-11 gap-2">
              {completionSummary.map((entry) => (
                <div
                  key={entry.section}
                  className={`h-3 rounded-full ${
                    entry.completion >= 95
                      ? "bg-emerald-400"
                      : entry.completion >= 45
                        ? "bg-amber-400"
                        : "bg-rose-400"
                  }`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {completionSummary.map((entry) => (
                <Badge key={entry.section} tone={entry.status === "complete" ? "emerald" : entry.status === "partial" ? "amber" : "rose"}>
                  {`${entry.section}: ${entry.completion}%`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd} sensors={sensors}>
          <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {sectionOrder.map((section) => (
                <SortableSection id={section} key={section}>
                  <div id={section}>{sectionMap[section]}</div>
                </SortableSection>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <ProfilePreviewModal
          onClose={() => setPreviewOpen(false)}
          open={previewOpen}
          values={form.getValues()}
        />
      </div>
    </FormProvider>
  );
}
