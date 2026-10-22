# Sähkö

A focus app for solo work and shared sessions, with animated orbital maps, private tasks, anonymous public rooms, a thought space, and session recaps.

[Live app](https://sahko-focus-studio.sleeksmile12.chatgpt.site/)

## Run locally

Requires Node.js 22.13 or newer. No npm dependencies are required.

```sh
npm start
```

Open http://localhost:8000. The development server uses a local SQLite database and a disk-backed photo bucket. It automatically applies SQL migrations. Development requests use a local identity; use `x-dev-user` to simulate separate accounts.

```sh
npm test
npm run build
```

The build creates a Cloudflare Worker in `worker/index.js` and a deployment bundle under `deploy/`. `python package-sources.py` optionally generates downloadable source archives before building.

## Features

- Solo and shared focus timers, task planning, and session check-ins.
- WebGL orbital maps with editable appearance, motion, colors, grain, and baked presets.
- Friends, invitations, room codes, password protection, and anonymous strangers.
- Profile photos visible only to their owner and accepted friends.
- Private thoughts with dictation, optional private WebRTC calls, and jolts.
- Recorded session recaps and PNG summary export.

## Structure

- `frontend/`: browser UI, renderer, and locally bundled libraries.
- `backend/`: authenticated API and tests.
- `server/`: local development server and storage adapters.
- `migrations/` and `drizzle/`: append-only database migrations.
- `build-fullstack.mjs`: Worker build.

## Hosting

The hosted API expects D1 as `DB`, R2 as `BUCKET`, and a trusted hosting layer that supplies `oai-authenticated-user-id`. For another host, integrate authenticated identity before using the API publicly. The local server's simulated identity is for development. WebRTC uses STUN; some networks require a TURN relay for calls.

Thoughts stay in memory for the current visit. Tasks, session history, and monthly focus totals are local to the browser. Room state, friendships, invitations, profile photos, and appearance presets use authenticated hosted storage. Recaps report recorded app activity; phone pick-ups are not measured.

This source copy excludes hosted account data, uploaded photos, credentials, and the original hosting project identity. Runtime data and generated build output are ignored by Git.

Tasks use a desktop side panel and a compact drawer above the composer. Outstanding tasks show three rows before scrolling. Tasks and voice support optional icon-only controls. The sustained-drift light reminder is on by default, with configurable delay and cycle timing, and a steady reduced-motion variant.

## Main session panel and room huddle

The main panel now contains the solid thought composer, an enlarged orbital, and a right-side icon rail for Tasks, Voice & chat, and Exit session. Each tool opens its own window. The room roster has no dropdown chevron, and the redundant Focus label is hidden. The broad arc follows the supplied reference: a solid completed section, fine dashed remainder and circular marker. It measures the entire session, including inter-block breaks and shortened initial focus/break periods, rather than resetting each block. New rooms persist their original first-focus duration for joiners. Existing rooms use their regular focus duration as a fallback.

Voice & chat opens one optional room huddle. Joining voice requests microphone permission; mute, deafen and leave operate on the real audio tracks. Closing its window keeps voice connected. Leaving the session stops huddle and individual-call media. The huddle uses a WebRTC mesh for the existing eight-person room capacity, with authenticated room-scoped SDP/ICE signaling, a separate session ID for each join, and expiring voice presence. Group chat is separate from private Void thoughts, contains at most 100 messages per room, and uses aliases for non-friends. No microphone is requested merely by opening the window. The rail is always icons with hover/focus labels; it supersedes the earlier optional icon-only setting.

Validation covers authenticated huddle signaling, anonymous chat, mute state, peer discovery, leaving and session cleanup, responsive windows, composer anchoring, actual orbital rendering and whole-session progress across shortened phases. A three-browser test exchanged offers/answers and synchronized chat/mute/leave against the local backend. End-to-end audio could not be verified because the managed Chromium policy disables non-proxied UDP. The app currently has STUN but no TURN relay; restrictive networks may therefore require relay provisioning for voice to connect. No direct UDP bypass is used in QA.


The tools share one rounded background wrap, the space navigation sits below the main panel, and the countdown shows a timer icon with its next phase. Dark mode uses black for the main panel and shader background, with neutral charcoal surrounding surfaces and synchronized light-mode transitions.

## Reference light palette

`--light-paper: #FFFEF7` now drives the light canvas, full-page surfaces, setup screens, check-in, profile, recap and PNG recap background. Light cards use `#F5F5F3`, primary text uses navy `#243047`, and secondary text remains muted green. Coral, yellow, peach, lavender and teal reference accents are shared by the recap UI and its exported image. Empty task rows use a lavender add icon and a subdued blue-gray placeholder. The orbital renderer derives its light RGB endpoint from the same paper token, so theme fades and jolt/drift reminders remain synchronized. This changes the UI palette without overwriting a baked orbital preset.
