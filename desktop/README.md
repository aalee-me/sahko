# Sähkö for macOS

Download the universal Apple Silicon/Intel demo: https://github.com/aalee-me/sahko/releases/download/desktop-latest/Sahko-macOS.zip

Requires macOS 13+. Unzip, move Sahko.app into Applications and open it. This demo is ad-hoc signed, not Apple notarized; macOS may require approval for this specific app in System Settings → Privacy & Security → Open Anyway. Do not disable Gatekeeper globally.

Click ö in the menu bar to reveal the movable, pinnable panel. Right-click it for the session window, settings or quit. Monitoring starts off and is opt-in in Settings. Foreground apps and elapsed system idle time are classified locally. Optional browser Automation reads only the current domain into temporary local memory. There are no screenshots, recordings, keystroke hooks, window-title collection or uploads of raw app names/URLs.

Customize deep-work, neutral and distracting buckets. Brief reference switches receive a two-minute grace period; configured off-task domains drift after 90 continuous seconds. Prolonged inactivity still drifts. Reading mode extends, rather than removes, the idle limit. Spotify playback detection is optional. YouTube audio exemption is manual; automatic detection across browsers is not implemented. The app does not inspect video content or infer whether a lecture is relevant.

## Same-Wi-Fi pairing

Version 0.6 adds a Wi-Fi relay address in Mac Settings. Follow [the setup guide](../docs/WIFI-SYNC.md): run the separate local HTTPS relay from this source checkout, trust your own development certificate on the phone, select Use Wi-Fi before starting a new session, then pair from the same local address. Hosting is not required. The Node relay is not bundled into the app.

## Internet pairing

**The pairing API is implemented and tested locally, but production deployment is pending hosting/cost approval.** The download works as a local desktop companion, and same-Wi-Fi pairing uses the separate local relay above. Internet pairing requires a separate hosted API; GitHub Pages cannot host it. See [the infrastructure plan](../docs/INTERNET-SYNC.md).

After deployment, create a ten-minute, single-use pairing code in Mac Settings. On your phone open https://aalee-me.github.io/sahko/ and choose Pair desktop. Only the processed state, optional approved broad activity tag, room display and timer information are transmitted over HTTPS. Pair credentials use macOS Keychain; the phone has a separate read-only capability, with permission to send a jolt to a drifting person. Revoke phone access in Mac Settings. Desktop must remain awake and online. Presence is polled every two/three seconds; this is not a background iOS service.

## Edit and build

Open the repository in VS Code or Xcode. Native source is in `desktop/Sources/`; UI is in `Views.swift`, classifier in `SahkoCore/Classifier.swift`. Website source is in `frontend/`. Run `npm start` from the repository root to edit the website locally.

On a Mac with Xcode command-line tools, run `bash desktop/build-app.sh`. It runs classifier tests, compiles both architectures, signs the bundle ad hoc and creates `desktop/output/Sahko-macOS.zip`. GitHub Actions runs the same build and publishes the demo release when desktop source changes on main. No paid signing account or hosting purchase is included.

Version 0.4 keeps the panel visible when another app becomes active (`hidesOnDeactivate = false`). Keep above other apps and show on app switch are saved display preferences. Auto-show applies only after the web session reports an active session; it does not activate Sähkö or take keyboard focus. Local monitoring still starts off. Settings offers a one-click menu to categorize the current app, plus optional Spotify and Apple Music playback detection. Background playback does not exempt distracting domains.

The website also offers a floating compact view using Document Picture-in-Picture in supported desktop Chromium browsers, with interactive controls. It must be opened with a click first; automatic PiP on tab changes remains controlled by browser support and permission. The browser cannot inspect other applications; local app detection requires this Mac companion. The original session tab must remain open for the web floating timer to update.

Paired-phone pickup estimation: the phone explicitly enables motion permission and calibrates while still. A sustained tilt/movement after calibration creates a likely-pickup event, with a cooldown to avoid double counting. The relay accepts only session ID, event ID, kind and time, and rejects raw sensor fields. The desktop associates and deduplicates those events with its existing history record. Browser detection pauses when the phone page is hidden; background/locked-screen detection is not supported. Deploy migration `0011_phone_motion.sql` with the matching relay API before enabling this workflow.
