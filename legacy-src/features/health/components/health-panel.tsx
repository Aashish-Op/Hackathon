"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchHealthStatus } from "@/lib/client/api-client";
import type { HealthResponse } from "@/lib/types/health";

export function HealthPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadHealth = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchHealthStatus();
      setHealth(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      setErrorMessage(message);
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm text-foreground/80">Checking backend status...</p>}

      {!isLoading && errorMessage && (
        <p className="text-sm text-foreground">Request failed: {errorMessage}</p>
      )}

      {!isLoading && health && (
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-foreground/15 p-3">
            <dt className="text-foreground/70">Status</dt>
            <dd className="font-medium">{health.status}</dd>
          </div>
          <div className="rounded-lg border border-foreground/15 p-3">
            <dt className="text-foreground/70">Environment</dt>
            <dd className="font-medium">{health.environment}</dd>
          </div>
          <div className="rounded-lg border border-foreground/15 p-3">
            <dt className="text-foreground/70">Server Time</dt>
            <dd className="font-medium">{new Date(health.timestamp).toLocaleString()}</dd>
          </div>
          <div className="rounded-lg border border-foreground/15 p-3">
            <dt className="text-foreground/70">Uptime</dt>
            <dd className="font-medium">{health.uptimeSeconds}s</dd>
          </div>
        </dl>
      )}

      <button
        type="button"
        onClick={() => void loadHealth()}
        className="rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium"
      >
        Refresh
      </button>
    </div>
  );
}
