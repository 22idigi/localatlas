CREATE TYPE "IntegrationProvider" AS ENUM ('GOOGLE_SEARCH_CONSOLE', 'GOOGLE_BUSINESS_PROFILE', 'BING_PLACES', 'APPLE_BUSINESS_CONNECT', 'META');
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'ACTION_REQUIRED', 'ERROR', 'DISCONNECTED', 'PENDING_APPROVAL');

CREATE TABLE "IntegrationConnection" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "status" "IntegrationStatus" NOT NULL DEFAULT 'CONNECTED',
  "externalAccountEmail" TEXT,
  "encryptedAccessToken" TEXT,
  "encryptedRefreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP(3),
  "scopes" TEXT[],
  "metadata" JSONB,
  "lastSyncedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IntegrationOAuthState" (
  "id" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "provider" "IntegrationProvider" NOT NULL,
  "redirectUri" TEXT NOT NULL,
  "encryptedCodeVerifier" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationOAuthState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SearchConsoleProperty" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "siteUrl" TEXT NOT NULL,
  "permissionLevel" TEXT NOT NULL,
  "selected" BOOLEAN NOT NULL DEFAULT false,
  "lastFetchedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SearchConsoleProperty_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "IntegrationConnection_organizationId_provider_key" ON "IntegrationConnection"("organizationId", "provider");
CREATE INDEX "IntegrationConnection_organizationId_status_idx" ON "IntegrationConnection"("organizationId", "status");
CREATE UNIQUE INDEX "IntegrationOAuthState_state_key" ON "IntegrationOAuthState"("state");
CREATE INDEX "IntegrationOAuthState_organizationId_provider_expiresAt_idx" ON "IntegrationOAuthState"("organizationId", "provider", "expiresAt");
CREATE INDEX "IntegrationOAuthState_userId_expiresAt_idx" ON "IntegrationOAuthState"("userId", "expiresAt");
CREATE UNIQUE INDEX "SearchConsoleProperty_connectionId_siteUrl_key" ON "SearchConsoleProperty"("connectionId", "siteUrl");
CREATE INDEX "SearchConsoleProperty_organizationId_selected_idx" ON "SearchConsoleProperty"("organizationId", "selected");

ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationOAuthState" ADD CONSTRAINT "IntegrationOAuthState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IntegrationOAuthState" ADD CONSTRAINT "IntegrationOAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchConsoleProperty" ADD CONSTRAINT "SearchConsoleProperty_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchConsoleProperty" ADD CONSTRAINT "SearchConsoleProperty_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
