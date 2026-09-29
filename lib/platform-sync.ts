import { MapPlatform, PlatformType } from "@prisma/client";

export type NapPayload = { name: string; addressLine1: string; addressLine2?: string | null; city: string; state: string; postalCode: string; country: string; phone: string; websiteUrl?: string | null; primaryCategory?: string | null; hours?: unknown };
export type PlatformSyncResult = { remoteId: string; outcome: "UPDATED" | "QUEUED"; message?: string };

/** Platform adapters isolate each directory's different API shape and rate limits. */
export async function pushLocationToPlatform(platform: Pick<MapPlatform, "id" | "type" | "externalLocationId">, nap: NapPayload): Promise<PlatformSyncResult> {
  if (!platform.externalLocationId) throw new Error("No external listing ID is linked");
  void nap;
  switch (platform.type) {
    case PlatformType.GOOGLE:
      throw new Error("Google Business Profile publishing is not configured yet");
    case PlatformType.BING:
      throw new Error("Bing Places publishing requires an approved partner connection");
    default:
      return { remoteId: platform.externalLocationId, outcome: "QUEUED", message: "Queued for partner-feed or managed publishing" };
  }
}
