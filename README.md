# 11i Maps

Tenant-aware local SEO and multi-location operations platform operated by 22i Solutions LLP.

## Stack

- Next.js 16 App Router, React 19 and TypeScript
- Tailwind CSS
- Auth.js / NextAuth 5
- Prisma 5 and PostgreSQL
- Vercel Functions, Analytics, Speed Insights and Cron
- Optional Razorpay and OpenAI adapters

## Local setup

1. Copy `.env.example` to `.env.local` and configure a non-production PostgreSQL database and Auth.js credentials.
2. Install dependencies with `npm ci`.
3. Generate the client with `npx prisma generate`.
4. Review `docs/deployment.md` before applying migrations. Empty databases use the baseline plus tenant migration; an existing production database must resolve the baseline before applying the tenant migration.
5. Start the application with `npm run dev`.

## Verification

```bash
npm run lint
npm run build -- --webpack
```

The webpack flag avoids a local Turbopack sandbox limitation that attempts to bind an internal port. Vercel production builds are not affected by that local restriction.

## Product routes

- Public website: `/`
- Authenticated product: `/app`
- Manual onboarding: `/app/onboarding`
- Location directory: `/app/locations`
- Optimisation tasks: `/app/tasks`
- Integration health: `/app/integrations`
- Internal administration: `/admin` (requires `PLATFORM_SUPER_ADMIN`)

## Important limitations

- Google Business Profile requires approved API access and a dedicated connection flow. Google sign-in alone does not enable profile management.
- Bing Places publishing requires a supported approved interface or partner relationship.
- Geo-grid rankings require a licensed data provider.
- AI review and content output remains draft material until a configured publishing adapter succeeds.
- Razorpay checkout is disabled unless `RAZORPAY_LIVE_ENABLED=true` and all server-side plan credentials are configured and tested.

See the complete audit and roadmap in [`docs/architecture.md`](docs/architecture.md) and [`docs/implementation-plan.md`](docs/implementation-plan.md).
