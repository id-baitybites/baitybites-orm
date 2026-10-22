import { NextResponse } from "next/server";
import { getSystemSlaHealth } from "@/lib/sla-monitor";

export const dynamic = "force-dynamic";

/**
 * Public Health & SLA Monitoring Endpoint
 * Dapat di-ping oleh BetterStack, UptimeRobot, Datadog, atau monitor internal platform.
 */
export async function GET() {
  try {
    const health = await getSystemSlaHealth();
    const httpStatus = health.overallStatus === "OUTAGE" ? 503 : 200;

    return NextResponse.json(
      {
        status: health.overallStatus,
        uptime_sla: `${health.platformSla}%`,
        sla_compliant: health.isCompliant,
        guaranteed_sla: `${health.enterpriseSlaGuaranteed}%`,
        timestamp: health.timestamp,
        services: health.components,
      },
      { status: httpStatus }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "OUTAGE",
        error: err?.message || "Health check execution failure",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
