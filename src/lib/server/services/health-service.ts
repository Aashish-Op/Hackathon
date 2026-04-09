import type { HealthResponse } from "@/lib/types/health";

export function getHealthStatus(): HealthResponse {
  return {
    status: "ok",
    environment: process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  };
}
