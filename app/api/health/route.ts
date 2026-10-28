import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const responseHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export async function GET() {
  try {
    const [health] = await prisma.$queryRaw<Array<{ databaseConnected: boolean; tenantReady: boolean }>>`
      SELECT
        TRUE AS "databaseConnected",
        (
          to_regclass('"Organization"') IS NOT NULL
          AND to_regclass('"Membership"') IS NOT NULL
          AND to_regclass('"AuditRun"') IS NOT NULL
          AND to_regclass('"OptimizationTask"') IS NOT NULL
        ) AS "tenantReady"
    `;

    const ready = Boolean(health?.databaseConnected && health?.tenantReady);
    return NextResponse.json(
      {
        status: ready ? "ok" : "degraded",
        database: health?.databaseConnected ? "connected" : "unavailable",
        schema: health?.tenantReady ? "tenant-foundation" : "incomplete",
      },
      { status: ready ? 200 : 503, headers: responseHeaders },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", database: "unavailable", schema: "unknown" },
      { status: 503, headers: responseHeaders },
    );
  }
}
