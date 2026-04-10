"use client";

import { Line, LineChart } from "recharts";

import { ChartContainer } from "@/components/ui/chart-container";

const colorMap = {
  violet: "var(--chart-violet)",
  amber: "var(--chart-amber)",
  rose: "var(--chart-rose)",
  emerald: "var(--chart-emerald)",
  sky: "var(--chart-sky)",
  slate: "var(--chart-slate)",
} as const;

export function ProgressSpark({
  data,
  color,
}: {
  data: number[];
  color: keyof typeof colorMap;
}) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className="h-14 w-full">
      <ChartContainer>
        <LineChart data={chartData}>
          <Line
            dataKey="value"
            dot={false}
            isAnimationActive={false}
            stroke={colorMap[color]}
            strokeWidth={2.5}
            type="monotone"
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
