"use client";

import * as React from "react";
import { Download, Eye, MessageSquare, Zap } from "lucide-react";

import { STUDENT_FILTERS, STUDENT_STATS, STUDENTS, getRiskScoreTone } from "@/lib/constants";
import { cn, formatRelativeTime, isOlderThanDays } from "@/lib/utils";
import {
  ClusterBadge,
  EmptySearchState,
  PlacementProbability,
  RiskScoreBadge,
  StatCard,
  StudentIdentity,
  SelectField,
} from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function getRiskFilterLabel(score: number): string {
  const tone = getRiskScoreTone(score);

  if (tone === "emerald") {
    return "Safe";
  }

  if (tone === "amber") {
    return "At-Risk";
  }

  return "High-Risk";
}

export default function StudentsPage() {
  const [query, setQuery] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("All Departments");
  const [riskFilter, setRiskFilter] = React.useState("All Risk Levels");
  const [clusterFilter, setClusterFilter] = React.useState("All Clusters");
  const [activityFilter, setActivityFilter] = React.useState("Any Time");
  const [sortBy, setSortBy] = React.useState("Risk Score ↑");
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);

  const filteredStudents = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const nextStudents = STUDENTS.filter((student) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        student.name.toLowerCase().includes(normalizedQuery) ||
        student.rollNo.toLowerCase().includes(normalizedQuery) ||
        student.department.toLowerCase().includes(normalizedQuery);

      const matchesDepartment =
        departmentFilter === "All Departments" || student.department === departmentFilter;

      const matchesRisk =
        riskFilter === "All Risk Levels" || getRiskFilterLabel(student.riskScore) === riskFilter;

      const matchesCluster =
        clusterFilter === "All Clusters" ||
        student.cluster === clusterFilter.toLowerCase().replace(" ", "-");

      const matchesActivity =
        activityFilter === "Any Time" ||
        (activityFilter === "Active in 3 Days" && !isOlderThanDays(student.lastActive, 3)) ||
        (activityFilter === "Active in 7 Days" && !isOlderThanDays(student.lastActive, 7)) ||
        (activityFilter === "Inactive 14+ Days" && isOlderThanDays(student.lastActive, 14));

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesRisk &&
        matchesCluster &&
        matchesActivity
      );
    });

    return [...nextStudents].sort((left, right) => {
      if (sortBy === "Risk Score ↑") {
        return left.riskScore - right.riskScore;
      }

      if (sortBy === "Risk Score ↓") {
        return right.riskScore - left.riskScore;
      }

      if (sortBy === "Last Active") {
        return new Date(left.lastActive).getTime() - new Date(right.lastActive).getTime();
      }

      return left.name.localeCompare(right.name);
    });
  }, [activityFilter, clusterFilter, departmentFilter, query, riskFilter, sortBy]);

  const allSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((student) => selectedRows.includes(student.id));

  function toggleSelection(id: string) {
    setSelectedRows((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );
  }

  function toggleAll() {
    setSelectedRows((current) =>
      allSelected ? current.filter((id) => !filteredStudents.some((student) => student.id === id)) : filteredStudents.map((student) => student.id),
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {STUDENT_STATS.map((metric) => (
          <StatCard key={metric.id} {...metric} />
        ))}
      </section>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,0.8fr))]">
            <Input
              onChange={(event) => setQuery(event.target.value)}
              placeholder={STUDENT_FILTERS.searchPlaceholder}
              value={query}
            />
            <SelectField
              aria-label="Filter by department"
              onChange={setDepartmentFilter}
              options={STUDENT_FILTERS.departments}
              value={departmentFilter}
            />
            <SelectField
              aria-label="Filter by risk level"
              onChange={setRiskFilter}
              options={STUDENT_FILTERS.riskLevels}
              value={riskFilter}
            />
            <SelectField
              aria-label="Filter by cluster"
              onChange={setClusterFilter}
              options={STUDENT_FILTERS.clusters}
              value={clusterFilter}
            />
            <SelectField
              aria-label="Filter by last active"
              onChange={setActivityFilter}
              options={STUDENT_FILTERS.lastActive}
              value={activityFilter}
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SelectField
              aria-label="Sort students"
              className="lg:w-52"
              onChange={setSortBy}
              options={STUDENT_FILTERS.sortOptions}
              value={sortBy}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="ghost">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button disabled={selectedRows.length === 0} variant="warning">
                <Zap className="h-4 w-4" />
                {selectedRows.length === 0
                  ? "Bulk Intervene"
                  : `Bulk Intervene (${selectedRows.length})`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredStudents.length === 0 ? (
        <EmptySearchState
          body="Try changing the department, risk, or cluster filters to surface a broader student slice."
          title="No students match the current filters"
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      aria-label="Select all students"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Placement Probability</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Mock Attempts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const lastActiveLabel = formatRelativeTime(student.lastActive);
                  const lastActiveTone = isOlderThanDays(student.lastActive, 21)
                    ? "text-rose-400"
                    : isOlderThanDays(student.lastActive, 14)
                      ? "text-amber-400"
                      : "text-muted-foreground";

                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${student.name}`}
                          checked={selectedRows.includes(student.id)}
                          onChange={() => toggleSelection(student.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <StudentIdentity
                          name={student.name}
                          secondary={student.rollNo}
                          tertiary={student.triggers[0]}
                        />
                      </TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell>
                        <RiskScoreBadge score={student.riskScore} />
                      </TableCell>
                      <TableCell>
                        <ClusterBadge cluster={student.cluster} />
                      </TableCell>
                      <TableCell className="min-w-48">
                        <PlacementProbability value={student.placementProbability} />
                      </TableCell>
                      <TableCell>
                        <span className={cn("text-sm", lastActiveTone)}>{lastActiveLabel}</span>
                      </TableCell>
                      <TableCell>{student.mockAttempts}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button aria-label={`View ${student.name}`} size="icon" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            aria-label={`Send nudge to ${student.name}`}
                            size="icon"
                            variant="ghost"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            aria-label={`Intervene for ${student.name}`}
                            size="icon"
                            variant="warning"
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
