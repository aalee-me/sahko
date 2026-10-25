# Into the Clouds — additive demo

The existing Void remains the private bottom tier. A new anonymous public tier sits one viewport above it. Opening the Void always starts at the bottom; the tether, normal upward scroll or a swipe reveals Into the Clouds. Existing text/voice capture, dragging, chronological organization, undo and the original portal transition remain available.

## Try it without hosting or paid APIs

- The GitHub Pages build automatically uses the **Local demo** store. No Cloud API requests are sent from that build. Released copies and reactions are shared between tabs of the same browser/origin; they are not shared across the internet.
- Open the site in two separate tabs. Release a short typed thought in one tab, then visit Into the Clouds in the other and hold space. The originating tab's tether pulses quietly. Browser tabs use separate anonymous viewer tokens.
- `npm start` runs the prepared shared API against local SQLite. Development mode enables Clouds locally. It requires no external service, paid API, subscription or deployment. `SAHKO_CLOUDS_ENABLED=0 npm start` disables it.
- Local demo releases are never automatically uploaded if a backend is added later. API mode and local demo mode are labeled explicitly. A failed shared write stays an inline error; it does not silently create or upload another copy.

## Private storage and deliberate release

Typed Void thoughts and positions persist in localStorage. Voice blobs, durations, waveforms and transcripts persist only in the browser's private IndexedDB. Blob URLs are reconstructed locally after reload. If device storage is unavailable, the app retains the current in-memory session and shows an inline storage message. No voice, transcript, position or private thought collection is sent to the public endpoints.

Click an existing typed thought to reveal Release copy into the clouds / Copy text. A public release leaves the original untouched, animates a duplicate straight upward, and adds a two-dot navigation marker beside the private node. Voice nodes have no public-release menu. Native clipboard paste remains enabled in the original textarea.

A release is 1–160 Unicode characters. Both browser and server reject the link forms in the shared policy: HTTP(S), `www.`, and the supplied common-domain expression. Plain markup is rendered as text, never HTML or links. Public thoughts are anonymous and reaction-only. There is no text-reply endpoint or UI.

## Shared API (prepared, not deployed)

All endpoints are under `/api/clouds/` in `backend/api.mjs`, delegated to `backend/clouds.mjs`.

| Method/path | Body | Response |
| --- | --- | --- |
| GET thoughts | none | up to 100 active thoughts with id, text, timestamps, resonance count, own/held flags |
| POST thoughts | text, nonce | published copy; nonce makes retries idempotent |
| POST thoughts/:id/resonance | active boolean | updated silent reaction state |

The browser supplies an unguessable `x-sahko-cloud-client` token. The server stores a hash and never returns author/account/profile data or token hashes. No signed-in account is needed for this deliberately anonymous space. Cross-origin requests are rejected, requests are bounded to 2 KB, replies/audio fields are rejected, and each anonymous token is limited to five releases per minute / twenty per hour and thirty new reactions per minute. Repeating an active reaction is idempotent; the author cannot react to their own copy. Public copies expire after 24 hours. Private originals do not expire.

The prepared Worker defaults to **disabled** unless `CLOUDS_ENABLED=true` is configured. Apply `migrations/0012_clouds.sql` along with the existing migrations, bind DB, and set a deployment-specific `CLOUDS_HASH_SECRET` only after choosing and approving a host. No backend deployment or billing change was performed for this feature. Internet deployment should add edge/IP rate limiting and a reporting/moderation process; anonymous per-token limits are suitable for this demo but can be evaded by minting new tokens.

Polling runs at most every 30 seconds while the Void/Clouds is open and only if viewing the public tier or checking a released copy. Local cross-tab reactions use BroadcastChannel/storage events. No push notifications, toast notifications, replies, external AI/transcription APIs or background uploads are added. Motion parallax is optional and enabled through a user gesture; reduced motion freezes ambient movement.

## Capture Constellation

Capture exports a PNG locally using an offscreen canvas; it makes no network request. Geometry only (redacted) is the default. Show text includes the thought labels. A timestamp watermark is included in both modes. Export uses up to 3× resolution, bounded to approximately 4096 pixels per canvas dimension. The private constellation's current positions and connections are preserved; voice audio is never embedded in an image.

## Validation

`backend/clouds.test.mjs` covers feature gating, anonymous privacy, origin checks, validation, nonce retries, reaction uniqueness/undo, expiry and rate limits. `tests/clouds.cjs` exercises private-first navigation, cross-tab local resonance, unchanged originals, voice exclusion, native clipboard paste, local persistence and redacted/high-resolution PNG export.
