import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/token-crypto";

const readonlyScope = "https://www.googleapis.com/auth/webmasters.readonly";
const apiBase = "https://www.googleapis.com/webmasters/v3";

export const googleSearchConsoleScope = readonlyScope;

function credentials() {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google Search Console OAuth is not configured");
  return { clientId, clientSecret };
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.error?.message ?? payload?.error_description ?? `Google API request failed (${response.status})`;
    throw new Error(detail);
  }
  return payload;
}

export async function getSearchConsoleAccessToken(connectionId: string, organizationId: string) {
  const connection = await prisma.integrationConnection.findFirst({ where: { id: connectionId, organizationId, provider: "GOOGLE_SEARCH_CONSOLE" } });
  if (!connection?.encryptedAccessToken) throw new Error("Search Console is not connected");
  if (connection.accessTokenExpiresAt && connection.accessTokenExpiresAt.getTime() > Date.now() + 120_000) {
    return decryptToken(connection.encryptedAccessToken);
  }
  if (!connection.encryptedRefreshToken) throw new Error("Google access expired. Reconnect Search Console.");

  const { clientId, clientSecret } = credentials();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: decryptToken(connection.encryptedRefreshToken),
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  const token = await readJson(response) as { access_token: string; expires_in?: number; scope?: string };
  await prisma.integrationConnection.update({
    where: { id: connection.id },
    data: {
      encryptedAccessToken: encryptToken(token.access_token),
      accessTokenExpiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000),
      scopes: token.scope?.split(" ") ?? connection.scopes,
      status: "CONNECTED",
      lastError: null,
    },
  });
  return token.access_token;
}

export async function syncSearchConsoleProperties(connectionId: string, organizationId: string) {
  try {
    const accessToken = await getSearchConsoleAccessToken(connectionId, organizationId);
    const response = await fetch(`${apiBase}/sites`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const data = await readJson(response) as { siteEntry?: Array<{ siteUrl: string; permissionLevel: string }> };
    const entries = data.siteEntry ?? [];
    for (const entry of entries) {
      await prisma.searchConsoleProperty.upsert({
        where: { connectionId_siteUrl: { connectionId, siteUrl: entry.siteUrl } },
        update: { permissionLevel: entry.permissionLevel, lastFetchedAt: new Date() },
        create: { connectionId, organizationId, siteUrl: entry.siteUrl, permissionLevel: entry.permissionLevel, lastFetchedAt: new Date() },
      });
    }
    const selected = await prisma.searchConsoleProperty.findFirst({ where: { connectionId, organizationId, selected: true } });
    if (!selected && entries[0]) {
      await prisma.searchConsoleProperty.update({
        where: { connectionId_siteUrl: { connectionId, siteUrl: entries[0].siteUrl } },
        data: { selected: true },
      });
    }
    await prisma.integrationConnection.update({ where: { id: connectionId }, data: { status: "CONNECTED", lastSyncedAt: new Date(), lastError: null, metadata: { propertyCount: entries.length } } });
    return entries;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search Console sync failed";
    await prisma.integrationConnection.update({ where: { id: connectionId }, data: { status: "ERROR", lastError: message } }).catch(() => undefined);
    throw error;
  }
}

type SearchRow = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
export type SearchConsolePerformance = {
  startDate: string;
  endDate: string;
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  daily: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>;
  queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  pages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
};

function dateText(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function querySearchAnalytics(accessToken: string, siteUrl: string, body: Record<string, unknown>) {
  const response = await fetch(`${apiBase}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return readJson(response) as Promise<{ rows?: SearchRow[] }>;
}

export async function getSearchConsolePerformance(connectionId: string, organizationId: string, siteUrl: string): Promise<SearchConsolePerformance> {
  const accessToken = await getSearchConsoleAccessToken(connectionId, organizationId);
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  const startDate = dateText(start);
  const endDate = dateText(end);
  const common = { startDate, endDate, dataState: "final" };
  const [dailyData, queryData, pageData] = await Promise.all([
    querySearchAnalytics(accessToken, siteUrl, { ...common, dimensions: ["date"], rowLimit: 1000 }),
    querySearchAnalytics(accessToken, siteUrl, { ...common, dimensions: ["query"], rowLimit: 10 }),
    querySearchAnalytics(accessToken, siteUrl, { ...common, dimensions: ["page"], rowLimit: 10 }),
  ]);
  const daily = (dailyData.rows ?? []).map((row) => ({ date: row.keys?.[0] ?? "", clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 }));
  const clicks = daily.reduce((sum, row) => sum + row.clicks, 0);
  const impressions = daily.reduce((sum, row) => sum + row.impressions, 0);
  const weightedPosition = daily.reduce((sum, row) => sum + row.position * row.impressions, 0);
  return {
    startDate,
    endDate,
    totals: { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? weightedPosition / impressions : 0 },
    daily,
    queries: (queryData.rows ?? []).map((row) => ({ query: row.keys?.[0] ?? "", clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 })),
    pages: (pageData.rows ?? []).map((row) => ({ page: row.keys?.[0] ?? "", clicks: row.clicks ?? 0, impressions: row.impressions ?? 0, ctr: row.ctr ?? 0, position: row.position ?? 0 })),
  };
}
