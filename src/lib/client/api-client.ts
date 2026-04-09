import type { HealthResponse } from "@/lib/types/health";

export async function fetchHealthStatus(): Promise<HealthResponse> {
  const response = await fetch("/api/health", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}
