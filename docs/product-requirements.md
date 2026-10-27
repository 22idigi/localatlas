# 11i Maps product requirements

## Product promise

11i Maps helps businesses manage authorised local profile data, improve local-search readiness, manage customer feedback and measure work across one or many locations without presenting estimated or demonstration data as live provider data.

## Primary users

1. Single-location business owner.
2. Multi-location operator and location manager.
3. Agency owner, administrator and SEO specialist.
4. Read-only client stakeholder.
5. 11i platform administrator.

## Phase 1 acceptance requirements

- A signed-in user receives a private organisation workspace.
- Membership role is checked on the server for writes.
- A permitted user can add a validated manual location.
- A user can see only locations inside the active organisation.
- A user can run a profile-completeness audit using disclosed sources.
- Failed findings create prioritised optimisation tasks.
- A permitted user can complete a task and the action is logged.
- Unconfigured providers remain clearly disabled.
- Private routes are excluded from indexing.
- Existing public pages and legacy location ownership remain intact.

## Non-goals for Phase 1

- Claiming that a Google, Bing, Apple or Meta write completed.
- Collecting geo-grid rankings without a licensed provider.
- Automatically publishing AI content or sensitive review replies.
- Attributing revenue or all leads to Maps without measurement evidence.
- Enabling production billing before provider plans and webhooks are tested.

## Product rules

- External writes require a difference preview, authorised confirmation and an audit record.
- AI output is editable and requires approval by default.
- Scores disclose methodology, sources and unavailable inputs.
- Tenant IDs are derived from authenticated server context, never accepted from client payloads.
- Read-only members never gain write access merely because a button is hidden.
- Commercial plan limits must be enforced in server code before launch.
