import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import ReviewsInbox from "./reviews-inbox";
export default async function ReviewsPage() { const tenant = await getTenantContext(); if (!tenant) return null; const reviews = await prisma.review.findMany({ where: { location: { organizationId: tenant.organization.id } }, include: { location: { select: { name: true } }, mapPlatform: { select: { type: true } } }, orderBy: { publishedAt: "desc" }, take: 100 }); return <ReviewsInbox reviews={reviews.map((r) => ({ ...r, publishedAt: r.publishedAt.toISOString(), respondedAt: r.respondedAt?.toISOString() ?? null }))} />; }
