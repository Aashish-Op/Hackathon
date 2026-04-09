export interface HealthResponse {
  status: "ok";
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
}
