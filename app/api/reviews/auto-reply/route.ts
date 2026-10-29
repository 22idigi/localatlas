import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const input = z.object({ reviewId: z.string().cuid() });
export async function POST(request: NextRequest) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenant.canManageLocations) return NextResponse.json({ error: "You do not have permission to draft review replies." }, { status: 403 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  const review = await prisma.review.findFirst({ where: { id: parsed.data.reviewId, location: { organizationId: tenant.organization.id } }, include: { location: true } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: tenant.user.id }, select: { brandVoice: true, supportEmail: true } });
  const requiresReview = review.rating <= 3;
  const system = requiresReview
    ? `Write an empathetic public reply to a negative customer review. Acknowledge the concern without admitting fault, invite offline resolution at ${user.supportEmail ?? "our support team"}, and never promise a refund. Brand voice: ${user.brandVoice}.`
    : `Write a warm, specific thank-you response to a positive review. Keep it under 70 words, never fabricate facts. Brand voice: ${user.brandVoice}.`;
  const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await ai.chat.completions.create({ model: process.env.OPENAI_REVIEW_MODEL ?? "gpt-4o-mini", temperature: 0.55, messages: [{ role: "system", content: system }, { role: "user", content: `Business: ${review.location.name}\nReviewer: ${review.authorName ?? "Customer"}\nRating: ${review.rating}/5\nReview: ${review.body ?? "No written review"}` }] });
  const response = completion.choices[0]?.message.content?.trim();
  if (!response) return NextResponse.json({ error: "AI did not return a response" }, { status: 502 });
  // AI output is always a draft. Only a successful provider adapter may mark a reply POSTED.
  const status = requiresReview ? "NEEDS_REVIEW" : "DRAFTED";
  await prisma.review.update({ where: { id: review.id }, data: { response, responseStatus: status, respondedAt: null } });
  await prisma.activityLog.create({ data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "review.reply_drafted", entityType: "Review", entityId: review.id, metadata: { rating: review.rating, requiresHumanReview: requiresReview } } });
  return NextResponse.json({ reviewId: review.id, response, status, requiresHumanReview: requiresReview });
}
