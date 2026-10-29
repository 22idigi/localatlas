import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { evaluateProfile } from "@/lib/local-audit";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";
const input = z.object({ locationId: z.string().cuid() });

export async function POST(request: NextRequest) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenant.canManageLocations) return NextResponse.json({ error: "You do not have permission to run audits." }, { status: 403 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid location." }, { status: 422 });

  const location = await prisma.location.findFirst({
    where: { id: parsed.data.locationId, organizationId: tenant.organization.id },
    include: { platforms: { select: { syncState: true, externalLocationId: true } }, media: { select: { id: true } } },
  });
  if (!location) return NextResponse.json({ error: "Location not found." }, { status: 404 });

  const result = evaluateProfile(location);
  const run = await prisma.$transaction(async (tx) => {
    const auditRun = await tx.auditRun.create({
      data: {
        organizationId: tenant.organization.id,
        locationId: location.id,
        status: "COMPLETED",
        score: result.inputCoverage >= 70 ? result.score : null,
        inputCoverage: result.inputCoverage,
        methodologyVersion: result.methodologyVersion,
        sourceSummary: result.sourceSummary as Prisma.InputJsonValue,
        completedAt: new Date(),
        findings: {
          create: result.findings.map(({ priority: _priority, effort: _effort, ...finding }) => finding),
        },
      },
      include: { findings: true },
    });
    const failed = result.findings.filter((finding) => !finding.passed);
    for (const finding of failed) {
      const storedFinding = auditRun.findings.find((item) => item.code === finding.code);
      if (!storedFinding) continue;
      await tx.optimizationTask.upsert({
        where: { findingId: storedFinding.id },
        update: { title: finding.title, reason: finding.detail, priority: finding.priority, effort: finding.effort },
        create: {
          organizationId: tenant.organization.id,
          locationId: location.id,
          findingId: storedFinding.id,
          title: finding.title,
          reason: finding.detail,
          priority: finding.priority,
          effort: finding.effort,
        },
      });
    }
    await tx.activityLog.create({
      data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "audit.completed", entityType: "AuditRun", entityId: auditRun.id, metadata: { score: auditRun.score, methodology: auditRun.methodologyVersion } },
    });
    return auditRun;
  });

  return NextResponse.json({
    audit: { id: run.id, score: run.score, inputCoverage: run.inputCoverage, methodologyVersion: run.methodologyVersion },
    findings: result.findings,
    tasksCreated: result.findings.filter((finding) => !finding.passed).length,
    disclaimer: "This is an 11i Maps profile-completeness score, not an official Google ranking score.",
  }, { status: 201 });
}
