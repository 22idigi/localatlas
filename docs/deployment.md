# Deployment runbook

## Current deployment

- Host: Vercel
- Production domain: `https://11i.co`
- Git repository: `https://github.com/22idigi/localatlas.git`
- Cron: monthly draft generation at `0 7 1 * *`

## Staging release sequence

1. Create a PostgreSQL backup or snapshot.
2. Configure a staging/preview database and non-production OAuth/payment credentials.
3. Run `npm ci`.
4. Run `npx prisma generate` and `npx prisma migrate deploy` against staging.
5. Confirm every existing user has one active membership and every location has an `organizationId`.
6. Run `npm run lint` and `npm run build -- --webpack`.
7. Test sign-in, workspace creation, manual location creation, audit, task completion and cross-tenant denial.
8. Create a Vercel preview/staged production deployment and inspect logs.
9. Promote only the tested build.

## Production migration caution

The repository previously had no Prisma migration history. `20261027000100_tenant_foundation` is an incremental migration for a database already matching the old schema. Do not run it against an empty database as the sole migration. For a new environment, create a reviewed baseline from the old schema or provision with the schema before resolving the baseline.

## Required environment variables

Use `.env.example` as the name inventory. Production requires at minimum PostgreSQL, Auth.js and token-encryption values. Provider, OpenAI, cron and billing variables enable only their corresponding features.

## Rollback

Do not automatically reverse the tenant migration after customer writes begin. Roll back the application deployment first. Preserve the organisation columns and new tables, investigate, and restore from the pre-migration snapshot only if the data migration itself is invalid.

## Observability gaps

Vercel Analytics and Speed Insights are installed. Structured application error tracking, log drains, queue monitoring and database alerts are not configured and are required before broad customer onboarding.
