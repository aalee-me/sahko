# Free internet rooms and phone pairing

The GitHub Pages app uses PeerJS Cloud for free signaling and WebRTC data channels for session traffic. No hosting account, paid API key, paid plan, TURN subscription, or database deployment is configured. See https://peerjs.com/client/faq and https://peerjs.com/server/cloud for the service's current terms and limitations. The community signaling service has no availability guarantee; it is appropriate for this demo.

## Use it

1. On https://aalee-me.github.io/sahko/, create an **Open** session. Share its room code with another person; they use **Search for room** to join. Password-protected rooms still require the password. **Closed** sessions remain personal.
2. Each browser/device is a separate participant. Everyone receives the same roster, timer and jolts. The room owner controls the shared timer and can transfer that role.
3. To mirror a desktop onto your phone, open the desktop icon → **Connect phone → Show connection code**. On the phone, open the same GitHub site, choose the desktop icon → **Enter code**, and enter the large code. The phone mirrors the same session instead of counting as another participant. Its opt-in pickup estimates are attached to that session.
4. Codes expire after ten minutes and can be used once. A new code invalidates the old one. **Disconnect phone** revokes the viewer token. The code is not the room password.
5. Keep the connection host's original Sähkö tab/app open. You may float the compact view. Closing or refreshing the connection host ends its in-memory relay, even after transferring room ownership to someone else. Transferring timer controls does not migrate the connection host. A disconnected participant can rejoin while the host is still open.

## What this demo can and cannot do

- Works across networks when the browsers can establish a WebRTC connection. It does not require being on the same Wi-Fi.
- STUN-only by design. No paid TURN fallback is configured. Some school, corporate, mobile, VPN and symmetric-NAT combinations block direct connections; the app reports a connection error. It does not silently replace a failed live room with fake people.
- Invite codes provide discovery. There is no globally indexed public directory. Rooms previously shared with this device can appear locally; search by name/friend only applies to rooms already known to that device.
- PeerJS sees signaling identifiers and connection metadata. Connected devices exchange network addresses. Session API traffic is encrypted by WebRTC and processed by the connection host. Do not describe this as anonymous networking or end-to-end encrypted against the room host.
- Tasks, private Void text, voice memos and recap archives keep their existing local storage. Joining a room does not upload them. Voluntary room task/status updates and explicitly sent messages follow the existing room API. There is no shared cloud photo store or cross-session account database in this mode.
- A phone companion stores its viewer token on that phone. The internet host's writer token is scoped to that running page. It is discarded on reload because the in-memory relay also ends. Generate a fresh connection code after restarting the host.
- The separate local HTTPS Wi-Fi server remains available: [WIFI-SYNC.md](WIFI-SYNC.md). No existing Sites backend was deployed or paid plan changed.

## Implementation and handoff

`frontend/internet-sync.js` adapts existing API calls to PeerJS. Libraries load only when a room/pairing is requested. Each connection host runs the existing `backend/api.mjs` and `backend/companion.mjs` against SQLite in WebAssembly. `build-github-pages.mjs` copies those modules and schema migrations to `pages/peer-backend/`; it adjusts the shared cloud-policy import for that output directory. The Clouds API stays disabled in this relay.

The receiving host assigns identities from the actual data-channel peer, ignoring supplied authentication headers. It scopes room and phone connections, caps message sizes and request rates, and keeps existing membership/password/owner/capability checks. Room and pairing IDs have separate namespaced signaling addresses. Phone tokens are validated by the same companion API as the local/server deployment.

Pinned dependencies are vendored with their MIT licenses: PeerJS 1.5.5, sql.js 1.13.0. Only public signaling and STUN are used in production. Private keys or service credentials are not embedded.

For real connectivity verification on an unmanaged test browser, `tests/internet-multiplayer.cjs` runs a temporary local PeerServer and four separate browser profiles using real WebRTC, checking passwords, membership/owner permissions, roster/timer sync, jolts, phone pairing, reload and revocation. It uses the same application adapter and SQLite/backend modules as production; no fake data channel is substituted. In this managed environment it explicitly skips because Chromium policy disables non-proxied UDP. `tests/internet-protocol.cjs` separately verifies the API, authorization, UI, pairing and lifecycle through a controlled test data-channel fixture; it does **not** verify WebRTC or the public signaling service. The test-only local signaling configuration is supplied with `addInitScript`, not a URL parameter or a user-facing setting. It needs Playwright and `peer@1.0.2`; run `node build-github-pages.mjs` first. Point `PLAYWRIGHT_MODULE` and `PEER_SERVER_MODULE` at those installed test dependencies when they are outside the checkout.
