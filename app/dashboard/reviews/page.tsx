import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ReviewsInbox from "./reviews-inbox";
export default async function ReviewsPage() { const session = await auth(); if (!session?.user?.id) return null; const reviews = await prisma.review.findMany({ where: { location: { userId: session.user.id } }, include: { location: { select: { name: true } }, mapPlatform: { select: { type: true } } }, orderBy: { publishedAt: "desc" }, take: 100 }); return <ReviewsInbox reviews={reviews.map((r) => ({ ...r, publishedAt: r.publishedAt.toISOString(), respondedAt: r.respondedAt?.toISOString() ?? null }))} />; }
