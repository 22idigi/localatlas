import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/token-crypto";
import { googleBusinessProfileScope } from "@/lib/google-business-profile";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tenant = await getTenantContext();
  if (!tenant) return NextResponse.redirect(new URL("/login?callbackUrl=/app/listings", request.url));
  const clientId = process.env.GOOGLE_BUSINESS_PROFILE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
  if (!clientId) return NextResponse.redirect(new URL("/app/listings?error=google_not_configured", request.url));
  const redirectUri = process.env.GOOGLE_BUSINESS_PROFILE_REDIRECT_URI ?? `${request.nextUrl.origin}/api/integrations/google-business-profile/callback`;
  const state = crypto.randomBytes(32).toString("base64url");
  const verifier = crypto.randomBytes(64).toString("base64url");
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
  await prisma.integrationOAuthState.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.integrationOAuthState.create({ data: { state, organizationId: tenant.organization.id, userId: tenant.user.id, provider: "GOOGLE_BUSINESS_PROFILE", redirectUri, encryptedCodeVerifier: encryptToken(verifier), expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
  const authorize = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorize.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: "code", scope: `openid email ${googleBusinessProfileScope}`, access_type: "offline", prompt: "consent", include_granted_scopes: "true", state, code_challenge: challenge, code_challenge_method: "S256" }).toString();
  return NextResponse.redirect(authorize);
}
