import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const plans = {
  STARTER: { name: "Starter", amount: 249900, description: "One location workspace, profile audits and optimisation tasks", env: "RAZORPAY_PLAN_STARTER" },
  GROWTH: { name: "Growth", amount: 499900, description: "Up to three locations with guided provider onboarding", env: "RAZORPAY_PLAN_GROWTH" },
  AGENCY: { name: "Agency", amount: 1499900, description: "Five-location agency workspace with role-based access", env: "RAZORPAY_PLAN_AGENCY" },
} as const;

export function activeSubscription(userId: string) {
  return prisma.subscription.findFirst({ where: { userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.AUTHENTICATED] } }, orderBy: { updatedAt: "desc" } });
}
