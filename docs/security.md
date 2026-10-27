# Security model

## Implemented controls

- Server-side session checks on product routes and APIs.
- Tenant ID derived from active membership, not request payloads.
- Role checks for location, audit and task writes.
- Ownership queries scoped by `organizationId`.
- AES-256-GCM helper for OAuth token encryption.
- Razorpay webhook HMAC comparison using constant-time comparison.
- Zod validation for new write APIs.
- Private `/app`, `/admin`, `/dashboard` and `/api` paths excluded from robots.
- Activity records for location creation, audit completion and task changes.
- Secrets excluded by `.gitignore` and represented by names only in `.env.example`.

## Required before production customer data

- Apply and verify the migration on staging before production.
- Add PostgreSQL row-level security or an equivalent database-level tenant control.
- Add shared rate limiting to authentication, AI, audit, billing and provider routes.
- Add invitation expiry, email verification, recovery and account-deletion workflows.
- Rotate encryption keys through a versioned key envelope; the current helper has no rotation metadata.
- Add OAuth state/PKCE, refresh, revocation and least-scope tests for provider connectors.
- Add SSRF protection before website audit fetching.
- Add upload MIME/size inspection before direct media upload.
- Add audit-event retention and privacy/data-deletion policies.
- Add backup, restore and incident-response runbooks.

## Role boundary

`PLATFORM_SUPER_ADMIN` is the only role allowed into `/admin`. Business and agency write roles can manage locations, audits and tasks. `READ_ONLY_CLIENT` cannot call write APIs. Location-specific grants are not yet implemented, so membership currently applies to the whole organisation.

## Secrets

Never copy production secrets into chat, tickets, logs or repository files. Configure them directly in Vercel environment settings and use separate values for Preview and Production. Do not log OAuth tokens, webhook bodies containing personal data, or complete customer payloads.
