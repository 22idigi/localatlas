import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/token-crypto";
import { syncSearchConsoleProperties } from "@/lib/google-search-console";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.redirect(new URL("/login?callbackUrl=/app/integrations", request.url));
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) return NextResponse.redirect(new URL(`/app/integrations?error=${encodeURIComponent(oauthError)}`, request.url));
  if (!code || !state) return NextResponse.redirect(new URL("/app/integrations?error=invalid_gsc_callback", request.url));

  const pending = await prisma.integrationOAuthState.findUnique({ where: { state } });
  if (!pending || pending.expiresAt < new Date() || pending.userId !== tenant.user.id || pending.organizationId !== tenant.organization.id || pending.provider !== "GOOGLE_SEARCH_CONSOLE") {
    return NextResponse.redirect(new URL("/app/integrations?error=expired_gsc_consent", request.url));
  }
  await prisma.integrationOAuthState.delete({ where: { id: pending.id } });
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL("/app/integrations?error=gsc_not_configured", request.url));

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      code_verifier: decryptToken(pending.encryptedCodeVerifier),
      grant_type: "authorization_code",
      redirect_uri: pending.redirectUri,
    }),
    cache: "no-store",
  });
  const token = await response.json().catch(() => ({})) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; error_description?: string };
  if (!response.ok || !token.access_token) {
    await prisma.activityLog.create({ data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "integration.gsc_failed", entityType: "IntegrationConnection", metadata: { reason: token.error_description ?? `OAuth exchange failed (${response.status})` } } });
    return NextResponse.redirect(new URL("/app/integrations?error=gsc_token_exchange", request.url));
  }

  const existing = await prisma.integrationConnection.findUnique({ where: { organizationId_provider: { organizationId: tenant.organization.id, provider: "GOOGLE_SEARCH_CONSOLE" } } });
  const connection = await prisma.integrationConnection.upsert({
    where: { organizationId_provider: { organizationId: tenant.organization.id, provider: "GOOGLE_SEARCH_CONSOLE" } },
    update: {
      status: "CONNECTED",
      externalAccountEmail: tenant.user.email,
      encryptedAccessToken: encryptToken(token.access_token),
      encryptedRefreshToken: token.refresh_token ? encryptToken(token.refresh_token) : existing?.encryptedRefreshToken,
      accessTokenExpiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000),
      scopes: token.scope?.split(" ") ?? [],
      lastError: null,
    },
    create: {
      organizationId: tenant.organization.id,
      provider: "GOOGLE_SEARCH_CONSOLE",
      status: "CONNECTED",
      externalAccountEmail: tenant.user.email,
      encryptedAccessToken: encryptToken(token.access_token),
      encryptedRefreshToken: token.refresh_token ? encryptToken(token.refresh_token) : null,
      accessTokenExpiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000),
      scopes: token.scope?.split(" ") ?? [],
    },
  });
  try {
    const properties = await syncSearchConsoleProperties(connection.id, tenant.organization.id);
    await prisma.activityLog.create({ data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "integration.gsc_connected", entityType: "IntegrationConnection", entityId: connection.id, metadata: { propertyCount: properties.length } } });
    return NextResponse.redirect(new URL("/app/search-console?connected=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/app/integrations?error=gsc_property_sync", request.url));
  }
}
