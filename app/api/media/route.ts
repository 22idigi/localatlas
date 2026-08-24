import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
const body = z.object({ locationId: z.string().cuid(), url: z.string().url(), publicId: z.string().max(200).optional(), kind: z.enum(["LOGO", "COVER", "STOREFRONT", "INTERIOR", "PRODUCT", "TEAM", "OTHER"]).default("OTHER"), altText: z.string().max(300).optional() });
export async function POST(request: NextRequest) { const session = await auth(); if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const parsed = body.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Invalid media record" }, { status: 422 }); const location = await prisma.location.findFirst({ where: { id: parsed.data.locationId, userId: session.user.id } }); if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 }); const media = await prisma.media.create({ data: parsed.data }); return NextResponse.json(media, { status: 201 }); }
