import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentIcon } from "@/components/student/icon-map";

export function SectionShell({
  title,
  completion,
  status,
  aiTip,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  children,
}: {
  title: string;
  completion: number;
  status: "complete" | "partial" | "incomplete";
  aiTip?: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const tone = status === "complete" ? "emerald" : status === "partial" ? "amber" : "rose";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge tone={tone}>
              {status === "complete" ? "Complete" : status === "partial" ? "Partial" : "Incomplete"}
            </Badge>
            <Badge tone="violet">{`${completion}%`}</Badge>
          </div>
          {aiTip ? (
            <div className="flex items-start gap-2 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm text-foreground">
              <StudentIcon className="mt-0.5 h-4 w-4 text-violet-400" name="Sparkles" />
              <span>{aiTip}</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button onClick={onCancel} variant="ghost">
                Cancel
              </Button>
              <Button onClick={onSave}>Save</Button>
            </>
          ) : (
            <Button onClick={onEdit} variant="outline">
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
