import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import OperationsWorkbench from "./operations-workbench";

export default async function OperationsPage() {
  const tenant = await getTenantContext();
  if (!tenant) redirect("/login?callbackUrl=/app/operations");
  const organizationId = tenant.organization.id;

  const [auditRuns, openTasks, completedTasks, connectedProfiles, selectedProperties, approvals, activity] = await Promise.all([
    prisma.auditRun.count({ where: { organizationId } }),
    prisma.optimizationTask.count({ where: { organizationId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.optimizationTask.count({ where: { organizationId, status: "COMPLETED" } }),
    prisma.mapPlatform.count({ where: { location: { organizationId }, syncState: "CONNECTED" } }),
    prisma.searchConsoleProperty.count({ where: { organizationId, selected: true } }),
    prisma.review.findMany({
      where: { location: { organizationId }, responseStatus: "NEEDS_REVIEW" },
      include: {
        location: { select: { name: true } },
        mapPlatform: { select: { type: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: 20,
    }),
    prisma.activityLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);

  return (
    <OperationsWorkbench
      canApprove={tenant.canManageLocations}
      counts={{ auditRuns, openTasks, completedTasks, connectedProfiles, selectedProperties }}
      initialApprovals={approvals.map((review) => ({
        id: review.id,
        authorName: review.authorName,
        rating: review.rating,
        body: review.body,
        response: review.response,
        publishedAt: review.publishedAt.toISOString(),
        locationName: review.location.name,
        platform: review.mapPlatform.type,
      }))}
      activity={activity.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        createdAt: item.createdAt.toISOString(),
      }))}
    />
  );
}
