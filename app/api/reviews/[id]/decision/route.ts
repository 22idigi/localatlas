import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const input = z.object({ decision: z.enum(["APPROVE_DRAFT", "IGNORE"]) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenant.canManageLocations) {
    return NextResponse.json({ error: "You do not have permission to review replies." }, { status: 403 });
  }

  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid review decision." }, { status: 422 });
  const { id } = await context.params;
  const review = await prisma.review.findFirst({
    where: { id, location: { organizationId: tenant.organization.id } },
    select: { id: true, response: true, responseStatus: true, rating: true },
  });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  if (review.responseStatus !== "NEEDS_REVIEW") {
    return NextResponse.json({ error: "This reply is no longer awaiting a decision." }, { status: 409 });
  }
  if (parsed.data.decision === "APPROVE_DRAFT" && !review.response?.trim()) {
    return NextResponse.json({ error: "There is no reply draft to approve." }, { status: 409 });
  }

  const nextStatus = parsed.data.decision === "APPROVE_DRAFT" ? "DRAFTED" : "IGNORED";
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.review.update({ where: { id }, data: { responseStatus: nextStatus } });
    await tx.activityLog.create({
      data: {
        organizationId: tenant.organization.id,
        actorUserId: tenant.user.id,
        action: parsed.data.decision === "APPROVE_DRAFT" ? "review.reply_approved" : "review.reply_ignored",
        entityType: "Review",
        entityId: id,
        metadata: { rating: review.rating, providerPostAttempted: false },
      },
    });
    return result;
  });

  return NextResponse.json({ review: { id: updated.id, responseStatus: updated.responseStatus } });
}
