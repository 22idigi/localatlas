import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { pushGoogleBusinessLocation } from "@/lib/google-business-profile";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenant.canManageLocations) return NextResponse.json({ error: "You do not have permission to publish location changes" }, { status: 403 });
  const { id } = await context.params;
  const remote = await prisma.providerLocation.findFirst({ where: { id, organizationId: tenant.organization.id, provider: "GOOGLE_BUSINESS_PROFILE" }, include: { localLocation: true } });
  if (!remote?.localLocation) return NextResponse.json({ error: "Import this listing before publishing changes" }, { status: 409 });
  try {
    const result = await pushGoogleBusinessLocation(remote.externalLocationId, remote.localLocation);
    await prisma.mapPlatform.updateMany({ where: { locationId: remote.localLocation.id, type: "GOOGLE" }, data: { syncState: "CONNECTED", lastSyncedAt: new Date(), lastError: null } });
    await prisma.activityLog.create({ data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "google.location_published", entityType: "ProviderLocation", entityId: remote.id, metadata: { externalLocationId: remote.externalLocationId } } });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google publishing failed";
    await prisma.mapPlatform.updateMany({ where: { locationId: remote.localLocation.id, type: "GOOGLE" }, data: { syncState: "FAILED", lastError: message } });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
