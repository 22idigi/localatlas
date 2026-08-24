import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pushLocationToPlatform } from "@/lib/platform-sync";

const locationPatch = z.object({
  locationIds: z.array(z.string().cuid()).min(1).max(100),
  name: z.string().min(1).max(120).optional(), addressLine1: z.string().min(1).max(160).optional(),
  addressLine2: z.string().max(160).nullable().optional(), city: z.string().min(1).max(80).optional(),
  state: z.string().min(1).max(80).optional(), postalCode: z.string().min(1).max(20).optional(),
  country: z.string().length(2).optional(), phone: z.string().min(5).max(30).optional(),
  websiteUrl: z.string().url().nullable().optional(), primaryCategory: z.string().max(120).nullable().optional(),
  hours: z.record(z.array(z.object({ open: z.string(), close: z.string() }))).nullable().optional(),
  platforms: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = locationPatch.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid update", details: parsed.error.flatten() }, { status: 422 });
  const { locationIds, platforms, hours, ...locationData } = parsed.data;
  const updateData: Prisma.LocationUpdateInput = {
    ...locationData,
    ...(hours === null ? { hours: Prisma.JsonNull } : hours ? { hours: hours as Prisma.InputJsonValue } : {}),
  };
  const locations = await prisma.location.findMany({ where: { id: { in: locationIds }, userId: session.user.id }, include: { platforms: true } });
  if (locations.length !== locationIds.length) return NextResponse.json({ error: "One or more locations are unavailable" }, { status: 404 });

  await prisma.$transaction(locations.map((location) => prisma.location.update({ where: { id: location.id }, data: updateData })));
  const targets = locations.flatMap((location) => location.platforms.filter((platform) => !platforms || platforms.includes(platform.type)));
  const results = await Promise.allSettled(targets.map(async (platform) => {
    await prisma.mapPlatform.update({ where: { id: platform.id }, data: { syncState: "SYNCING", lastError: null } });
    const updated = { ...locations.find((x) => x.id === platform.locationId)!, ...locationData, ...(hours !== undefined ? { hours } : {}) };
    await pushLocationToPlatform(platform, updated);
    return prisma.mapPlatform.update({ where: { id: platform.id }, data: { syncState: "CONNECTED", lastSyncedAt: new Date() } });
  }));
  await Promise.all(results.map((result, index) => result.status === "rejected" ? prisma.mapPlatform.update({ where: { id: targets[index].id }, data: { syncState: "FAILED", lastError: result.reason instanceof Error ? result.reason.message : "Sync failed" } }) : Promise.resolve()));
  return NextResponse.json({ updated: locations.length, synced: results.filter((r) => r.status === "fulfilled").length, failed: results.filter((r) => r.status === "rejected").length });
}
