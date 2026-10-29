-- Provider inventory tables keep remote discovery separate from canonical 11i locations.
CREATE TABLE "ProviderAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "externalAccountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "accountType" TEXT,
    "role" TEXT,
    "verificationState" TEXT,
    "metadata" JSONB,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "lastDiscoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProviderLocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "externalLocationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "storeCode" TEXT,
    "primaryCategory" TEXT,
    "phone" TEXT,
    "websiteUrl" TEXT,
    "address" JSONB,
    "regularHours" JSONB,
    "metadata" JSONB,
    "localLocationId" TEXT,
    "syncState" "SyncState" NOT NULL DEFAULT 'PENDING',
    "lastReadAt" TIMESTAMP(3),
    "lastWrittenAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProviderAccount_connectionId_externalAccountId_key" ON "ProviderAccount"("connectionId", "externalAccountId");
CREATE INDEX "ProviderAccount_organizationId_provider_idx" ON "ProviderAccount"("organizationId", "provider");
CREATE UNIQUE INDEX "ProviderLocation_connectionId_externalLocationId_key" ON "ProviderLocation"("connectionId", "externalLocationId");
CREATE INDEX "ProviderLocation_organizationId_provider_syncState_idx" ON "ProviderLocation"("organizationId", "provider", "syncState");
CREATE INDEX "ProviderLocation_localLocationId_provider_idx" ON "ProviderLocation"("localLocationId", "provider");

ALTER TABLE "ProviderAccount" ADD CONSTRAINT "ProviderAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderAccount" ADD CONSTRAINT "ProviderAccount_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderLocation" ADD CONSTRAINT "ProviderLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderLocation" ADD CONSTRAINT "ProviderLocation_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderLocation" ADD CONSTRAINT "ProviderLocation_providerAccountId_fkey" FOREIGN KEY ("providerAccountId") REFERENCES "ProviderAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProviderLocation" ADD CONSTRAINT "ProviderLocation_localLocationId_fkey" FOREIGN KEY ("localLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
