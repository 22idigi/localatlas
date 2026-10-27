import { NextRequest, NextResponse } from "next/server";
import { PlatformType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const createLocation = z.object({
  name: z.string().trim().min(2).max(120),
  addressLine1: z.string().trim().min(3).max(160),
  addressLine2: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().length(2).transform((value) => value.toUpperCase()).default("IN"),
  phone: z.string().trim().min(7).max(30),
  websiteUrl: z.union([z.string().url(), z.literal("")]).optional(),
  primaryCategory: z.string().trim().max(120).optional(),
  platforms: z.array(z.nativeEnum(PlatformType)).max(10).default([]),
});

export async function GET() {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const locations = await prisma.location.findMany({
    where: { organizationId: tenant.organization.id },
    include: { platforms: { select: { type: true, syncState: true, lastSyncedAt: true } }, _count: { select: { reviews: true, media: true, tasks: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ locations });
}

export async function POST(request: NextRequest) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenant.canManageLocations) return NextResponse.json({ error: "You do not have permission to add locations." }, { status: 403 });

  const parsed = createLocation.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Check the location details.", details: parsed.error.flatten() }, { status: 422 });
  const { platforms, websiteUrl, primaryCategory, ...details } = parsed.data;

  const location = await prisma.$transaction(async (tx) => {
    const created = await tx.location.create({
      data: {
        ...details,
        websiteUrl: websiteUrl || null,
        primaryCategory: primaryCategory || null,
        userId: tenant.user.id,
        organizationId: tenant.organization.id,
        platforms: { create: platforms.map((type) => ({ type, syncState: "DISCONNECTED" })) },
      },
      include: { platforms: true },
    });
    await tx.activityLog.create({
      data: {
        organizationId: tenant.organization.id,
        actorUserId: tenant.user.id,
        action: "location.created",
        entityType: "Location",
        entityId: created.id,
        metadata: { source: "manual", requestedPlatforms: platforms },
      },
    });
    return created;
  });
  return NextResponse.json({ location }, { status: 201 });
}
