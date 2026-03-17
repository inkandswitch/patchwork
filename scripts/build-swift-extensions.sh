#!/usr/bin/env bash
# build-swift-extensions.sh
#
# Post-build script that compiles the Swift AppIntents, Share Extension,
# and Widget Extension, then integrates them into the Tauri-built .app bundle.
#
# Requirements: Xcode command-line tools (xcrun, swiftc, codesign)
# Expected to run after `cargo tauri build` on macOS.

set -euo pipefail

APP_BUNDLE="${1:-src-tauri/target/release/bundle/macos/Patchwork.app}"
BUNDLE_ID="com.inkandswitch.patchwork"
SWIFT_PLUGINS="src-tauri/swift-plugins"
BUILD_DIR="$(mktemp -d)"
SDK_PATH="$(xcrun --sdk macosx --show-sdk-path)"
DEPLOYMENT_TARGET="14.0"
SIGN_IDENTITY="${CODESIGN_IDENTITY:--}" # ad-hoc by default
ENTITLEMENTS="src-tauri/Entitlements.plist"
EXTENSION_ENTITLEMENTS="src-tauri/Extension.entitlements.plist"

trap 'rm -rf "$BUILD_DIR"' EXIT

if [ ! -d "$APP_BUNDLE" ]; then
  echo "Error: App bundle not found at $APP_BUNDLE"
  exit 1
fi

echo "==> Building Swift extensions for $APP_BUNDLE"

# Merge usage descriptions into the app's Info.plist for permission prompts
APP_PLIST="$APP_BUNDLE/Contents/Info.plist"
if [ -f "$APP_PLIST" ]; then
  /usr/libexec/PlistBuddy -c "Add :NSRemindersUsageDescription string 'Patchwork uses Reminders to let tools create and manage reminders on your behalf.'" "$APP_PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :NSCalendarsUsageDescription string 'Patchwork uses Calendar to let tools read and create calendar events.'" "$APP_PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :NSAppleEventsUsageDescription string 'Patchwork uses Apple Events to integrate with macOS system apps like Reminders and Calendar.'" "$APP_PLIST" 2>/dev/null || true
fi

PLUGINS_DIR="$APP_BUNDLE/Contents/PlugIns"
FRAMEWORKS_DIR="$APP_BUNDLE/Contents/Frameworks"
mkdir -p "$PLUGINS_DIR" "$FRAMEWORKS_DIR"

# ---------------------------------------------------------------------------
# 1. Build PatchworkIntents as a framework
# ---------------------------------------------------------------------------
echo "==> Compiling PatchworkIntents framework..."

INTENTS_SRC=(
  "$SWIFT_PLUGINS/PatchworkIntents/Sources/EvalInPatchworkIntent.swift"
  "$SWIFT_PLUGINS/PatchworkIntents/Sources/ShareToPatchworkIntent.swift"
)
INTENTS_FW_DIR="$BUILD_DIR/PatchworkIntents.framework"
INTENTS_FW_VERSIONED="$INTENTS_FW_DIR/Versions/A"
mkdir -p "$INTENTS_FW_VERSIONED/Modules" "$INTENTS_FW_VERSIONED/Resources"

INTENTS_CONSTVALS_DIR="$BUILD_DIR/intents-constvals"
mkdir -p "$INTENTS_CONSTVALS_DIR"

# Build -Xfrontend flags to emit .swiftconstvalues for each source file
CONSTVALS_FLAGS=()
for src in "${INTENTS_SRC[@]}"; do
  base="$(basename "$src" .swift)"
  CONSTVALS_FLAGS+=(-Xfrontend -emit-const-values-path -Xfrontend "$INTENTS_CONSTVALS_DIR/${base}.swiftconstvalues")
done

swiftc \
  -module-name PatchworkIntents \
  -emit-library -emit-module \
  -parse-as-library \
  -o "$INTENTS_FW_VERSIONED/PatchworkIntents" \
  -emit-module-path "$INTENTS_FW_VERSIONED/Modules/PatchworkIntents.swiftmodule" \
  -sdk "$SDK_PATH" \
  -target "arm64-apple-macos${DEPLOYMENT_TARGET}" \
  -O \
  "${CONSTVALS_FLAGS[@]}" \
  -Xlinker -install_name -Xlinker "@rpath/PatchworkIntents.framework/Versions/A/PatchworkIntents" \
  -framework AppIntents \
  -framework Foundation \
  "${INTENTS_SRC[@]}"

echo "    - Const values files: $(ls "$INTENTS_CONSTVALS_DIR" 2>/dev/null | tr '\n' ' ')"

# Framework structure symlinks
ln -sf A "$INTENTS_FW_DIR/Versions/Current"
ln -sf Versions/Current/PatchworkIntents "$INTENTS_FW_DIR/PatchworkIntents"
ln -sf Versions/Current/Modules "$INTENTS_FW_DIR/Modules"
ln -sf Versions/Current/Resources "$INTENTS_FW_DIR/Resources"

# Info.plist for the framework
cat > "$INTENTS_FW_VERSIONED/Resources/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${BUNDLE_ID}.intents-framework</string>
  <key>CFBundleName</key>
  <string>PatchworkIntents</string>
  <key>CFBundlePackageType</key>
  <string>FMWK</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
</dict>
</plist>
PLIST

# Copy framework into the app bundle
cp -R "$INTENTS_FW_DIR" "$FRAMEWORKS_DIR/"

# ---------------------------------------------------------------------------
# 2. Extract AppIntents metadata
# ---------------------------------------------------------------------------
echo "==> Extracting AppIntents metadata..."

METADATA_DIR="$APP_BUNDLE/Contents/Resources/Metadata.appintents"
mkdir -p "$METADATA_DIR"

# appintentsmetadataprocessor extracts Shortcut definitions from compiled Swift.
XCODE_BUILD_VERSION="$(xcodebuild -version | tail -1 | sed 's/Build version //')"
TARGET_TRIPLE="$(uname -m)-apple-macosx${DEPLOYMENT_TARGET}"
TOOLCHAIN_DIR="$(xcode-select -p)/Toolchains/XcodeDefault.xctoolchain"

# Build --swift-const-vals args (one per .swiftconstvalues file)
CONSTVALS_ARGS=()
for f in "$INTENTS_CONSTVALS_DIR"/*.swiftconstvalues; do
  [ -f "$f" ] && CONSTVALS_ARGS+=(--swift-const-vals "$f")
done

if ! xcrun appintentsmetadataprocessor \
  --binary-file "$FRAMEWORKS_DIR/PatchworkIntents.framework/PatchworkIntents" \
  --module-name PatchworkIntents \
  --output "$METADATA_DIR" \
  --sdk-root "$SDK_PATH" \
  --target-triple "$TARGET_TRIPLE" \
  --toolchain-dir "$TOOLCHAIN_DIR" \
  --xcode-version "$XCODE_BUILD_VERSION" \
  --deployment-target "$DEPLOYMENT_TARGET" \
  --compile-time-extraction \
  "${CONSTVALS_ARGS[@]}" \
  --source-files "${INTENTS_SRC[@]}" \
  2>&1; then
  echo "Warning: appintentsmetadataprocessor failed for PatchworkIntents (Shortcuts may not appear)"
fi
echo "    - Metadata files: $(ls "$METADATA_DIR" 2>/dev/null | tr '\n' ' ')"

# ---------------------------------------------------------------------------
# 3. Build Share Extension (.appex)
# ---------------------------------------------------------------------------
echo "==> Building Share Extension..."

SHARE_APPEX="$BUILD_DIR/PatchworkShare.appex"
SHARE_APPEX_CONTENTS="$SHARE_APPEX/Contents/MacOS"
mkdir -p "$SHARE_APPEX_CONTENTS" "$SHARE_APPEX/Contents/Resources"

# The Share Extension principal class — an NSViewController that handles
# incoming share items and forwards them to the running Patchwork app.
cat > "$BUILD_DIR/ShareViewController.swift" << 'SWIFT'
import Cocoa
import Foundation

class ShareViewController: NSViewController {
    override var nibName: NSNib.Name? { nil }

    override func loadView() {
        self.view = NSView(frame: NSRect(x: 0, y: 0, width: 1, height: 1))
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        guard let item = self.extensionContext?.inputItems.first as? NSExtensionItem else {
            self.extensionContext?.completeRequest(returningItems: nil)
            return
        }

        var text: String?
        var url: String?
        var fileURLs: [String] = []
        let title = item.attributedContentText?.string

        let group = DispatchGroup()
        for attachment in item.attachments ?? [] {
            // Check URL types first (web URLs also conform to public.url)
            if attachment.hasItemConformingToTypeIdentifier("public.url") {
                group.enter()
                attachment.loadItem(forTypeIdentifier: "public.url") { item, error in
                    defer { group.leave() }
                    if let u = item as? URL {
                        if u.isFileURL {
                            fileURLs.append(u.absoluteString)
                        } else {
                            url = u.absoluteString
                        }
                    } else if let s = item as? String {
                        url = s
                    }
                }
            } else if attachment.hasItemConformingToTypeIdentifier("public.plain-text") {
                group.enter()
                attachment.loadItem(forTypeIdentifier: "public.plain-text") { item, error in
                    defer { group.leave() }
                    if let s = item as? String {
                        text = s
                    } else if let d = item as? Data, let s = String(data: d, encoding: .utf8) {
                        text = s
                    }
                }
            }
        }

        group.notify(queue: .main) { [weak self] in
            self?.sendToPatchwork(text: text, url: url, title: title, fileURLs: fileURLs)
        }
    }

    private func sendToPatchwork(text: String?, url: String?, title: String?, fileURLs: [String]) {
        var parts: [String] = []
        if let t = text { parts.append("text: \(jsString(t))") }
        if let u = url { parts.append("url: \(jsString(u))") }
        if let t = title { parts.append("title: \(jsString(t))") }
        if !fileURLs.isEmpty {
            let jsArray = fileURLs.map { jsString($0) }.joined(separator: ", ")
            parts.append("files: [\(jsArray)]")
        }

        let code = """
        console.log("[share-ext] dispatching patchwork:share with parts: \(parts.count)");
        window.dispatchEvent(new CustomEvent("patchwork:share", {
            detail: { \(parts.joined(separator: ", ")) }
        }));
        return "shared (\(parts.count) fields)";
        """

        let requestUrl = Foundation.URL(string: "http://localhost:3030/eval")!
        var request = URLRequest(url: requestUrl)
        request.httpMethod = "POST"
        request.httpBody = code.data(using: .utf8)
        request.timeoutInterval = 10

        URLSession.shared.dataTask(with: request) { [weak self] _, _, _ in
            DispatchQueue.main.async {
                self?.extensionContext?.completeRequest(returningItems: nil)
            }
        }.resume()
    }

    private func jsString(_ s: String) -> String {
        let escaped = s
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "\\r")
        return "\"\(escaped)\""
    }
}
SWIFT

# Compile the share extension as an executable.
# macOS extension binaries must be MH_EXECUTE, not MH_DYLIB.
# Use _NSExtensionMain as the entry point (provided by Foundation).
swiftc \
  -module-name PatchworkShare \
  -emit-executable \
  -parse-as-library \
  -o "$SHARE_APPEX_CONTENTS/PatchworkShare" \
  -sdk "$SDK_PATH" \
  -target "arm64-apple-macos${DEPLOYMENT_TARGET}" \
  -O \
  -framework Cocoa \
  -framework Foundation \
  -Xlinker -e -Xlinker _NSExtensionMain \
  -Xlinker -rpath -Xlinker "@executable_path/../../../../Frameworks" \
  "$BUILD_DIR/ShareViewController.swift"

# Info.plist for the Share Extension
cat > "$SHARE_APPEX/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${BUNDLE_ID}.share-extension</string>
  <key>CFBundleExecutable</key>
  <string>PatchworkShare</string>
  <key>CFBundleName</key>
  <string>PatchworkShare</string>
  <key>CFBundleDisplayName</key>
  <string>Share to Patchwork</string>
  <key>CFBundlePackageType</key>
  <string>XPC!</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.share-services</string>
    <key>NSExtensionPrincipalClass</key>
    <string>PatchworkShare.ShareViewController</string>
    <key>NSExtensionAttributes</key>
    <dict>
      <key>NSExtensionActivationRule</key>
      <dict>
        <key>NSExtensionActivationSupportsText</key>
        <true/>
        <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
        <integer>1</integer>
        <key>NSExtensionActivationSupportsFileWithMaxCount</key>
        <integer>10</integer>
      </dict>
    </dict>
  </dict>
</dict>
</plist>
PLIST

# Copy share extension into app bundle (only if build succeeded)
if [ -f "$SHARE_APPEX_CONTENTS/PatchworkShare" ]; then
  cp -R "$SHARE_APPEX" "$PLUGINS_DIR/"
else
  echo "Warning: Share Extension binary not found, skipping"
fi

# ---------------------------------------------------------------------------
# 4. Build Widget Extension (.appex)
# ---------------------------------------------------------------------------
echo "==> Building Widget Extension..."

WIDGET_APPEX="$BUILD_DIR/PatchworkWidget.appex"
WIDGET_APPEX_CONTENTS="$WIDGET_APPEX/Contents/MacOS"
mkdir -p "$WIDGET_APPEX_CONTENTS" "$WIDGET_APPEX/Contents/Resources"

WIDGET_SRC="$SWIFT_PLUGINS/PatchworkWidget/Sources/PatchworkWidget.swift"

WIDGET_CONSTVALS_DIR="$BUILD_DIR/widget-constvals"
mkdir -p "$WIDGET_CONSTVALS_DIR"

WIDGET_BASE="$(basename "$WIDGET_SRC" .swift)"

# Compile the widget extension binary — needs -parse-as-library because the
# source uses @main which conflicts with swiftc's default top-level code mode.
swiftc \
  -module-name PatchworkWidget \
  -parse-as-library \
  -emit-executable \
  -o "$WIDGET_APPEX_CONTENTS/PatchworkWidget" \
  -sdk "$SDK_PATH" \
  -target "arm64-apple-macos${DEPLOYMENT_TARGET}" \
  -O \
  -Xfrontend -emit-const-values-path -Xfrontend "$WIDGET_CONSTVALS_DIR/${WIDGET_BASE}.swiftconstvalues" \
  -framework WidgetKit \
  -framework SwiftUI \
  -framework AppIntents \
  -Xlinker -rpath -Xlinker "@executable_path/../../../../Frameworks" \
  "$WIDGET_SRC"

echo "    - Widget const values: $(ls "$WIDGET_CONSTVALS_DIR" 2>/dev/null | tr '\n' ' ')"

# Info.plist for the Widget Extension
cat > "$WIDGET_APPEX/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${BUNDLE_ID}.widget</string>
  <key>CFBundleExecutable</key>
  <string>PatchworkWidget</string>
  <key>CFBundleName</key>
  <string>PatchworkWidget</string>
  <key>CFBundleDisplayName</key>
  <string>Patchwork Widget</string>
  <key>CFBundlePackageType</key>
  <string>XPC!</string>
  <key>CFBundleVersion</key>
  <string>1</string>
  <key>CFBundleShortVersionString</key>
  <string>0.1.0</string>
  <key>NSExtension</key>
  <dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
  </dict>
</dict>
</plist>
PLIST

# Extract widget AppIntents metadata (for WidgetConfigurationIntent discovery)
WIDGET_METADATA_DIR="$WIDGET_APPEX/Contents/Resources/Metadata.appintents"
mkdir -p "$WIDGET_METADATA_DIR"
# Build --swift-const-vals args for widget
WIDGET_CONSTVALS_ARGS=()
for f in "$WIDGET_CONSTVALS_DIR"/*.swiftconstvalues; do
  [ -f "$f" ] && WIDGET_CONSTVALS_ARGS+=(--swift-const-vals "$f")
done

if ! xcrun appintentsmetadataprocessor \
  --binary-file "$WIDGET_APPEX_CONTENTS/PatchworkWidget" \
  --module-name PatchworkWidget \
  --output "$WIDGET_METADATA_DIR" \
  --sdk-root "$SDK_PATH" \
  --target-triple "$TARGET_TRIPLE" \
  --toolchain-dir "$TOOLCHAIN_DIR" \
  --xcode-version "$XCODE_BUILD_VERSION" \
  --deployment-target "$DEPLOYMENT_TARGET" \
  --compile-time-extraction \
  "${WIDGET_CONSTVALS_ARGS[@]}" \
  --source-files "$WIDGET_SRC" \
  2>&1; then
  echo "Warning: appintentsmetadataprocessor failed for PatchworkWidget (Widget may not appear)"
fi
echo "    - Widget metadata files: $(ls "$WIDGET_METADATA_DIR" 2>/dev/null | tr '\n' ' ')"

# Copy widget extension into app bundle (only if build succeeded)
if [ -f "$WIDGET_APPEX_CONTENTS/PatchworkWidget" ]; then
  cp -R "$WIDGET_APPEX" "$PLUGINS_DIR/"
else
  echo "Warning: Widget Extension binary not found, skipping"
fi

# ---------------------------------------------------------------------------
# 5. Re-codesign everything
# ---------------------------------------------------------------------------
echo "==> Codesigning..."

# Sign framework
codesign --force --sign "$SIGN_IDENTITY" --options runtime --deep "$FRAMEWORKS_DIR/PatchworkIntents.framework"

# Sign extensions with their entitlements (sandbox + network access)
if [ -f "$EXTENSION_ENTITLEMENTS" ]; then
  if [ -d "$PLUGINS_DIR/PatchworkShare.appex" ]; then
    codesign --force --sign "$SIGN_IDENTITY" --entitlements "$EXTENSION_ENTITLEMENTS" --options runtime "$PLUGINS_DIR/PatchworkShare.appex"
  fi
  if [ -d "$PLUGINS_DIR/PatchworkWidget.appex" ]; then
    codesign --force --sign "$SIGN_IDENTITY" --entitlements "$EXTENSION_ENTITLEMENTS" --options runtime "$PLUGINS_DIR/PatchworkWidget.appex"
  fi
else
  echo "Warning: Extension entitlements not found at $EXTENSION_ENTITLEMENTS, signing without entitlements"
  if [ -d "$PLUGINS_DIR/PatchworkShare.appex" ]; then
    codesign --force --sign "$SIGN_IDENTITY" --options runtime --deep "$PLUGINS_DIR/PatchworkShare.appex"
  fi
  if [ -d "$PLUGINS_DIR/PatchworkWidget.appex" ]; then
    codesign --force --sign "$SIGN_IDENTITY" --options runtime --deep "$PLUGINS_DIR/PatchworkWidget.appex"
  fi
fi

# Re-sign the main app with entitlements (must be last)
if [ -f "$ENTITLEMENTS" ]; then
  codesign --force --sign "$SIGN_IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --deep "$APP_BUNDLE"
else
  codesign --force --sign "$SIGN_IDENTITY" --options runtime --deep "$APP_BUNDLE"
fi

# ---------------------------------------------------------------------------
# 6. Rebuild the DMG with the updated .app bundle
# ---------------------------------------------------------------------------
echo "==> Rebuilding DMG..."

DMG_DIR="src-tauri/target/release/bundle/dmg"
APP_NAME="Patchwork"

if [ -d "$DMG_DIR" ]; then
  # Remove old DMG(s)
  rm -f "$DMG_DIR"/*.dmg

  DMG_PATH="$DMG_DIR/${APP_NAME}.dmg"
  DMG_TEMP="$BUILD_DIR/dmg-staging"
  mkdir -p "$DMG_TEMP"
  cp -R "$APP_BUNDLE" "$DMG_TEMP/"
  ln -s /Applications "$DMG_TEMP/Applications"

  hdiutil create -volname "$APP_NAME" \
    -srcfolder "$DMG_TEMP" \
    -ov -format UDZO \
    "$DMG_PATH" \
    2>&1 || echo "Warning: DMG creation had issues"

  echo "    - Rebuilt DMG at $DMG_PATH"
fi

echo "==> Done! Swift extensions integrated into $APP_BUNDLE"
echo "    - PatchworkIntents.framework (Shortcuts)"
if [ -d "$PLUGINS_DIR/PatchworkShare.appex" ]; then
  echo "    - PatchworkShare.appex (Share Extension)"
fi
if [ -d "$PLUGINS_DIR/PatchworkWidget.appex" ]; then
  echo "    - PatchworkWidget.appex (Widget Extension)"
fi
echo "    - AppIntents metadata extracted"
