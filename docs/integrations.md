# Integration status and setup

No provider below should be labelled live until an end-to-end test completes against an authorised account.

## Google application sign-in

Status: implemented, awaiting credential/live-flow verification.

Required environment variables: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`.

The sign-in provider requests only `openid email profile`. Google Business Profile permission must use a separate connector and callback.

## Google Business Profile

Status: adapter placeholder; requires Google approval.

Prerequisites:

- Google Cloud project with the relevant Business Profile APIs enabled and approved.
- OAuth client and approved redirect URI.
- `business.manage` consent requested only when the user connects a business account.
- Encrypted refresh-token storage, refresh handling and revocation.
- Test account with authorised business locations.

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
