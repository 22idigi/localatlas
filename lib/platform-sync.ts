import { MapPlatform, PlatformType } from "@prisma/client";

export type NapPayload = { name: string; addressLine1: string; addressLine2?: string | null; city: string; state: string; postalCode: string; country: string; phone: string; websiteUrl?: string | null; primaryCategory?: string | null; hours?: unknown };

/** Platform adapters isolate each directory's different API shape and rate limits. */
export async function pushLocationToPlatform(platform: Pick<MapPlatform, "id" | "type" | "externalLocationId">, nap: NapPayload) {
  if (!platform.externalLocationId) throw new Error("No external listing ID is linked");
  switch (platform.type) {
    case PlatformType.GOOGLE:
      // Call Business Profile v1 locations.patch here using a decrypted Google token.
      // updateMask should be restricted to changed fields for idempotent syncs.
      return { remoteId: platform.externalLocationId };
    case PlatformType.BING:
      // Bing Places updates use the Microsoft/Bing partner endpoint and its account mapping.
      return { remoteId: platform.externalLocationId };
    default:
      // Directories without write APIs are queued for partner/feed/manual publishing.
      return { remoteId: platform.externalLocationId, queued: true };
  }
}
