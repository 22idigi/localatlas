import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/token-crypto";

export const googleBusinessProfileScope = "https://www.googleapis.com/auth/business.manage";
const accountApi = "https://mybusinessaccountmanagement.googleapis.com/v1";
const informationApi = "https://mybusinessbusinessinformation.googleapis.com/v1";

type GoogleAccount = { name: string; accountName?: string; type?: string; role?: string; verificationState?: string; permissionLevel?: string };
type GoogleAddress = { addressLines?: string[]; locality?: string; administrativeArea?: string; postalCode?: string; regionCode?: string };
type GoogleLocation = {
  name: string; title?: string; storeCode?: string; websiteUri?: string;
  phoneNumbers?: { primaryPhone?: string; additionalPhones?: string[] };
  storefrontAddress?: GoogleAddress;
  categories?: { primaryCategory?: { name?: string; displayName?: string } };
  regularHours?: unknown; metadata?: Record<string, unknown>;
};

function credentials() {
  const clientId = process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google Business Profile OAuth is not configured");
  return { clientId, clientSecret };
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.error?.message ?? payload?.error_description ?? `Google Business Profile request failed (${response.status})`;
    const error = new Error(detail) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function normalizeGoogleLocation(location: GoogleLocation) {
  const address = location.storefrontAddress ?? {};
  return {
    externalLocationId: location.name,
    title: location.title?.trim() || "Untitled Google location",
    storeCode: location.storeCode ?? null,
    primaryCategory: location.categories?.primaryCategory?.displayName ?? location.categories?.primaryCategory?.name ?? null,
    phone: location.phoneNumbers?.primaryPhone ?? null,
    websiteUrl: location.websiteUri ?? null,
    address: {
      addressLine1: address.addressLines?.[0] ?? "",
      addressLine2: address.addressLines?.slice(1).join(", ") || null,
      city: address.locality ?? "",
      state: address.administrativeArea ?? "",
      postalCode: address.postalCode ?? "",
      country: address.regionCode ?? "US",
    },
    regularHours: location.regularHours ?? null,
    metadata: location.metadata ?? {},
  };
}

export function canonicalToGooglePayload(nap: {
  name: string; addressLine1: string; addressLine2?: string | null; city: string; state: string;
  postalCode: string; country: string; phone: string; websiteUrl?: string | null; hours?: unknown;
}) {
  const payload: Record<string, unknown> = {
    title: nap.name,
    storefrontAddress: {
      addressLines: [nap.addressLine1, nap.addressLine2].filter(Boolean),
      locality: nap.city,
      administrativeArea: nap.state,
      postalCode: nap.postalCode,
      regionCode: nap.country,
    },
    phoneNumbers: { primaryPhone: nap.phone },
    websiteUri: nap.websiteUrl || undefined,
  };
  const masks = ["title", "storefrontAddress", "phoneNumbers", "websiteUri"];
  if (nap.hours && typeof nap.hours === "object") {
    payload.regularHours = nap.hours;
    masks.push("regularHours");
  }
  return { payload, updateMask: masks.join(",") };
}

export async function getBusinessProfileAccessToken(connectionId: string, organizationId: string) {
  const connection = await prisma.integrationConnection.findFirst({
    where: { id: connectionId, organizationId, provider: "GOOGLE_BUSINESS_PROFILE" },
  });
  if (!connection?.encryptedAccessToken) throw new Error("Google Business Profile is not connected");
  if (connection.accessTokenExpiresAt && connection.accessTokenExpiresAt.getTime() > Date.now() + 120_000) {
    return decryptToken(connection.encryptedAccessToken);
  }
  if (!connection.encryptedRefreshToken) throw new Error("Google access expired. Reconnect Business Profile.");
  const { clientId, clientSecret } = credentials();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: decryptToken(connection.encryptedRefreshToken), grant_type: "refresh_token" }),
    cache: "no-store",
  });
  const token = await readJson(response) as { access_token: string; expires_in?: number; scope?: string };
  await prisma.integrationConnection.update({ where: { id: connection.id }, data: {
    encryptedAccessToken: encryptToken(token.access_token),
    accessTokenExpiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000),
    scopes: token.scope?.split(" ") ?? connection.scopes,
    lastError: null,
  } });
  return token.access_token;
}

async function googleGet(url: string, accessToken: string) {
  return readJson(await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }));
}

export async function discoverBusinessProfileLocations(connectionId: string, organizationId: string) {
  try {
    const token = await getBusinessProfileAccessToken(connectionId, organizationId);
    const accounts: GoogleAccount[] = [];
    let accountPage: string | undefined;
    do {
      const url = new URL(`${accountApi}/accounts`);
      url.searchParams.set("pageSize", "20");
      if (accountPage) url.searchParams.set("pageToken", accountPage);
      const data = await googleGet(url.toString(), token) as { accounts?: GoogleAccount[]; nextPageToken?: string };
      accounts.push(...(data.accounts ?? []));
      accountPage = data.nextPageToken;
    } while (accountPage);

    let locationCount = 0;
    for (const account of accounts) {
      const providerAccount = await prisma.providerAccount.upsert({
        where: { connectionId_externalAccountId: { connectionId, externalAccountId: account.name } },
        update: { displayName: account.accountName ?? account.name, accountType: account.type, role: account.role ?? account.permissionLevel, verificationState: account.verificationState, lastDiscoveredAt: new Date() },
        create: { organizationId, connectionId, provider: "GOOGLE_BUSINESS_PROFILE", externalAccountId: account.name, displayName: account.accountName ?? account.name, accountType: account.type, role: account.role ?? account.permissionLevel, verificationState: account.verificationState },
      });
      let locationPage: string | undefined;
      do {
        const url = new URL(`${informationApi}/${account.name}/locations`);
        url.searchParams.set("pageSize", "100");
        url.searchParams.set("readMask", "name,title,storeCode,phoneNumbers,websiteUri,regularHours,categories,storefrontAddress,metadata");
        if (locationPage) url.searchParams.set("pageToken", locationPage);
        const data = await googleGet(url.toString(), token) as { locations?: GoogleLocation[]; nextPageToken?: string };
        for (const remote of data.locations ?? []) {
          const normalized = normalizeGoogleLocation(remote);
          await prisma.providerLocation.upsert({
            where: { connectionId_externalLocationId: { connectionId, externalLocationId: normalized.externalLocationId } },
            update: { providerAccountId: providerAccount.id, title: normalized.title, storeCode: normalized.storeCode, primaryCategory: normalized.primaryCategory, phone: normalized.phone, websiteUrl: normalized.websiteUrl, address: normalized.address, regularHours: normalized.regularHours === null ? Prisma.JsonNull : normalized.regularHours as Prisma.InputJsonValue, metadata: normalized.metadata as Prisma.InputJsonValue, syncState: "CONNECTED", lastReadAt: new Date(), lastError: null },
            create: { organizationId, connectionId, providerAccountId: providerAccount.id, provider: "GOOGLE_BUSINESS_PROFILE", ...normalized, address: normalized.address, regularHours: normalized.regularHours === null ? Prisma.JsonNull : normalized.regularHours as Prisma.InputJsonValue, metadata: normalized.metadata as Prisma.InputJsonValue, syncState: "CONNECTED", lastReadAt: new Date() },
          });
          locationCount += 1;
        }
        locationPage = data.nextPageToken;
      } while (locationPage);
    }
    await prisma.integrationConnection.update({ where: { id: connectionId }, data: { status: "CONNECTED", lastSyncedAt: new Date(), lastError: null, metadata: { accountCount: accounts.length, locationCount } } });
    return { accountCount: accounts.length, locationCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google Business Profile discovery failed";
    const status = (error as Error & { status?: number }).status === 403 ? "PENDING_APPROVAL" : "ERROR";
    await prisma.integrationConnection.update({ where: { id: connectionId }, data: { status, lastError: message } }).catch(() => undefined);
    throw error;
  }
}

export async function importProviderLocations(providerLocationIds: string[], organizationId: string, userId: string) {
  const remotes = await prisma.providerLocation.findMany({ where: { id: { in: providerLocationIds }, organizationId, provider: "GOOGLE_BUSINESS_PROFILE" } });
  const imported: string[] = [];
  for (const remote of remotes) {
    if (remote.localLocationId) { imported.push(remote.localLocationId); continue; }
    const address = (remote.address ?? {}) as Record<string, string | null>;
    const location = await prisma.location.create({ data: {
      userId, organizationId, name: remote.title,
      addressLine1: address.addressLine1 ?? "", addressLine2: address.addressLine2,
      city: address.city ?? "", state: address.state ?? "", postalCode: address.postalCode ?? "",
      country: address.country ?? "US", phone: remote.phone ?? "", websiteUrl: remote.websiteUrl,
      primaryCategory: remote.primaryCategory, hours: remote.regularHours ?? Prisma.JsonNull,
      platforms: { create: { type: "GOOGLE", externalLocationId: remote.externalLocationId, syncState: "CONNECTED", lastSyncedAt: remote.lastReadAt } },
    } });
    await prisma.providerLocation.update({ where: { id: remote.id }, data: { localLocationId: location.id } });
    imported.push(location.id);
  }
  return { requested: providerLocationIds.length, imported: imported.length, locationIds: imported };
}

export async function pushGoogleBusinessLocation(externalLocationId: string, nap: Parameters<typeof canonicalToGooglePayload>[0]) {
  const remote = await prisma.providerLocation.findFirst({ where: { externalLocationId, provider: "GOOGLE_BUSINESS_PROFILE", localLocationId: { not: null } } });
  if (!remote) throw new Error("This Google listing is not linked to an imported 11i location");
  const token = await getBusinessProfileAccessToken(remote.connectionId, remote.organizationId);
  const { payload, updateMask } = canonicalToGooglePayload(nap);
  const url = new URL(`${informationApi}/${externalLocationId}`);
  url.searchParams.set("updateMask", updateMask);
  try {
    await readJson(await fetch(url.toString(), { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" }));
    await prisma.providerLocation.update({ where: { id: remote.id }, data: { syncState: "CONNECTED", lastWrittenAt: new Date(), lastError: null } });
    return { remoteId: externalLocationId, outcome: "UPDATED" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google update failed";
    await prisma.providerLocation.update({ where: { id: remote.id }, data: { syncState: "FAILED", lastError: message } });
    throw error;
  }
}

const ratingValue: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

export async function syncGoogleBusinessReviews(connectionId: string, organizationId: string) {
  const token = await getBusinessProfileAccessToken(connectionId, organizationId);
  const remotes = await prisma.providerLocation.findMany({ where: { connectionId, organizationId, localLocationId: { not: null } }, include: { providerAccount: true } });
  let reviewCount = 0;
  for (const remote of remotes) {
    const localLocationId = remote.localLocationId!;
    const platform = await prisma.mapPlatform.upsert({ where: { locationId_type: { locationId: localLocationId, type: "GOOGLE" } }, update: { externalLocationId: remote.externalLocationId }, create: { locationId: localLocationId, type: "GOOGLE", externalLocationId: remote.externalLocationId, syncState: "CONNECTED" } });
    let pageToken: string | undefined;
    do {
      const url = new URL(`https://mybusiness.googleapis.com/v4/${remote.providerAccount.externalAccountId}/${remote.externalLocationId}/reviews`);
      url.searchParams.set("pageSize", "50");
      url.searchParams.set("orderBy", "updateTime desc");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const data = await googleGet(url.toString(), token) as { reviews?: Array<{ reviewId: string; reviewer?: { displayName?: string; isAnonymous?: boolean }; starRating?: string; comment?: string; createTime?: string; reviewReply?: { comment?: string; updateTime?: string } }>; nextPageToken?: string };
      for (const item of data.reviews ?? []) {
        const posted = Boolean(item.reviewReply?.comment);
        await prisma.review.upsert({ where: { mapPlatformId_externalReviewId: { mapPlatformId: platform.id, externalReviewId: item.reviewId } }, update: { authorName: item.reviewer?.isAnonymous ? null : item.reviewer?.displayName, rating: ratingValue[item.starRating ?? ""] ?? 0, body: item.comment, publishedAt: item.createTime ? new Date(item.createTime) : new Date(), ...(posted ? { response: item.reviewReply?.comment, responseStatus: "POSTED" as const, respondedAt: item.reviewReply?.updateTime ? new Date(item.reviewReply.updateTime) : new Date() } : {}) }, create: { locationId: localLocationId, mapPlatformId: platform.id, externalReviewId: item.reviewId, authorName: item.reviewer?.isAnonymous ? null : item.reviewer?.displayName, rating: ratingValue[item.starRating ?? ""] ?? 0, body: item.comment, publishedAt: item.createTime ? new Date(item.createTime) : new Date(), response: item.reviewReply?.comment, responseStatus: posted ? "POSTED" : "PENDING", respondedAt: posted ? item.reviewReply?.updateTime ? new Date(item.reviewReply.updateTime) : new Date() : null } });
        reviewCount += 1;
      }
      pageToken = data.nextPageToken;
    } while (pageToken);
  }
  await prisma.integrationConnection.update({ where: { id: connectionId }, data: { lastSyncedAt: new Date(), lastError: null } });
  return { locationsChecked: remotes.length, reviewCount };
}

export async function publishGoogleReviewReply(reviewId: string, organizationId: string) {
  const review = await prisma.review.findFirst({ where: { id: reviewId, location: { organizationId }, mapPlatform: { type: "GOOGLE" } }, include: { mapPlatform: true } });
  if (!review?.response?.trim()) throw new Error("Create and approve a reply before publishing");
  if (review.responseStatus !== "DRAFTED") throw new Error("This reply must be approved before publishing");
  const remote = await prisma.providerLocation.findFirst({ where: { organizationId, externalLocationId: review.mapPlatform.externalLocationId ?? "", provider: "GOOGLE_BUSINESS_PROFILE" }, include: { providerAccount: true } });
  if (!remote) throw new Error("The Google location connection could not be found");
  const token = await getBusinessProfileAccessToken(remote.connectionId, organizationId);
  const url = `https://mybusiness.googleapis.com/v4/${remote.providerAccount.externalAccountId}/${remote.externalLocationId}/reviews/${review.externalReviewId}/reply`;
  await readJson(await fetch(url, { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ comment: review.response.trim() }), cache: "no-store" }));
  return prisma.review.update({ where: { id: review.id }, data: { responseStatus: "POSTED", respondedAt: new Date() } });
}
