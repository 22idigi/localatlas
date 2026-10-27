# Changelog

All notable changes follow a business-friendly Keep a Changelog structure.

## Unreleased — Phase 1 tenant foundation

### Added

- Organisation workspaces, memberships and explicit SaaS roles.
- Migration that preserves existing users and backfills their locations into private workspaces.
- Authenticated `/app` product navigation and executive overview.
- Validated manual location onboarding with server-side tenant permission checks.
- Transparent profile-completeness audit with documented sources and unavailable inputs.
- Prioritised optimisation tasks and task-completion workflow.
- Activity records for important workspace changes.
- Restricted internal `/admin` foundation.
- Architecture, product, integration, security and deployment documentation.

### Changed

- Application sign-in now requests identity scopes only; listing-management consent is reserved for dedicated connectors.
- Private product and administration routes are explicitly excluded from crawling.
- Login branding now uses 11i Maps rather than the earlier LocalAtlas name.

### Fixed

- Added an explicit session callback so the authenticated server session carries the database user ID used for authorisation.

### Known limitations

- The database migration has not been applied to a production or staging database by this code change.
- Google Business Profile and Bing Places live publishing remain unavailable pending approved access and connector implementation.
- Email/password recovery, team invitations, location-specific grants, licensed rank tracking, reports and production billing verification are not complete.
- Automated unit, integration and browser tests are not yet configured.

### Action required

- Review and run the migration on a backed-up staging database.
- Configure non-production auth credentials and verify the complete sign-in-to-audit flow.
- Choose and approve the provider integration and authentication roadmap before inviting customers.
