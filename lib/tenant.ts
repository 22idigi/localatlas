import type { MembershipRole } from "@prisma/client";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const locationEditors = new Set<MembershipRole>([
  "PLATFORM_SUPER_ADMIN",
  "AGENCY_OWNER",
  "AGENCY_ADMIN",
  "BUSINESS_OWNER",
  "LOCATION_MANAGER",
  "SEO_SPECIALIST",
]);

function workspaceName(name?: string | null, email?: string | null) {
  if (name?.trim()) return `${name.trim()}'s workspace`;
  if (email?.includes("@")) return `${email.split("@")[0]}'s workspace`;
  return "11i Maps workspace";
}

export async function ensurePrimaryWorkspace(user: { id: string; name?: string | null; email?: string | null }) {
  const existing = await prisma.membership.findFirst({
    where: { userId: user.id, status: "ACTIVE" },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  const organizationId = `org_${user.id}`;
  const organization = await prisma.organization.upsert({
    where: { id: organizationId },
    update: {},
    create: {
      id: organizationId,
      name: workspaceName(user.name, user.email),
      slug: `workspace-${user.id.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`,
    },
  });
  const membership = await prisma.membership.upsert({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    update: { status: "ACTIVE" },
    create: { organizationId, userId: user.id, role: "BUSINESS_OWNER" },
    include: { organization: true },
  });

  await prisma.location.updateMany({
    where: { userId: user.id, organizationId: { not: organization.id } },
    data: { organizationId: organization.id },
  });
  return membership;
}

export const getTenantContext = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  const membership = await ensurePrimaryWorkspace(session.user);
  return {
    user: session.user,
    organization: membership.organization,
    membership,
    canManageLocations: locationEditors.has(membership.role),
    isPlatformAdmin: membership.role === "PLATFORM_SUPER_ADMIN",
  };
});

export function canEditLocations(role: MembershipRole) {
  return locationEditors.has(role);
}
