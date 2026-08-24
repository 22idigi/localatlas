import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import MediaLibrary from "./media-library";
export default async function MediaPage() { const session = await auth(); if (!session?.user?.id) return null; const [locations, media] = await Promise.all([prisma.location.findMany({ where: { userId: session.user.id }, select: { id: true, name: true } }), prisma.media.findMany({ where: { location: { userId: session.user.id } }, include: { location: { select: { name: true } } }, orderBy: { createdAt: "desc" } })]); return <MediaLibrary locations={locations} initialMedia={media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />; }
