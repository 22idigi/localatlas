import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

const input = z.object({
  brandVoice: z.string().trim().min(3).max(500),
  supportEmail: z.union([z.string().trim().email(), z.literal("")]),
});

export async function PATCH(request: NextRequest) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Check the brand voice and support email." }, { status: 422 });
  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({ where: { id: tenant.user.id }, data: { brandVoice: parsed.data.brandVoice, supportEmail: parsed.data.supportEmail || null }, select: { brandVoice: true, supportEmail: true } });
    await tx.activityLog.create({ data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "profile.preferences_updated", entityType: "User", entityId: tenant.user.id } });
    return updated;
  });
  return NextResponse.json({ user });
}
