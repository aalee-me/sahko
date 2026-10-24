# Sähkö

Frontend and authenticated room backend for a small coworking room. Demo mode is browser-local; **Live room** connects presence, focus state, timer and jolts through the API.

## Download the Mac companion

[Download for macOS 13+](https://github.com/aalee-me/sahko/releases/download/desktop-latest/Sahko-macOS.zip) · Apple Silicon and Intel. The app provides an opt-in local activity classifier and a movable, always-on-top menu-bar panel. See [desktop setup, privacy and build instructions](desktop/README.md). Internet pairing is tested locally; production API deployment is pending hosting/cost approval.

## Edit the public demo

The shared website is https://aalee-me.github.io/sahko/. Its published files live on the `gh-pages` branch. For a quick browser edit, open https://github.dev/aalee-me/sahko/tree/gh-pages (or select `gh-pages` on GitHub and press `.`), edit a file, and commit it in Source Control. GitHub Pages publishes that branch automatically. Files there are at the root: `index.html`, `onboarding.js`, `experience.js`, `session-tools.css`, etc.

The `main` branch contains the development source in `frontend/`, plus the API in `backend/`. Editing `main` does **not** automatically change the public website. To work locally, clone the repo, use Node 24, and run `npm start`; no npm dependency installation is needed. Open http://127.0.0.1:8000. Edit `frontend/onboarding.js` for planning/cards, `frontend/experience.js` for capture/feed, `frontend/voice-memos.js` for audio, or `frontend/session-tools.css` for shared UI.

To publish local frontend edits, run `node build-github-pages.mjs`, then copy the generated contents of `pages/` into a clean checkout of `gh-pages`, commit, and push. Keep both branches in sync when making direct browser edits. GitHub Pages is a local demo; shared rooms require the separate backend. The old ChatGPT Sites mirror is a separate deployment and is not updated by GitHub commits.

## Same-Wi-Fi pairing (no hosted relay)

Use the [Wi-Fi setup guide](docs/WIFI-SYNC.md) to run the local HTTPS pairing server on your Mac. Internet infrastructure is prepared in [docs/INTERNET-SYNC.md](docs/INTERNET-SYNC.md) and `infra/companion/`, with no deployment or paid plan change.

## Run frontend + backend

Requires Node 22.13+ (Node 24 recommended). No dependency installation is needed.

```sh
npm start
```

Open http://127.0.0.1:8000. Open a separate browser profile to join as another participant. The local server uses development-only identity, binds loopback, and stores data in `work-local.sqlite`. Set `PORT` and `SAHKO_DB_PATH` to override those defaults. Do not expose the development server publicly.

## Frontend-only preview

Serve `frontend/` with any static HTTP server. Demo mode, animation, controls and board menus work independently. Live mode requires the backend on the same origin. `frontend/original-studio.html` is the supplied, unmodified reference; `orbital-engine.html` embeds its original shader and GSAP transition sequence with an app bridge.

## Backend and deployment

`backend/api.mjs` exports a standard Fetch API handler compatible with a Worker and a D1 `DB` binding. `server/dev.mjs` adapts it to Node and SQLite. Apply every numbered SQL migration in `migrations/`, in order, before serving a hosted database; request handlers never create tables.

`npm run build` embeds the frontend and vendored renderer dependencies into `worker/index.js`, and builds `deploy/dist/server/index.js` with a hosting manifest and migrations. Hosting uses the existing Sites authentication boundary. Production requests require the platform-provided `oai-authenticated-user-id` header; never trust a client-supplied identity outside that boundary. If hosting elsewhere, put a real authentication layer in front and strip incoming identity headers before injecting verified identity.

## API

All room APIs use `/api/rooms/:room/` and an `x-sahko-client` random browser-session identifier in addition to authenticated user identity. Room names contain 1–40 lowercase letters, digits and hyphens.

- `POST join` — `{name}` joins or refreshes this browser session; returns `memberId`.
- `GET state?after=0` — active members, timer, new jolt events and server time. Poll interval: 1.5 seconds.
- `PATCH member` — changes only the caller's `{task, drift}`.
- `POST jolts` — `{targetId}`; source identity is derived server-side, with a cooldown and rate limit.
- `POST catch` — `{targetId}` returns a room member to focus.
- `POST phase` — `{phase, seconds, sprint}` changes the shared focus/break phase.
- `POST timer` — `{paused, remaining}` pauses/resumes the shared timer.
- `POST heartbeat` — refreshes presence. Participants disappear after 90 seconds without a heartbeat.
- `POST leave` — removes this browser session.

Private thoughts stay in the browser session. Room-wide chat is not implemented; direct messages use the separate authenticated API. Jolts are visual feedback, not guaranteed physical haptics. The current hosted site retains its existing private audience; other accounts need site access before joining a live room.

## Checks

```sh
npm test
```

Tests cover authentication, cross-origin writes, member authorization, shared state, server-attributed jolts, rate limits, timer, catch, capacity and stale presence. Browser checks cover the original transition sequence, portrait motion, menus and two live clients.

## Planning, rooms and reports

Onboarding has five planning stages, a final review, and actions directly after each stage's content. Discovery is outside the numbered setup sequence. Room-code entry is first, with a compact, vertically aligned Join button that is filled muted gray while empty and turns brand green with white text once a code is entered. Invalid formats and missing codes shake the field, show a red outline and an inline Invalid code message; editing clears the error. Auth/access/service failures keep their distinct messages. Friends is the first browsing tab. Each room card has a main navigation target and a separate Figma-style three-avatar stack with a rounded chevron. Extra members appear as +N; no names appear on the closed card. The stack reveals an anchored, read-only roster that closes with Escape or an outside click. Interactive member info is available only after opening the room, in a two-column grid. Access appears as small muted text beside the room title; the horizontal navigation arrow stays edge-aligned. Block count precedes remaining time in both listing and details. Plan a session is the final card. Existing-room previews show only current participants, and every room moves to aerial view on hover/focus. The landing preview starts with the original 5p orbital; later maps follow participant count. One continuous semicircular progress arc follows the same camera, without a numeric badge or separate segments. Portrait nodes retain identity, and preview positions interpolate as camera/layout changes.

Tasks remain local, with automatic tentative rows and swipe deletion. This session uses the neutral rounded container, with previous unfinished tasks below it, with one Disregard all action and an individual × on each row. Checkbox labels provide a full clickable area and use a filled circle and strikethrough when selected, without checkmark decoration. Joining asks: What tasks or to-do list items are you looking to check off tonight? Body/task text and room metadata use larger, consistent type and spacing; setup portraits are slightly smaller. Deleting a task or disregarding outstanding tasks fades and collapses the vacated space over 320 ms; reduced motion removes immediately. Completion controls expose readable Mark done / Mark incomplete tooltips on hover or focus. All onboarding previews have named portraits with consistent off-white outlines and +4px horizontal/−8px vertical name-tag offsets, with full-color photos and a clean initial fallback when a photo is unavailable. The landing page stays dark; subsequent setup screens use the shared light palette. No prior-session recap appears on landing. The top-right profile picture opens Sessions, Friends and Invitations in a dedicated profile view. Session reports (`sahko-session-history-v1`, most recent 20) contain elapsed time, completion status, planned durations, task completion and remaining tasks. Recording starts at session start, updates every 15 seconds, and ends on completion, leaving the page or beginning a new plan. Reports cannot reconstruct older unrecorded sessions and do not sync between devices. The authenticated `GET /api/friends` endpoint lists only the caller’s accepted friendships and pending requests, including offline friends, without exposing account identifiers.

The timeline and focus control come first. Focus → break → number of Blocks reveals in place through persistent controls and animated expansion, preserving focus and dial state. Focus, break and Blocks accept typed values, drag, wheel and arrow keys. Duration dials spring to the nearest value after overshoot. Break presets include 3, 5, 10, 15 and 20 minutes. New setup defaults to 5 Blocks. Below Blocks, choose a count or a specific finish time. Finish time supports compact vertical hour/minute/AM-PM wheels and typed 12/24-hour times. Switching between Blocks and finish time uses an animated selection indicator and an expanding clock area. Blocks remain editable; changing the count returns to By Blocks without a calculated label. Break reminder preferences begin collapsed, with the chosen option on the right. The shared schedule calculation derives Blocks and abridges the first focus/break as needed, including overnight schedules. Projected finish uses the exact typed minute even when the current time has fractional seconds. Migration 0005 stores the first break duration for matching server timing.

Room discovery only exposes rooms the caller may access. Public rooms use persistent anonymous aliases; friend rooms require an accepted friendship. Account identifiers are not serialized to clients. The Room tab restores the existing group when Solo is a view into that room. A standalone solo session browses rooms through an explicit Room action. Horizontal swipes never select friends, browse room tabs, or match into a room. Joining opens private goals first. With no eligible room the solo session continues; no demo or empty room is silently created. Joining inherits the existing room's clock.

## People, motion and themes

People appear behind a Figma-style avatar-stack dropdown in the upper right at all sizes. Solo shows only the current user; Room restores the full room roster. Rows show Focusing or Idle. Hover/focus opens a compact side menu. Add friend sends a request that must be accepted. Dots in the people list indicate unread direct messages only. Step away / I'm back is in the self menu. Name tag defaults are horizontal +4px and vertical -8px. Selected portraits have no halo.

Drift begins at the configured baseline of 0.1 radians/second and rises gradually toward five times that speed over three minutes. Jolts shake drifting portraits and slow their orbit to 42% of its current target speed for three minutes; velocity eases into and out of the slowdown. Multiple distinct senders increase shake intensity. Only drifting people can be jolted on the client and server. Inactivity for 90 seconds, or leaving the tab for 20 seconds, marks the user as drifting. A centered, dismissible popup offers a return to focus without stopping the clock.

Settings is available in the top-right session and onboarding headers. It includes Dark, Light and Device appearance, room fallback preferences and the existing shape, motion, portrait and color controls. A shared semantic palette and a single interpolated theme value drive all UI surfaces and text, the WebGL scene, and the shader's surface background. Theme fades last 0.7 seconds, with a temporary dark landing/light setup override that smoothly restores the saved session theme when onboarding closes; no component runs an independent color transition. Optional drift light reminders use the same fade with an interval of 0.5–60 seconds (short intervals blend rather than completing a full light/dark cycle); reduced motion disables the repeated cue. The centered away prompt softly enters light mode and holds it while open, suppressing the repeated reminder cue; closing it restores the saved appearance. Appearance preferences and friends-only fallback are saved on this device.

Peak transitions preserve the original collapse/hold/rise shader and GSAP sequence. Participant anchors match stable identities; arrivals/departures pop in/out. Starting or joining a session primes the visible cloud with the existing participants while the joining user is absent. After a short visible hold, the user arrives through the original dip/hold/rise transition; reduced motion skips the staged hold. The live roster and timer keep their actual server state throughout the visual arrival. Portrait reposition duration, easing presets and a custom cubic Bézier remain editable. The camera fits narrow aspect ratios rather than clipping the cloud; portrait stacks use square dimensions and image-error replacements retain their roster positions. The shared theme emits integer RGB channels accepted by the bundled THREE.Color parser, covered by a regression check across both fade directions. The renderer uses at least 1.5x resolution within its pixel budget, with editable film grain defaulting to 0.16. The original uploaded studio is unchanged.

## The void and communication

The void is a separate neighboring space reached by the dotted Sähkö mark inside the composer, clicking the thought-history rail, swiping right, or Alt+Right. The mark fills and spins on hover/focus with rounded strokes. Typing and sending remain inline on the orbital, with mic and send controls; entering and leaving the Void moves the same composer and preserves its draft. Swiping left or its back arrow returns to the orbital. Thoughts become selectable stars with timestamps, subtle grain, and connector endpoints measured from the actual dot centers independently of text height. The composer includes Enter to send, Shift+Enter for a line break, and browser speech dictation where supported. The orbital's thought trail shows one fading message at a time and supports wheel, touch and arrow-key browsing. At check-in the same composer moves into the task screen.

Thoughts stay in memory for the current visit, are never posted to the backend, and clear on reload/leaving. Dictation may use the browser vendor's speech service; transcripts become editable drafts without automatic sending. Direct messages are separate and authenticated, with polled delivery and inbox reads limited to the last hour. Voice/video use WebRTC and STUN with user-granted camera/microphone access; no TURN relay is configured. Demo participants cannot receive real messages/calls.

Room clocks advance through phase boundaries and continue while the void, drift prompt or full-screen break check-in is open. The final focus block completes the session and opens a summary with actual elapsed minutes, completed/total tasks, the planned Block count, and start/end times. Task edits there update the saved profile report. No group break extension is offered. Optional return sounds require unlocked browser audio and an open app; insistent reminders repeat every five seconds for up to five minutes, stopping on response. Browser notifications require an explicit opt-in. Closed-app delivery, server Web Push, native Dynamic Island and activity detection in other apps are not implemented.

## Room access and invitations

Migration 0006 adds room titles, password hashes, invitation records and password-attempt counters. New group setup offers a room title, editable unique join code, Open/Password protected access, and active-first friend invitations. Friends room and Open room settings are dedicated setup subpages. Friend search filters existing friends by name or handle, both when inviting and in the profile. Who’s joining choices shade on hover/focus. Offline friends remain selectable with muted styling. Goals are editable before joining an existing room. Passwords are held only in the current form, excluded from saved plans, hashed server-side with PBKDF2-SHA256 (100,000 iterations and a random per-room salt), and never serialized in room previews/state. Wrong passwords are limited to eight attempts per account/room in ten minutes. Code collisions do not overwrite or silently join another room.

`GET /api/rooms/:code/preview` returns authorized room information for code/invitation entry. `POST /api/rooms/:code/invites` lets the host invite accepted friends; `GET /api/invites` returns only the caller's pending invitations. Invitations persist for inactive recipients, appear in their profile and are marked joined on successful entry. They are in-app records; no email or closed-app push is sent. Password-protected invitations still require the password. The room dropdown exposes a copyable join code. Creating or attempting to join another room preserves the existing membership until the join succeeds.

A bottom pill guides the spatial order Void · Solo · Room, with a sliding selection indicator and keyboard navigation. Swiping right opens the Void and swiping left returns; room navigation is explicit. The void also opens from its dedicated entry or thought-history shortcut. All disclosure chevrons use rounded vector strokes rather than clipped text glyphs.

## Live studio and baked presets

Settings uses a non-modal inspector beside the running renderer. Drag its header to move it, resize its corner on desktop, or use header arrow keys. On small screens it becomes a short bottom panel. Compact view has its own corner resize handle (pointer/touch and arrow keys), width/height inputs and Reset size; the cloud and camera reflow while preserving the composer. The size is remembered locally and included when baking a preset. Settings remains accessible from the compact header.

Film grain accepts 0–4, with separate 0–2 controls for Void grain and thought texture. Thoughts support dragging and arrow-key positioning; hover/focus strengthens their glow. Constellation connections have been removed. Positions and timestamps stay with private thoughts in memory for this visit and survive navigation away from/back to the Void. They are not sent with appearance presets.

Floating avatar names appear on hover or keyboard focus; people lists retain names. Setup subtitles and redundant descriptive copy are removed while schedules, access information and functional messages remain. The Void mark enlarges on hover and zooms into a circular reveal on entry. Settings offers reveal duration, easing presets and custom cubic Bézier coordinates, all captured by Bake and validated server-side. Older presets use the default reveal curve. Entry/exit handles rapid reversals, restores composer focus and respects reduced motion.

Bake preset saves all appearance/motion slider values, colors, easing, map selection, theme and compact dimensions. Migration 0007 adds `appearance_presets`; authenticated GET/POST `/api/appearance-preset` reads/writes only the current account's row, independent of browser/session ID. Inputs are bounded to the supported controls and unknown fields are omitted. The browser also caches the preset in `sahko-baked-preset-v1`; offline/unauthenticated saving explicitly reports device-only storage. Export preset downloads a JSON copy. Fonts and private thoughts are not included.

Future iterations must preserve the preset restore path: an existing baked preset overrides source defaults on startup, so deployed visual changes do not erase the user's baked choices. Reset appearance previews source defaults; Bake commits them only when explicitly chosen. Changing control bounds/schema should preserve or intentionally migrate saved values. Defaults are used when no preset exists. Settings edits remain live drafts until Bake; the preset status reports whether saving synced to the account or only to the device.

## Thought trail, task access and session feedback

Thought sends rise and fade from the composer. The session trail scrolls continuously with wheel/touch, keeps older messages dimmed and blurred above the selected message, supports arrow-key browsing, and fades after inactivity. Clicking the history rail still opens the Void. The Void composer retains its screen position, draft and dictation controls during entry and exit. Its mark toggles a reversible circular reveal; Settings is available inside the Void, with duration, custom easing and start/midpoint/end opacity controls included in baked presets. Empty Void guidance reads “Your thoughts will go here.” Private thought positions remain in memory only.

Tasks beside the timer opens an editable task panel. This session uses the filled container; outstanding tasks remain below without the filled box. New tentative rows expand smoothly as the preceding row is populated. The full-screen break/session check-in asks “What’s still on your plate?” and keeps both tasks and thought capture available.

Avatar-stack hover/focus labels identify each person individually. The mic beneath People opens a person picker wired to the existing private WebRTC voice calls; it does not claim a room-wide group channel. Calls include microphone mute/unmute. Real calling needs browser media permission and compatible peer connectivity; this implementation has STUN but no TURN relay.

Jolts add a visible expanding lightning ripple and stronger avatar shake. A jolt received by the current user softly changes the shared theme to light for two seconds, then restores it; repeated jolts extend the hold instead of restarting flashes. Other active prompts retain their theme override until dismissed. Synthesized, quiet chimes accompany thought sends, completed tasks and jolts. Chime volume is adjustable down to zero and included in Bake; browser audio starts only after user interaction.

Orbital colors offers Original, Aurora, Ember, Tide and Mono. Hover/focus previews colors in the real renderer; click selects a scheme, and Bake preserves it across future iterations. The renderer's six shader color stops update independently of orbital geometry and participant count. Existing presets default to Original. All new appearance values and palette names are validated server-side.

Focus and Break headers are visible together on initial rhythm setup. Break stays collapsed and unavailable until Set focus, then opens smoothly; Number of Blocks follows Set break. Confirmation buttons use solid brand green with white text, and break-reminder choices/summary use matching 16px type. Who’s joining uses aligned vector icons for solo, friends, public access and joining a room. Selected choices use background shading, and task completion uses a filled circle and strikethrough rather than checkmark glyphs.


The thought composer is bottom-docked above the space-navigation pill in Room, Solo and Void, and follows viewport resizing. Void entry/exit retains the same composer position. Timer options are grouped with Tasks under the clock; voice chat remains with People. Dismiss/delete × controls use transparent backgrounds. Room access is plain muted inline text rather than a badge.

New orbital portraits remain hidden until a valid renderer position is available, avoiding a frame at fallback coordinates. Avatar presence dots are removed; unread-message dots in the People list remain distinct.

Profile → Upload photo accepts JPG, PNG or WebP up to 10 MB, center-crops to a 160px JPEG in the browser and saves the result to the signed-in account. Remove photo clears it. Migration 0008 stores account-owned photo references in `profile_photos`; resized JPEG bytes are stored in the private R2 `BUCKET` binding. Original uploaded files are not retained. Authorized photo reads are cached briefly in the Worker. `POST /api/me/avatar` is authenticated, validates JPEG data and supports removal with `image:null`; `GET /api/me` returns the caller's own photo. Room directory, room previews, room state and friend lists expose real photos only for self and accepted friends. Strangers retain anonymous avatars. Photos are excluded from appearance presets.

The local Node server provides a disk-backed photo bucket in ignored `.sahko-photos/` (override with `SAHKO_PHOTO_PATH`), so profile uploads work in the downloadable full-stack version as well.

## Anonymous company and avatar identification

Person identifiers in the People stack and room rosters open below the hovered/focused portrait, with a viewport-edge fallback. Avatar borders follow their surrounding surface across dark/light transitions by default; Settings → Match avatar borders to background can be disabled for a custom outline, and Bake preserves that choice. Header and room-card portraits use their own surrounding surface colors.

The mixed demo includes an anonymous participant. Available rooms also includes an Open studio preview with three anonymous participants; the Friends tab excludes that preview. Entering a demo room now uses that room's actual preview roster plus the current user, instead of always loading the friends demo. These previews do not create fake live members. Non-friends use stable alias labels and abstract anonymous portraits, including pending friend requests. Real photos remain visible only to self and accepted friends under the existing backend checks. Public live rooms continue to show actual signed-in participants anonymously to non-friends. Voice remains optional private calls; this iteration does not add persistent channels or a room-wide call.

## Reference palette and session recap

Pastel applies the supplied wireframe colors to the orbital shader: lavender `#b9a6ed`, teal `#a1dfd5`, lime `#e7ff77`, yellow `#ffe13d`, peach `#ffbf9f` and coral `#ff969f`. It is the new default without changing shape, camera, grain or motion. In response to this explicit palette change, older presets adopt Pastel for their colors while retaining their other settings. Bake now records `paletteRevision:2`; color choices baked after this update are preserved normally. Original and the other palettes remain available.

The end-of-session task check-in offers View recap; Profile → Sessions also opens historical recaps or Session so far for a running record. The responsive, light recap follows five screens: time, tasks, thoughts/voice, jolts/drift events, and an export card. Arrow keys, touch swipes, dots and Next/Previous navigate it. Save image creates a PNG, using native file sharing on supported mobile browsers and downloading elsewhere. The share card contains aggregate counts, not private task or thought text.

New session records measure time in focus/break phases (excluding pauses), connected call time, completed focus cycles, task completion, thoughts, self-sent/received jolts and transitions into drift. Live jolt IDs are deduplicated before recording. Completed cycles handle phase skips while the browser is throttled. Focus time is timer-phase time, not a claim that the app can verify attention. Monthly focus totals are tracked from this update forward in `sahko-focus-months-v1`; session records remain in local `sahko-session-history-v1` with its existing 20-record retention. Earlier reports show elapsed session time and explicitly omit metrics that were not recorded. No phone-pickup data or desktop app-usage measurements are invented. The existing task check-in remains editable before opening the recap.

## Task drawer, direct thought scrolling and drift reminders

Outstanding tasks show at most three 52px rows in a native scroll area. Its lower edge fades while more rows remain; after scrolling, the upper edge fades instead. Tasks now opens a non-modal panel on the right of the desktop layout and a drawer above the composer in compact/mobile layouts. The trigger sits above the composer, with an unfinished-task count; timer controls stay under the clock. Opening the Void closes the task drawer. Back arrows have a padded 44px hit area.

The thought trail uses native wheel/touch scrolling instead of restarting a smooth-scroll animation on every wheel event. The history rail forwards wheel deltas directly, and its tick widths and opacity graduate with distance from the selected message. Pointer-down no longer opens the Void; a completed click still does. Keyboard arrows browse the existing list without rebuilding it.

Tasks and voice controls show meaningful icons with labels by default. Settings → Icons only · Tasks & voice toggles the compact version; tooltips and accessible labels remain. Bake includes that choice.

The drift light reminder is enabled by default, beginning after 45 seconds of sustained drift. Its delay and existing cycle interval remain editable. It alternates the shared theme with 1.4-second fades at the default 15-second cycle, including when the centered drift prompt remains open. It stops on refocus, pauses, breaks, completion, or leaving the active view; reduced motion uses a steady light reminder. The elapsed drift threshold survives temporarily hiding the tab. Bake saves the enabled state, interval and delay. This supersedes the earlier opt-in-only default.

## Main session panel and room huddle

The main panel now contains the solid thought composer, an enlarged orbital, and a right-side icon rail for Tasks, Voice & chat, and Exit session. Each tool opens its own window. The room roster has no dropdown chevron, and the redundant Focus label is hidden. The broad arc follows the supplied reference: a solid completed section, fine dashed remainder and circular marker. It measures the entire session, including inter-block breaks and shortened initial focus/break periods, rather than resetting each block. New rooms persist their original first-focus duration for joiners. Existing rooms use their regular focus duration as a fallback.

Voice & chat opens one optional room huddle. Joining voice requests microphone permission; mute, deafen and leave operate on the real audio tracks. Closing its window keeps voice connected. Leaving the session stops huddle and individual-call media. The huddle uses a WebRTC mesh for the existing eight-person room capacity, with authenticated room-scoped SDP/ICE signaling, a separate session ID for each join, and expiring voice presence. Group chat is separate from private Void thoughts, contains at most 100 messages per room, and uses aliases for non-friends. No microphone is requested merely by opening the window. The rail is always icons with hover/focus labels; it supersedes the earlier optional icon-only setting.

Validation covers authenticated huddle signaling, anonymous chat, mute state, peer discovery, leaving and session cleanup, responsive windows, composer anchoring, actual orbital rendering and whole-session progress across shortened phases. A three-browser test exchanged offers/answers and synchronized chat/mute/leave against the local backend. End-to-end audio could not be verified because the managed Chromium policy disables non-proxied UDP. The app currently has STUN but no TURN relay; restrictive networks may therefore require relay provisioning for voice to connect. No direct UDP bypass is used in QA.

The session tools now share one rounded background wrap. The Room/Solo/Void switcher sits below the main panel, and a timer icon labels the countdown as “until break,” “until next focus block,” or “until session ends” for the final block. Dark surfaces use a black main panel with neutral charcoal surroundings; the shader background and semantic UI palette share the same black-to-light interpolation.

## Reference light palette

`--light-paper: #FFFEF7` now drives the light canvas, full-page surfaces, setup screens, check-in, profile, recap and PNG recap background. Light cards use `#F5F5F3`, primary text uses navy `#243047`, and secondary text remains muted green. Coral, yellow, peach, lavender and teal reference accents are shared by the recap UI and its exported image. Empty task rows use a lavender add icon and a subdued blue-gray placeholder. The orbital renderer derives its light RGB endpoint from the same paper token, so theme fades and jolt/drift reminders remain synchronized. This changes the UI palette without overwriting a baked orbital preset.

## Mobile presentation demo

Open `/mobile.html` for the phone-sized clickable prototype. On a desktop browser, the external checkpoint buttons skip between Landing, Tasks, Rhythm, Rooms, Focus, Break, Check-in and Recap without waiting through a full timer. On a phone the presentation frame disappears and the app fills the viewport. The mobile route runs the same frontend and backend as the desktop app, with a mobile layout, persistent tasks and working room, thought, check-in and recap flows. Demo phase shortcuts are blocked in shared live rooms so they cannot alter other users' timers. Use `npm start`, then open `http://localhost:8000/mobile.html`; the desktop app remains at `http://localhost:8000/`.

The visual references are the mobile screens supplied in the conversation. The linked Figma file was inaccessible in this session; exact parity with any additional frames in that file is not verified.

## Final demo validation

Two local browser accounts exercised room creation, invalid room codes, password rejection and successful joining with goals, task completion, icon tooltips, shared chat, a remote jolt with recipient light transition, temporary drift slowdown, delayed reminders, refocus and leaving. The Void composer stays near the viewport bottom, including compact view; timestamps remain attached to thoughts, chronological lines connect the actual dots and update when dragged, and the newest line animates outward. The global progress label is below the arc. Each tool icon has a transparent individual background inside the shared pill. Separate mobile checks cover the full demo checkpoints, task persistence, Void entry/exit, break, check-in, recap and responsive phone sizing. WebRTC audio still has the previously documented managed-network verification limit.


## Private golden palette

The hosted desktop and mobile app now use owner-only access. Controls, focus indicators, selection fills and onboarding progress use warm golden yellow and amber instead of green; the light paper remains `#FFFEF7`. The animated brand and Void marks use the exact lowercase `o` Bezier outline extracted from the user-uploaded Riant Display Bold font. The requested glyph is embedded as a vector, so the full font is not needed by the browser. The timer caption is now an accessible label on a 28px icon: white on dark surfaces and navy on light surfaces, with no visible “until break” text.


## Anchored controls and return to focus

The composer and icon-based Void/Solo/Room pill share one fixed bottom dock, with separate hit areas and keyboard-aware positioning. The same composer anchor is used inside the Void. Solo sessions hide the self-roster, self popover and unavailable voice tool; switching to Room opens the room browser. Thought history centers the complete selected message with its timestamp, supports native wheel/touch scrolling and keyboard browsing, and ignores accidental rail clicks after scrolling.

Meaningful pointer movement resets the inactivity detector. If already drifting, it reveals an explicit “I’m back” action that restores focus and stops the reminder effects; mouse movement alone does not claim focus. Simulate session runs a local 30-second focus/break/focus preview through the normal check-in and completion flow. It is disabled in shared live rooms.

Browser checks cover complete long thoughts, wheel/rail/keyboard history navigation, consistent desktop/mobile composer placement, solo navigation, mouse-return action, exact Riant glyphs, clock styling and the full simulation.

## Demo clock and recap

Settings → Demo time → Simulate time lets you choose 3 AM or enter an exact local time. The simulated clock keeps advancing. Planning and new thought timestamps use it; elapsed focus/break countdowns and shared room timers use the real clock. Turn it off to restore device time. The setting stays on this browser until changed.

Click the plan preview in room setup to review it; “Review session” is a caption beneath the preview. Past-session cards also open their recap directly. Recaps show recorded focus/break/idle/paused periods and private-thought markers when available. Older records without activity events show a clearly labelled planned focus/break timeline.
