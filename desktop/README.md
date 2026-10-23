# Sähkö for macOS

Download the universal Apple Silicon/Intel demo: https://github.com/aalee-me/sahko/releases/download/desktop-latest/Sahko-macOS.zip

Requires macOS 13+. Unzip, move Sahko.app into Applications and open it. This demo is ad-hoc signed, not Apple notarized; macOS may require approval for this specific app in System Settings → Privacy & Security → Open Anyway. Do not disable Gatekeeper globally.

Click ö in the menu bar to reveal the movable, pinnable panel. Right-click it for the session window, settings or quit. Monitoring starts off and is opt-in in Settings. Foreground apps and elapsed system idle time are classified locally. Optional browser Automation reads only the current domain into temporary local memory. There are no screenshots, recordings, keystroke hooks, window-title collection or uploads of raw app names/URLs.

Customize deep-work, neutral and distracting buckets. Brief reference switches receive a two-minute grace period; configured off-task domains drift after 90 continuous seconds. Prolonged inactivity still drifts. Reading mode extends, rather than removes, the idle limit. Spotify playback detection is optional. YouTube audio exemption is manual; automatic detection across browsers is not implemented. The app does not inspect video content or infer whether a lecture is relevant.

## Internet pairing

**The pairing API is implemented and tested locally, but production deployment is pending hosting/cost approval.** The download works as a local desktop companion before deployment. Creating a pairing code requires the separate API to be deployed; GitHub Pages cannot host it.

After deployment, create a ten-minute, single-use pairing code in Mac Settings. On your phone open https://aalee-me.github.io/sahko/ and choose Pair desktop. Only the processed state, optional approved broad activity tag, room display and timer information are transmitted over HTTPS. Pair credentials use macOS Keychain; the phone has a separate read-only capability, with permission to send a jolt to a drifting person. Revoke phone access in Mac Settings. Desktop must remain awake and online. Presence is polled every two/three seconds; this is not a background iOS service.

## Edit and build

Open the repository in VS Code or Xcode. Native source is in `desktop/Sources/`; UI is in `Views.swift`, classifier in `SahkoCore/Classifier.swift`. Website source is in `frontend/`. Run `npm start` from the repository root to edit the website locally.

On a Mac with Xcode command-line tools, run `bash desktop/build-app.sh`. It runs classifier tests, compiles both architectures, signs the bundle ad hoc and creates `desktop/output/Sahko-macOS.zip`. GitHub Actions runs the same build and publishes the demo release when desktop source changes on main. No paid signing account or hosting purchase is included.
