import { NextResponse } from "next/server";

import { getHealthStatus } from "@/lib/server/services/health-service";

export async function GET() {
  return NextResponse.json(getHealthStatus());
}
