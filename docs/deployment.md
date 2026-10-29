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

## Migration strategy

`20261026000100_initial_baseline` recreates the schema that existed before tenant isolation. New empty environments can run `prisma migrate deploy`; Prisma applies the baseline first and the tenant migration second.

The existing production database already contains the baseline schema. Before its first migration-managed release, take a verified backup and mark only the baseline as already applied:

```bash
npx prisma migrate resolve --applied 20261026000100_initial_baseline
npx prisma migrate deploy
```

Do not resolve the tenant migration manually. Rehearse the exact production sequence against a restored staging copy before release.

Preview builds can apply migrations only when both `VERCEL_ENV=preview` and `RUN_PREVIEW_MIGRATIONS=true`. Keep that branch-scoped flag off after the reviewed migration succeeds.

The first production migration-managed release uses the separate, one-time `RUN_PRODUCTION_MIGRATIONS=true` gate. The build first executes the exact pending migration SQL inside a transaction against Production, verifies the baseline, tenant isolation, GSC tables and preserved row counts, and rolls the transaction back. Only a successful rehearsal records an existing baseline when necessary and runs `prisma migrate deploy`. Set this gate back to `false` immediately after the successful release. Never keep either migration gate enabled during ordinary deployments.

## Required environment variables

Use `.env.example` as the name inventory. Production requires at minimum PostgreSQL, Auth.js and token-encryption values. Provider, OpenAI, cron and billing variables enable only their corresponding features.

## Rollback

Do not automatically reverse the tenant migration after customer writes begin. Roll back the application deployment first. Preserve the organisation columns and new tables, investigate, and restore from the pre-migration snapshot only if the data migration itself is invalid.

## Observability gaps

Vercel Analytics and Speed Insights are installed. Structured application error tracking, log drains, queue monitoring and database alerts are not configured and are required before broad customer onboarding.
