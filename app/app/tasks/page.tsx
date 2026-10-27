import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import TasksBoard from "./tasks-board";

export default async function TasksPage() {
  const tenant = await getTenantContext();
  if (!tenant) redirect("/login?callbackUrl=/app/tasks");
  const tasks = await prisma.optimizationTask.findMany({
    where: { organizationId: tenant.organization.id },
    include: { location: { select: { name: true } }, finding: { select: { source: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return <TasksBoard canEdit={tenant.canManageLocations} initialTasks={tasks.map((task) => ({ ...task, createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString(), dueAt: task.dueAt?.toISOString() ?? null, completedAt: task.completedAt?.toISOString() ?? null }))} />;
}
