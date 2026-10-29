import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { decryptToken, encryptToken } from "@/lib/token-crypto";
import { discoverBusinessProfileLocations } from "@/lib/google-business-profile";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.redirect(new URL("/login?callbackUrl=/app/listings", request.url));
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) return NextResponse.redirect(new URL(`/app/listings?error=${encodeURIComponent(oauthError)}`, request.url));
  if (!code || !state) return NextResponse.redirect(new URL("/app/listings?error=invalid_google_callback", request.url));
  const pending = await prisma.integrationOAuthState.findUnique({ where: { state } });
  if (!pending || pending.expiresAt < new Date() || pending.userId !== tenant.user.id || pending.organizationId !== tenant.organization.id || pending.provider !== "GOOGLE_BUSINESS_PROFILE") return NextResponse.redirect(new URL("/app/listings?error=expired_google_consent", request.url));
  await prisma.integrationOAuthState.delete({ where: { id: pending.id } });
  const clientId = process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) return NextResponse.redirect(new URL("/app/listings?error=google_not_configured", request.url));
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, code_verifier: decryptToken(pending.encryptedCodeVerifier), grant_type: "authorization_code", redirect_uri: pending.redirectUri }), cache: "no-store" });
  const token = await response.json().catch(() => ({})) as { access_token?: string; refresh_token?: string; expires_in?: number; scope?: string; error_description?: string };
  if (!response.ok || !token.access_token) return NextResponse.redirect(new URL("/app/listings?error=google_token_exchange", request.url));
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` }, cache: "no-store" });
  const profile = await profileResponse.json().catch(() => ({})) as { email?: string };
  const existing = await prisma.integrationConnection.findUnique({ where: { organizationId_provider: { organizationId: tenant.organization.id, provider: "GOOGLE_BUSINESS_PROFILE" } } });
  const connection = await prisma.integrationConnection.upsert({
    where: { organizationId_provider: { organizationId: tenant.organization.id, provider: "GOOGLE_BUSINESS_PROFILE" } },
    update: { status: "CONNECTED", externalAccountEmail: profile.email ?? tenant.user.email, encryptedAccessToken: encryptToken(token.access_token), encryptedRefreshToken: token.refresh_token ? encryptToken(token.refresh_token) : existing?.encryptedRefreshToken, accessTokenExpiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000), scopes: token.scope?.split(" ") ?? [], lastError: null },
    create: { organizationId: tenant.organization.id, provider: "GOOGLE_BUSINESS_PROFILE", status: "CONNECTED", externalAccountEmail: profile.email ?? tenant.user.email, encryptedAccessToken: encryptToken(token.access_token), encryptedRefreshToken: token.refresh_token ? encryptToken(token.refresh_token) : null, accessTokenExpiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000), scopes: token.scope?.split(" ") ?? [] },
  });
  try {
    const result = await discoverBusinessProfileLocations(connection.id, tenant.organization.id);
    await prisma.activityLog.create({ data: { organizationId: tenant.organization.id, actorUserId: tenant.user.id, action: "integration.google_business_connected", entityType: "IntegrationConnection", entityId: connection.id, metadata: result } });
    return NextResponse.redirect(new URL("/app/listings?connected=1", request.url));
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    return NextResponse.redirect(new URL(status === 403 ? "/app/listings?status=pending_approval" : "/app/listings?error=google_discovery", request.url));
  }
}
