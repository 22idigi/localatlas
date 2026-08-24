import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const plans = {
  STARTER: { name: "Starter", amount: 249900, description: "One location, listings sync and review inbox", env: "RAZORPAY_PLAN_STARTER" },
  GROWTH: { name: "Growth", amount: 499900, description: "Up to three locations, reviews and local SEO drafts", env: "RAZORPAY_PLAN_GROWTH" },
  AGENCY: { name: "Agency", amount: 1499900, description: "Five locations, client-ready workflow and priority support", env: "RAZORPAY_PLAN_AGENCY" },
} as const;

export function activeSubscription(userId: string) {
  return prisma.subscription.findFirst({ where: { userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.AUTHENTICATED] } }, orderBy: { updatedAt: "desc" } });
}
