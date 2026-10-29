import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { publishGoogleReviewReply } from "@/lib/google-business-profile";
import { prisma } from "@/lib/prisma";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenant.canManageLocations) return NextResponse.json({ error: "You do not have permission to publish replies" }, { status: 403 });
  const { id } = await context.params;
  try {
    const review = await publishGoogleReviewReply(id, tenant.organization.id);
    await prisma.activityLog.create({ data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "review.reply_published", entityType: "Review", entityId: id, metadata: { provider: "GOOGLE" } } });
    return NextResponse.json({ reviewId: review.id, status: review.responseStatus });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Reply publishing failed" }, { status: 502 }); }
}
