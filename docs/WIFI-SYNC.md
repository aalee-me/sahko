# Same-Wi-Fi session sync

No relay hosting or subscription is required. Your Mac runs a local Node HTTPS server and SQLite database; your own Wi-Fi and electricity are the only ongoing resources. No router port forwarding, cloud account, tunnel or deployment is needed. Node 24, mkcert and Homebrew are free. The separate internet relay remains undeployed.

This is a developer setup, not yet a server bundled inside the Mac app. You need the source checkout and must leave the terminal process running. The latest Mac download includes the Wi-Fi address setting. The phone receives the same desktop session ID, timer and group state, can send Jolts, and can send opt-in pickup estimates into that session’s recap. Private thoughts/audio stay on their originating device and are not transferred by the pairing relay.

## One-time setup on your Mac

1. Download or clone https://github.com/aalee-me/sahko and open its folder in Terminal. Install Node 24 if needed. With Homebrew available: `brew install node@24 mkcert`. Ensure `node --version` reports v24 or newer.
2. Run `mkcert -install`. This installs your own local development certificate authority in this Mac’s trust store; approve the system prompt if you choose to continue.
3. Run `npm run wifi:setup`. It finds a private network address, creates a certificate for it, and prints a URL such as `https://192.168.1.20:8443`. If it chooses a VPN or wrong interface, supply your Wi-Fi address explicitly: `npm run wifi:setup -- 192.168.1.20`.
4. Copy only the printed `rootCA.pem` certificate to your phone through AirDrop. If the phone needs a `.crt` file, copy it to `sahko-wifi-ca.crt` first. Keep `rootCA-key.pem` and `.sahko-wifi/key.pem` on your Mac; neither is served or committed.
5. On iPhone, install the downloaded certificate profile in Settings → General → VPN & Device Management, then enable its trust in General → About → Certificate Trust Settings. On Android, install it as a user CA certificate through the device’s certificate settings; menus vary. Trust only your own certificate. Remove it when finished with development. Do not bypass HTTPS errors.

## Start a session

1. Connect both devices to the same trusted Wi-Fi, then run `npm run wifi` on the Mac. Allow Node local network access in the macOS firewall if prompted. The local listener uses port 8443.
2. In Sähkö for Mac → Settings → Phone connection, enter the printed HTTPS address and choose **Use Wi-Fi**. The session window reloads from the local server. Start your session there. Existing GitHub-site sessions/history are separate and are not automatically moved.
3. Choose **Create pairing code** in Mac Settings. On the phone, open the same printed HTTPS address in Safari/Chrome, choose **Pair desktop**, and enter the code. The code expires after ten minutes and can be used once. The phone pairing-page link in Mac Settings already includes the code.
4. On the phone, optionally choose **Enable pickup detection**, allow motion permission, and set it down still for two seconds. Keep this minimal companion screen open. A calibrated movement/tilt is an estimated pickup, not a guaranteed hardware counter. Web motion collection pauses while the page is hidden or the phone is locked.
5. Keep the Mac awake and the terminal running. End the session normally to save its recap. Revoke phone access in Mac Settings when desired. Stop the relay with Control-C.

The pairing API accepts only capability-authorized operations. It does not expose the development server’s account, friends or room-management APIs on the LAN. This version mirrors one desktop session to its phone; it does not add internet multiplayer or shared private memo storage. State polls every two/three seconds. Losing Wi-Fi marks the phone offline; pending pickup events retry and are deduplicated by event ID. Stale-session events are discarded.

## Troubleshooting

- **Certificate error / no motion permission:** install and trust your own CA on the phone and use the exact IP address printed by setup. HTTPS is required for crypto, microphone and motion APIs. Sensor support varies by phone/browser.
- **Connection refused:** ensure `npm run wifi` is running, the Mac firewall allows it, both devices are on the same Wi-Fi, and the network does not isolate clients. Guest/university Wi-Fi may block device-to-device access.
- **Address changed:** run setup again for the new Wi-Fi IP, restart the relay, revoke the old pairing when reachable, then update the Mac address and pair again. Do not expose this server on the public internet.
- **Cannot change connection:** finish the active session and revoke phone access first. This prevents accidentally sending a running session or existing credentials to another endpoint.
- **GitHub site does not connect locally:** expected. Use the local HTTPS address on both devices so browsers do not block public-to-private network requests. The published GitHub site remains available separately.

Local pairing data/certificates live in ignored `.sahko-wifi/`. Wi-Fi sync itself incurs no hosting bill. Initial dependency downloads and remotely loaded assets can still use ordinary internet data. Fully offline asset packaging is separate.
