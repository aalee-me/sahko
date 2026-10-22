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
