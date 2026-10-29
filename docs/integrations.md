# Integration status and setup

No provider below should be labelled live until an end-to-end test completes against an authorised account.

## Google application sign-in

Status: implemented, awaiting credential/live-flow verification.

Required environment variables: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`.

The Google OAuth web client must allow these callback URLs:

- Production: `https://11i.co/api/auth/callback/google`
- Stable Preview: `https://localatlas-git-codex-tenant-foundation-22i.vercel.app/api/auth/callback/google`

Use the stable Preview alias for OAuth testing; per-deployment URLs change on every build.

The sign-in provider requests only `openid email profile`. Google Business Profile permission must use a separate connector and callback.

## Google Search Console

Status: implemented with a dedicated read-only consent.

The connector requests only `https://www.googleapis.com/auth/webmasters.readonly`. It discovers every property returned by `sites.list`, stores encrypted access and refresh tokens at organisation level, and provides a property selector plus 28-day final search-performance reporting.

The Google OAuth web client must also allow these callbacks:

- Production: `https://11i.co/api/integrations/google-search-console/callback`
- Stable Preview: `https://localatlas-git-codex-tenant-foundation-22i.vercel.app/api/integrations/google-search-console/callback`

Enable `searchconsole.googleapis.com` in the same Google Cloud project. Connecting Search Console never grants Google Business Profile publishing access.

## Google Business Profile

Status: connector implemented; production discovery remains gated by Google project approval.

The connector uses a dedicated `business.manage` consent with PKCE, encrypted access/refresh tokens and automatic refresh. It paginates every authorised Business Profile account and location, keeps the remote inventory separate from canonical 11i data, supports selective import, and publishes NAP changes only when Google confirms the PATCH. Imported listings can also sync reviews; AI replies remain drafts until a person approves and Google confirms the reply.

Prerequisites:

- Google Cloud project with the relevant Business Profile APIs enabled and approved.
- OAuth client with `https://11i.co/api/integrations/google-business-profile/callback` approved as a redirect URI.
- `business.manage` consent requested only when the user connects a business account.
- Set `GOOGLE_BUSINESS_PROFILE_REDIRECT_URI` in Production; the connector can reuse `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
- Test with an account that is an owner or manager of authorised business locations. Client access should be delegated by the client or granted through the connector; never request a client's password.

Google's Business Profile API access request must be approved for the Cloud project before the location and review endpoints will return data. OAuth consent alone is not API approval.

## Microsoft sign-in and Bing Places

Status: Microsoft identity sign-in is separate; Bing publishing requires approved partner access.

Do not use Bing Ads scopes as a substitute for Bing Places permissions. Keep manual/managed publishing available when no supported API exists.

## Razorpay

Status: server route and HMAC webhook validation exist; not verified live.

Required variables are documented in `.env.example`. Configure test plan IDs first, create a test subscription, replay a signed webhook and verify database status before exposing checkout as available.

## OpenAI

Status: review and blog draft routes exist; credentials and cost controls required.

Required: `OPENAI_API_KEY`. Model names can be overridden by `OPENAI_REVIEW_MODEL` and `OPENAI_BLOG_MODEL`. AI responses must remain drafts until a provider publish succeeds.

## Media storage

Status: hosted URL registration only.

Select Vercel Blob, S3 or Cloudinary. Use signed/direct uploads, validate MIME type and size, strip dangerous metadata where appropriate, and store provider distribution results separately from the source asset.

## Rank tracking

Status: unavailable.

Implement only through a licensed provider with a documented interface, per-scan estimate, quotas and historical storage. Demonstration scans must be labelled and must never look live.
