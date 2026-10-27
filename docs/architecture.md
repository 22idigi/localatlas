# 11i Maps architecture

Last reviewed: 2026-10-27

## Repository audit

11i Maps is a single Next.js 16 App Router repository containing three surfaces:

- Public marketing and SEO pages at the root routes.
- The authenticated product at `/app` (the older `/dashboard` surface remains for compatibility).
- Route Handlers under `/api` for billing, location operations, audits, tasks, AI drafts and scheduled work.

The runtime stack is TypeScript, React 19, Tailwind CSS 3, Auth.js/NextAuth 5 beta, Prisma 5 and PostgreSQL. Vercel hosts the application and invokes the monthly cron route. The repository is connected to GitHub (`22idigi/localatlas`) and the live domain is `https://11i.co`.

## Workload architecture

| Workload | Current implementation | Target |
| --- | --- | --- |
| Web UI and HTTP APIs | Next.js pages and Vercel Functions | Keep together while the product is small |
| Persistent data | PostgreSQL through Prisma | Serverless-compatible pool close to the function region |
| Monthly draft generation | Vercel Cron calling a Route Handler | Move long or high-volume runs to a durable queue/workflow |
| Provider synchronisation | In-process adapter call | Queue per location/provider with idempotency and retries |
| Media | URL registration only | Direct upload to Vercel Blob, S3 or Cloudinary |
| Reporting | Not implemented | Background generation with immutable source periods |

## Tenant model

`Organization` is the tenant root. `Membership` joins users to organisations with an explicit role. New product routes query data with `organizationId`; location creation, audits and tasks all validate membership server-side.

The legacy `Location.userId` column is intentionally retained during migration so existing ownership records and routes keep working. `Location.organizationId` is the authoritative tenant key for the new product. The migration creates one private organisation per existing user and backfills every existing location.

Application-level isolation is implemented. PostgreSQL row-level security is not yet enabled, so database-level defence in depth remains a production-hardening task.

## Authentication and provider connections

Auth.js provides application sign-in. Authentication requests only identity scopes. Google Business Profile and Bing Places permissions must be separate connector flows because signing into 11i Maps is not the same as authorising listing management.

OAuth credential fields already support AES-256-GCM encrypted storage, but provider-specific connection records, token refresh and revocation are Phase 2 work. Client-side token storage is prohibited.

## Data provenance

The Phase 1 audit uses only saved profile fields, provider connection metadata and the 11i media library. Its score is labelled as an **11i Maps profile-completeness score**, never an official Google score. Google performance, licensed geo-grid ranking and Core Web Vitals inputs remain unavailable until their sources are configured.

## Current capability classification

| Capability | Status | Evidence / limitation |
| --- | --- | --- |
| Marketing site, blog, industries, sitemap, robots | Working | Static/server-rendered routes are present and indexed URLs are generated |
| Google and Microsoft application sign-in | Partially working | Code exists; requires valid production credentials and live-flow verification |
| Organisation and membership foundation | Working in code | Migration, tenant guards and role-aware product routes added; production migration not applied in this change |
| Manual location creation | Working in code | Validated API, persistence, tenant check and activity log added |
| Profile-completeness audit and tasks | Working in code | Deterministic methodology, sources, findings and completion workflow added |
| Google Business Profile sync | Requires external API approval | Adapter explicitly throws until an approved project and connector are configured |
| Bing Places publishing | Requires external API approval | Partner access is required; Microsoft sign-in alone is insufficient |
| Apple, Meta and other directory publishing | Missing / partner feed | Existing adapter queues non-public destinations; no live provider is claimed |
| Review ingestion and reply publishing | Partially working | AI draft route exists; live review sync and reply adapter are missing |
| Media upload | Partially working | URL registration works; direct upload and provider distribution are missing |
| Razorpay subscriptions | Partially working | API and webhook validation exist; plans and an end-to-end test are required |
| AI monthly blog drafts | Partially working | Cron and OpenAI draft generation exist; queueing, cost controls and editorial UI are incomplete |
| Geo-grid rank tracking | Missing | Must use a lawful licensed provider |
| Reports, PDF and scheduled delivery | Missing | Data model and job architecture still required |
| Internal admin | Foundation only | Role-restricted aggregate page added; support and operations tooling remain |
| Automated tests and CI gates | Missing | Type checking exists; test frameworks and CI are not configured |

## Known technical debt

- Auth.js is a beta dependency and needs an upgrade decision before a large customer launch.
- Several legacy `/dashboard` buttons are visual placeholders; `/app` is the supported new product surface.
- Existing Prisma migrations were absent before this milestone. The added migration is incremental for the current schema and must be applied to a reviewed database backup.
- API rate limiting, structured observability, background queues and database RLS are not yet implemented.
