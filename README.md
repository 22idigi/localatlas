# LocalAtlas

Next.js 14 SaaS foundation for multi-location listings, NAP distribution, reviews, and local SEO content.

## Start

1. Copy `.env.example` to `.env.local` and provide PostgreSQL, OAuth, OpenAI, and encryption secrets.
2. Run `npm install`, then `npx prisma generate && npx prisma db push`.
3. Run `npm run dev`.

## Important integration points

- Google requires a Business Profile-enabled Google Cloud project and approved `business.manage` scope.
- Microsoft/Bing OAuth identifies the connector; its listing write API/account mapping must be implemented in `lib/platform-sync.ts` for the specific Bing Places partner contract.
- `MapPlatform` provides the canonical registry for the top directories (Google, Bing, Apple, Meta, Yelp, Yahoo, Nextdoor, TomTom, HERE, Waze, TripAdvisor, etc.). Directories without public write APIs are represented as queued/manual-feed syncs.
- Account credentials are encrypted with AES-256-GCM after OAuth account linking. Use a distinct, high-entropy `TOKEN_ENCRYPTION_KEY` and rotate it through a managed-key migration.
- The Vercel cron creates drafts. Change `status: "DRAFT"` to `"PUBLISHED"` only after adding editorial/brand review rules if automatic publishing is desired.
