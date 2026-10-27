# 11i Maps implementation plan

## Phase 0 — discovery and architecture

Status: completed for the current repository.

- Audited routes, schema, authentication, APIs, billing, cron and deployment configuration.
- Classified working, partial, missing and approval-dependent capabilities.
- Chose incremental migration rather than rewriting the live marketing site.

## Phase 1 — tenant-aware working foundation

Status: implemented in code; migration and live-flow verification remain.

- Organisation, membership and role schema.
- Backfill migration for existing users and locations.
- Authenticated `/app` shell with no-index metadata.
- Manual location onboarding with validation and activity logging.
- Data-provenance-aware profile audit.
- Optimisation tasks and completion workflow.
- Restricted `/admin` foundation.
- Accurate integration health states.

Next work:

1. Apply the reviewed migration to a staging database and verify existing users/locations.
2. Add organisation selection, invitations and location-level permission grants.
3. Add email verification/recovery through the chosen production auth provider.

## Phase 2 — approved provider integrations

- Create separate Google Business Profile OAuth consent and token lifecycle.
- Implement account discovery, location selection, snapshot import and diagnostics.
- Add webhook/polling jobs with idempotency, retry and quota accounting.
- Add review ingestion, editable AI drafts, approval and reply publishing.
- Implement Bing only through an approved interface or partner contract.

Blocker: external credentials, API approval and test accounts.

## Phase 3 — local SEO intelligence

- Website audit adapter with SSRF-safe URL fetching.
- Licensed rank-provider interface, scan estimates and usage accounting.
- Geo-grid storage and heatmap UI.
- Historical audit comparison and richer task dependencies.
- AI recommendations grounded in saved sources.

## Phase 4 — commercial product

- Organisation-level subscription and entitlements.
- Razorpay test/live separation, invoices, tax configuration and grace periods.
- Agency/client workspaces and custom report branding.
- PDF/CSV/authenticated report exports.
- Usage limits for ranking scans and AI credits.

## Phase 5 — production hardening

- Unit, integration and browser test suites.
- PostgreSQL RLS or equivalent database policy defence.
- Rate limiting backed by shared storage.
- Queue/workflow for provider sync and long reports.
- Sentry/log drains, runbooks, backups and restore testing.
- WCAG review and Core Web Vitals budget.
- Tested staging-to-production promotion process.
