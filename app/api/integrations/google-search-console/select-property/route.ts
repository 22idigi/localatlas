import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const propertyId = form.get("propertyId");
  if (typeof propertyId !== "string") return NextResponse.json({ error: "Property is required" }, { status: 422 });
  const property = await prisma.searchConsoleProperty.findFirst({ where: { id: propertyId, organizationId: tenant.organization.id } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.searchConsoleProperty.updateMany({ where: { organizationId: tenant.organization.id }, data: { selected: false } }),
    prisma.searchConsoleProperty.update({ where: { id: property.id }, data: { selected: true } }),
    prisma.activityLog.create({ data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "integration.gsc_property_selected", entityType: "SearchConsoleProperty", entityId: property.id, metadata: { siteUrl: property.siteUrl } } }),
  ]);
  return NextResponse.redirect(new URL("/app/search-console", request.url), 303);
}
