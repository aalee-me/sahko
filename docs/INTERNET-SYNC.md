# Internet sync infrastructure — prepared, not deployed

The same capability-based protocol used by Wi-Fi can run on an HTTPS relay. This document and `infra/companion/` prepare that option; no hosting, account, domain, paid plan or remote database was created or changed.

## Components and boundaries

| Component | Responsibility | Storage |
| --- | --- | --- |
| GitHub Pages | Main website and phone companion UI | Static frontend files |
| Mac app | Local app classification; authoritative timer/session; recap assembly | Keychain writer token; local history |
| Phone companion | Minimal mirrored view; opt-in motion estimator; Jolts | Viewer capability; bounded pending event queue |
| HTTPS Worker relay | Validate capabilities and processed payloads; publish/read snapshot; queue events | Dedicated D1 database |
| Hourly scheduled job | Delete expired pairings and old phone events | Same D1 binding |

Mac → HTTPS relay ← phone. The relay does not need screenshots, window titles, full URLs, raw sensor samples, keystrokes or private thought/audio content. The existing payload also includes chosen participant display names/initials and room display code; those are shared with the paired phone. Optional vibe tags are allowlisted. This is TLS transport encryption with server-side payload validation, not end-to-end encryption of relay state.

## Existing protocol

Base path: `/api/companion/pairs`.

| Request | Capability | Purpose |
| --- | --- | --- |
| `POST /` | Rate-limited create | Return random writer token and ten-minute, one-use join code |
| `POST /join` | Join code | Exchange code for a viewer token |
| `PUT /:id/state` | Writer | Publish processed snapshot, stable session ID and active flag; acknowledge Jolt |
| `GET /:id/state` | Writer/viewer | Read snapshot; only writer also receives Jolt and phone event journal |
| `POST /:id/phone` | Viewer | Submit `{id, sessionId, kind, at}`; reject raw fields and wrong session |
| `POST /:id/jolt` | Viewer | Jolt an existing drifting participant, with cooldown |
| `POST /:id/code` | Writer | Issue a new short-lived code |
| `DELETE /:id` | Writer | Revoke all phone access to this pairing |

Only token/code hashes are stored by the API. Writer/viewer credentials are distinct. The Mac retains writer credentials in Keychain; phone browser storage contains its viewer token. The current implementation supports one active viewer capability per pairing. Re-pairing replaces that viewer capability. Publish renews pairing expiry to 24 hours; stale/offline presence starts after 20 seconds. Phone events are idempotent by pair/event ID and must match the desktop session; desktop history deduplicates independently. A bounded 600-event/session journal, 20-event/minute phone rate limit and bounded 200-event phone retry queue limit growth. An hourly cleanup removes expired pairings (cascading events) and phone events older than 24 hours.

## Deployment skeleton

`infra/companion/worker.mjs` exposes **only** companion routes; it never trusts an account identity header or exposes the authenticated room/account API. Its scheduled handler performs cleanup. `wrangler.jsonc` declares the Worker, hourly cron and D1 `DB` binding. Observability is disabled by default to avoid request logging. This is an alternative to updating the existing Sites API and does not move the GitHub website.

Before any deployment, choose/approve a provider and check its current pricing, quotas and account settings. For a separately approved Cloudflare deployment:

1. Install/pin a compatible Wrangler version and authenticate the intended account.
2. Create a dedicated D1 database named `sahko-companion` and replace the explicit database ID placeholder in `infra/companion/wrangler.jsonc`.
3. Apply the checked-in numbered migrations through 0011 using `wrangler d1 migrations apply sahko-companion --remote --config infra/companion/wrangler.jsonc`. All app migrations are used for a single source of schema truth; the companion Worker exposes only the pairing tables/routes.
4. Run tests, then deploy using `wrangler deploy --config infra/companion/wrangler.jsonc` only after authorization. HTTPS is provided by the Worker hostname; a custom domain is optional.
5. Set the published relay base in `frontend/desktop-companion.js` and `desktop/Sources/SahkoDesktop/PairClient.swift` to the approved HTTPS origin plus `/api/companion/pairs`, publish GitHub Pages and release a matching Mac build. Keep their endpoint versions matched. Do not place capability tokens in URLs or logs.
6. The browser origin allowlist already includes `https://aalee-me.github.io`. If a different UI is approved, add only its exact HTTPS origin through the server-side `COMPANION_ALLOWED_ORIGIN` binding. CORS is not a substitute for token authorization.
7. Verify owner-only writes, single-use joining, expiry/revocation, wrong-session rejection, duplicate events, reconnect/offline state and retention against the deployed staging API before using real sessions.

An existing Sites deployment would instead need its matching API code and migrations updated through that platform’s source workflow. That update remains unapproved; nothing here deploys to it. GitHub Pages alone cannot execute the relay API.

## Cost and capacity planning

No claim of free production hosting is made. Check the provider’s current request, CPU, D1 read/write/storage and scheduled-job allowances. With one Mac publishing and reading every three seconds and one phone reading every two seconds, an active pair makes about **4,200 requests/hour** before Jolts/events/retries: `2 × 3600/3 + 3600/2`. Eight hours is about 33,600 requests per pair; multiple pairs scale linearly. Snapshot writes are about 1,200/hour/pair. Indexed queries, adaptive background polling and event acknowledgements/incremental cursors should be evaluated before broad release. Polling continues only while the relevant app/page is active enough to run it; iOS background execution is not guaranteed.

For a larger release, add service-level abuse controls, key rotation/versioning, deployment rollback and monitored aggregate error/capacity metrics without payload logging. Long-lived room ownership/account recovery requires an explicit auth model beyond this short-lived capability pairing. Browser motion estimates still pause on locked/backgrounded phones; a native phone app and OS-permitted sensing would be a separate project. The current sync is for session state and processed events, not automatic private-memo transfer or exact physical pickup counts.
