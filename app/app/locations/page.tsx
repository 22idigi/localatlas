import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import LocationsManager from "./locations-manager";

export default async function ProductLocationsPage() {
  const tenant = await getTenantContext();
  if (!tenant) redirect("/login?callbackUrl=/app/locations");
  const locations = await prisma.location.findMany({
    where: { organizationId: tenant.organization.id },
    include: { platforms: { select: { type: true, syncState: true } }, _count: { select: { media: true, reviews: true, tasks: true } } },
    orderBy: { createdAt: "desc" },
  });
  return <LocationsManager canEdit={tenant.canManageLocations} initialLocations={locations.map((location) => ({ ...location, createdAt: location.createdAt.toISOString(), updatedAt: location.updatedAt.toISOString() }))} />;
}
