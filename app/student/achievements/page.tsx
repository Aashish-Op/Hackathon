"use client";

import { STUDENT_ACHIEVEMENT_STATS, STUDENT_BADGES, STUDENT_CERTIFICATIONS, STUDENT_LEADERBOARD } from "@/lib/constants";
import { StudentIcon, type StudentIconName } from "@/components/student/icon-map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AchievementsPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STUDENT_ACHIEVEMENT_STATS.map((item) => (
          <Card key={item.label}>
            <CardContent className="space-y-2 pt-6">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-3xl font-semibold text-foreground">{item.value}</p>
              <Badge tone={item.tone as "yellow" | "emerald" | "amber" | "violet"}>{item.delta}</Badge>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Badge Grid</CardTitle>
          <CardDescription>
            Earned badges celebrate momentum; locked badges show the next milestone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STUDENT_BADGES.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-2xl border p-4 ${badge.earned ? "border-border bg-card" : "border-border bg-muted/20 opacity-70"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`rounded-xl p-2 ${badge.tone === "violet" ? "bg-violet-500/10 text-violet-400" : badge.tone === "amber" ? "bg-amber-500/10 text-amber-400" : badge.tone === "emerald" ? "bg-emerald-500/10 text-emerald-400" : badge.tone === "sky" ? "bg-sky-500/10 text-sky-400" : badge.tone === "yellow" ? "bg-yellow-500/10 text-yellow-400" : "bg-muted text-muted-foreground"}`}>
                  <StudentIcon name={badge.icon as StudentIconName} />
                </div>
                {!badge.earned ? <StudentIcon className="text-muted-foreground" name="Lock" /> : null}
              </div>
              <div className="mt-4 space-y-2">
                <p className="font-medium text-foreground">{badge.name}</p>
                <p className="text-sm leading-6 text-muted-foreground">{badge.description}</p>
                <p className="text-xs text-muted-foreground">
                  {badge.earned ? badge.earnedDate : badge.unlockCriteria}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>Top performers in your batch, with your row highlighted.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Anonymous ID</TableHead>
                  <TableHead>Placement Prob</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Mock Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STUDENT_LEADERBOARD.map((entry) => (
                  <TableRow
                    key={`${entry.rank}-${entry.name}`}
                    className={entry.isCurrentStudent ? "border-violet-500/20 bg-violet-500/10" : undefined}
                  >
                    <TableCell>{`#${entry.rank}`}</TableCell>
                    <TableCell className="font-medium text-foreground">{entry.name}</TableCell>
                    <TableCell>{`${entry.placementProbability}%`}</TableCell>
                    <TableCell>{entry.score}</TableCell>
                    <TableCell>{entry.mockCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certification Showcase</CardTitle>
            <CardDescription>Your uploaded certifications, ready to share with TPC or recruiters.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 overflow-x-auto pb-2 scrollbar-subtle">
            {STUDENT_CERTIFICATIONS.map((certification) => (
              <div
                key={certification.id}
                className="min-w-72 rounded-2xl border border-border bg-muted/20 p-4"
              >
                <div className="space-y-2">
                  <Badge tone={certification.relevance === "relevant" ? "emerald" : "amber"}>
                    {certification.category}
                  </Badge>
                  <p className="font-medium text-foreground">{certification.name}</p>
                  <p className="text-sm text-muted-foreground">{certification.organization}</p>
                  <p className="text-xs text-muted-foreground">{certification.issueDate}</p>
                </div>
                <Button className="mt-4" variant="outline">
                  View
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
