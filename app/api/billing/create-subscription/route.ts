import { NextRequest, NextResponse } from "next/server";
import { SubscriptionPlan } from "@prisma/client";
import { auth } from "@/auth";
import { plans } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

const planNames = Object.keys(plans) as SubscriptionPlan[];
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) return NextResponse.json({ error: "Please sign in before choosing a plan." }, { status: 401 });
  const { plan } = await request.json() as { plan?: SubscriptionPlan };
  if (!plan || !planNames.includes(plan)) return NextResponse.json({ error: "Unknown plan" }, { status: 422 });
  const selected = plans[plan]; const planId = process.env[selected.env];
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !planId) return NextResponse.json({ error: "Billing is not configured yet. Contact sales." }, { status: 503 });
  const basic = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/subscriptions", { method: "POST", headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/json" }, body: JSON.stringify({ plan_id: planId, total_count: 120, quantity: 1, customer_notify: true, notes: { localatlas_user_id: session.user.id, plan } }) });
  if (!response.ok) return NextResponse.json({ error: "Could not start Razorpay checkout" }, { status: 502 });
  const subscription = await response.json() as { id: string; status: "created"; short_url?: string };
  await prisma.subscription.upsert({ where: { razorpaySubscriptionId: subscription.id }, create: { userId: session.user.id, plan, razorpayPlanId: planId, razorpaySubscriptionId: subscription.id }, update: { plan, razorpayPlanId: planId } });
  return NextResponse.json({ subscriptionId: subscription.id, keyId: process.env.RAZORPAY_KEY_ID, name: "LocalAtlas", description: selected.description, prefill: { email: session.user.email, name: session.user.name ?? "" } });
}
