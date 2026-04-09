import { HELP_CENTER } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {HELP_CENTER.sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{HELP_CENTER.heading}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">{section.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
