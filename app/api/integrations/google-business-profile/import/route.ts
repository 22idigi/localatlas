import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTenantContext } from "@/lib/tenant";
import { importProviderLocations } from "@/lib/google-business-profile";
import { prisma } from "@/lib/prisma";

const input = z.object({ providerLocationIds: z.array(z.string().cuid()).min(1).max(200) });
export async function POST(request: NextRequest) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenant.canManageLocations) return NextResponse.json({ error: "You do not have permission to import locations" }, { status: 403 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Select between 1 and 200 locations" }, { status: 422 });
  const result = await importProviderLocations(parsed.data.providerLocationIds, tenant.organization.id, tenant.user.id);
  await prisma.activityLog.create({ data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "google.locations_imported", entityType: "ProviderLocation", metadata: result } });
  return NextResponse.json(result);
}
