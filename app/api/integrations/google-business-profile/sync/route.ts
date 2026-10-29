import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { discoverBusinessProfileLocations } from "@/lib/google-business-profile";

export const dynamic = "force-dynamic";
export async function POST() {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const connection = await prisma.integrationConnection.findUnique({ where: { organizationId_provider: { organizationId: tenant.organization.id, provider: "GOOGLE_BUSINESS_PROFILE" } } });
  if (!connection) return NextResponse.json({ error: "Connect Google Business Profile first" }, { status: 409 });
  try { return NextResponse.json(await discoverBusinessProfileLocations(connection.id, tenant.organization.id)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Google refresh failed" }, { status: 502 }); }
}
