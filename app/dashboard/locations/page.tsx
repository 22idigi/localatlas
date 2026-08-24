import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LocationsConsole from "./locations-console";

export default async function LocationsPage() {
  const session = await auth();
  if (!session?.user?.id) return <main className="grid min-h-screen place-items-center text-sm text-zinc-500">Sign in to manage your locations.</main>;
  const locations = await prisma.location.findMany({
    where: { userId: session.user.id },
    include: { platforms: { select: { id: true, type: true, syncState: true, lastSyncedAt: true, lastError: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return <LocationsConsole locations={locations.map((location) => ({ ...location, updatedAt: location.updatedAt.toISOString(), platforms: location.platforms.map((p) => ({ ...p, lastSyncedAt: p.lastSyncedAt?.toISOString() ?? null })) }))} />;
}
