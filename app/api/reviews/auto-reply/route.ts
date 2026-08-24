import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const input = z.object({ reviewId: z.string().cuid(), postNow: z.boolean().default(false) });
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  const review = await prisma.review.findFirst({ where: { id: parsed.data.reviewId, location: { userId: session.user.id } }, include: { location: true } });
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { brandVoice: true, supportEmail: true } });
  const requiresReview = review.rating <= 3;
  const system = requiresReview
    ? `Write an empathetic public reply to a negative customer review. Acknowledge the concern without admitting fault, invite offline resolution at ${user.supportEmail ?? "our support team"}, and never promise a refund. Brand voice: ${user.brandVoice}.`
    : `Write a warm, specific thank-you response to a positive review. Keep it under 70 words, never fabricate facts. Brand voice: ${user.brandVoice}.`;
  const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await ai.chat.completions.create({ model: process.env.OPENAI_REVIEW_MODEL ?? "gpt-4o-mini", temperature: 0.55, messages: [{ role: "system", content: system }, { role: "user", content: `Business: ${review.location.name}\nReviewer: ${review.authorName ?? "Customer"}\nRating: ${review.rating}/5\nReview: ${review.body ?? "No written review"}` }] });
  const response = completion.choices[0]?.message.content?.trim();
  if (!response) return NextResponse.json({ error: "AI did not return a response" }, { status: 502 });
  // Low ratings are always drafted for a human, regardless of client-provided postNow.
  const status = !requiresReview && parsed.data.postNow ? "POSTED" : requiresReview ? "NEEDS_REVIEW" : "DRAFTED";
  await prisma.review.update({ where: { id: review.id }, data: { response, responseStatus: status, respondedAt: status === "POSTED" ? new Date() : null } });
  // When status is POSTED, invoke the relevant platform adapter here and only mark POSTED after its success.
  return NextResponse.json({ reviewId: review.id, response, status, requiresHumanReview: requiresReview });
}
