#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
swift test
swift build -c release --arch arm64
ARM_BIN=$(swift build -c release --arch arm64 --show-bin-path)
swift build -c release --arch x86_64
INTEL_BIN=$(swift build -c release --arch x86_64 --show-bin-path)
APP="$PWD/output/Sahko.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
lipo -create "$ARM_BIN/SahkoDesktop" "$INTEL_BIN/SahkoDesktop" -output "$APP/Contents/MacOS/SahkoDesktop"
cp Info.plist "$APP/Contents/Info.plist"
codesign --force --deep --sign - "$APP"
codesign --verify --deep --strict "$APP"
ditto -c -k --sequesterRsrc --keepParent "$APP" "$PWD/output/Sahko-macOS.zip"
shasum -a 256 "$PWD/output/Sahko-macOS.zip" > "$PWD/output/SHA256SUMS.txt"
