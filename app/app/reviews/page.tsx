import { redirect } from "next/navigation";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { ReviewsManager } from "./reviews-manager";

export default async function ReviewsPage() {
  const tenant = await getTenantContext(); if (!tenant) redirect("/login?callbackUrl=/app/reviews");
  const reviews = await prisma.review.findMany({ where: { location: { organizationId: tenant.organization.id } }, include: { location: { select: { name: true } } }, orderBy: { publishedAt: "desc" }, take: 100 });
  return <main className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10"><header><p className="text-sm font-semibold text-blue-700">Review inbox</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Respond quickly without losing human judgement.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Positive reviews get warm brand-safe drafts. Ratings of three stars or below always stop for human approval before a reply can be published.</p></header><ReviewsManager initial={reviews.map((item) => ({ id: item.id, authorName: item.authorName, rating: item.rating, body: item.body, response: item.response, responseStatus: item.responseStatus, publishedAt: item.publishedAt.toISOString(), location: item.location }))} /></main>;
}
