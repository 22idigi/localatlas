import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { syncSearchConsoleProperties } from "@/lib/google-search-console";

export async function POST(request: NextRequest) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const connection = await prisma.integrationConnection.findUnique({ where: { organizationId_provider: { organizationId: tenant.organization.id, provider: "GOOGLE_SEARCH_CONSOLE" } } });
  if (!connection) return NextResponse.redirect(new URL("/app/integrations?error=gsc_not_connected", request.url), 303);
  try {
    await syncSearchConsoleProperties(connection.id, tenant.organization.id);
    return NextResponse.redirect(new URL("/app/search-console?synced=1", request.url), 303);
  } catch {
    return NextResponse.redirect(new URL("/app/integrations?error=gsc_property_sync", request.url), 303);
  }
}
