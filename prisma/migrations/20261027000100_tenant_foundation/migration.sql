-- Incremental migration for databases created from the pre-organisation 11i Maps schema.
-- It preserves every existing user and location by creating one private workspace per user.

CREATE TYPE "OrganizationType" AS ENUM ('BUSINESS', 'AGENCY', 'INTERNAL');
CREATE TYPE "MembershipRole" AS ENUM ('PLATFORM_SUPER_ADMIN', 'AGENCY_OWNER', 'AGENCY_ADMIN', 'BUSINESS_OWNER', 'LOCATION_MANAGER', 'SEO_SPECIALIST', 'READ_ONLY_CLIENT');
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "AuditStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "TaskPriority" AS ENUM ('CRITICAL', 'HIGH_IMPACT', 'MEDIUM_IMPACT', 'MAINTENANCE');
CREATE TYPE "TaskEffort" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED');

CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "OrganizationType" NOT NULL DEFAULT 'BUSINESS',
  "businessType" TEXT,
  "operatingRegion" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Membership" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "MembershipRole" NOT NULL DEFAULT 'BUSINESS_OWNER',
  "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Location" ADD COLUMN "organizationId" TEXT;

INSERT INTO "Organization" ("id", "name", "slug", "type", "createdAt", "updatedAt")
SELECT
  'org_' || "id",
  COALESCE(NULLIF("name", ''), NULLIF("email", ''), '11i Maps workspace'),
  'workspace-' || lower(replace("id", '_', '-')),
  'BUSINESS'::"OrganizationType",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Membership" ("id", "organizationId", "userId", "role", "status", "createdAt", "updatedAt")
SELECT
  'membership_' || "id",
  'org_' || "id",
  "id",
  'BUSINESS_OWNER'::"MembershipRole",
  'ACTIVE'::"MembershipStatus",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "User"
ON CONFLICT ("id") DO NOTHING;

UPDATE "Location"
SET "organizationId" = 'org_' || "userId"
WHERE "organizationId" IS NULL;

ALTER TABLE "Location" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE TABLE "AuditRun" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "status" "AuditStatus" NOT NULL DEFAULT 'RUNNING',
  "score" INTEGER,
  "inputCoverage" INTEGER NOT NULL,
  "methodologyVersion" TEXT NOT NULL DEFAULT 'profile-v1',
  "sourceSummary" JSONB NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "errorMessage" TEXT,
  CONSTRAINT "AuditRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditFinding" (
  "id" TEXT NOT NULL,
  "auditRunId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "detail" TEXT NOT NULL,
  "passed" BOOLEAN NOT NULL,
  "weight" INTEGER NOT NULL,
  "source" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditFinding_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OptimizationTask" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "locationId" TEXT,
  "findingId" TEXT,
  "title" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "priority" "TaskPriority" NOT NULL,
  "effort" "TaskEffort" NOT NULL,
  "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
  "dueAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OptimizationTask_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Membership_organizationId_userId_key" ON "Membership"("organizationId", "userId");
CREATE INDEX "Membership_userId_status_idx" ON "Membership"("userId", "status");
CREATE INDEX "Membership_organizationId_role_status_idx" ON "Membership"("organizationId", "role", "status");
CREATE INDEX "Location_organizationId_updatedAt_idx" ON "Location"("organizationId", "updatedAt");
CREATE INDEX "AuditRun_organizationId_startedAt_idx" ON "AuditRun"("organizationId", "startedAt");
CREATE INDEX "AuditRun_locationId_startedAt_idx" ON "AuditRun"("locationId", "startedAt");
CREATE UNIQUE INDEX "AuditFinding_auditRunId_code_key" ON "AuditFinding"("auditRunId", "code");
CREATE INDEX "AuditFinding_auditRunId_passed_idx" ON "AuditFinding"("auditRunId", "passed");
CREATE UNIQUE INDEX "OptimizationTask_findingId_key" ON "OptimizationTask"("findingId");
CREATE INDEX "OptimizationTask_organizationId_status_priority_idx" ON "OptimizationTask"("organizationId", "status", "priority");
CREATE INDEX "OptimizationTask_locationId_status_idx" ON "OptimizationTask"("locationId", "status");
CREATE INDEX "ActivityLog_organizationId_createdAt_idx" ON "ActivityLog"("organizationId", "createdAt");
CREATE INDEX "ActivityLog_actorUserId_createdAt_idx" ON "ActivityLog"("actorUserId", "createdAt");

ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Location" ADD CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditRun" ADD CONSTRAINT "AuditRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditRun" ADD CONSTRAINT "AuditRun_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditFinding" ADD CONSTRAINT "AuditFinding_auditRunId_fkey" FOREIGN KEY ("auditRunId") REFERENCES "AuditRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OptimizationTask" ADD CONSTRAINT "OptimizationTask_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OptimizationTask" ADD CONSTRAINT "OptimizationTask_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OptimizationTask" ADD CONSTRAINT "OptimizationTask_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "AuditFinding"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
