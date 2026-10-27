import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import MediaLibrary from "./media-library";
export default async function MediaPage() { const tenant = await getTenantContext(); if (!tenant) return null; const organizationId = tenant.organization.id; const [locations, media] = await Promise.all([prisma.location.findMany({ where: { organizationId }, select: { id: true, name: true } }), prisma.media.findMany({ where: { location: { organizationId } }, include: { location: { select: { name: true } } }, orderBy: { createdAt: "desc" } })]); return <MediaLibrary locations={locations} initialMedia={media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />; }
