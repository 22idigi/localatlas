import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const updateTask = z.object({ status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "DISMISSED"]) });

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenant.canManageLocations) return NextResponse.json({ error: "You do not have permission to update tasks." }, { status: 403 });
  const parsed = updateTask.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid task status." }, { status: 422 });
  const { id } = await context.params;
  const existing = await prisma.optimizationTask.findFirst({ where: { id, organizationId: tenant.organization.id } });
  if (!existing) return NextResponse.json({ error: "Task not found." }, { status: 404 });

  const task = await prisma.$transaction(async (tx) => {
    const updated = await tx.optimizationTask.update({ where: { id }, data: { status: parsed.data.status, completedAt: parsed.data.status === "COMPLETED" ? new Date() : null } });
    await tx.activityLog.create({ data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "task.status_changed", entityType: "OptimizationTask", entityId: id, metadata: { from: existing.status, to: parsed.data.status } } });
    return updated;
  });
  return NextResponse.json({ task });
}
