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

trap 'rm -rf "$BUILD_DIR"' EXIT

if [ ! -d "$APP_BUNDLE" ]; then
  echo "Error: App bundle not found at $APP_BUNDLE"
  exit 1
fi

echo "==> Building Swift extensions for $APP_BUNDLE"

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

swiftc \
  -module-name PatchworkIntents \
  -emit-library -emit-module \
  -o "$INTENTS_FW_VERSIONED/PatchworkIntents" \
  -emit-module-path "$INTENTS_FW_VERSIONED/Modules/PatchworkIntents.swiftmodule" \
  -sdk "$SDK_PATH" \
  -target "arm64-apple-macos${DEPLOYMENT_TARGET}" \
  -O \
  "${INTENTS_SRC[@]}"

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

# appintentsmetadataprocessor extracts Shortcut definitions from compiled Swift
xcrun appintentsmetadataprocessor \
  --binary-file "$FRAMEWORKS_DIR/PatchworkIntents.framework/PatchworkIntents" \
  --module-name PatchworkIntents \
  --output "$METADATA_DIR" \
  --sdk-root "$SDK_PATH" \
  --deployment-target "$DEPLOYMENT_TARGET" \
  2>&1 || echo "Warning: appintentsmetadataprocessor had issues (Shortcuts may not register)"

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
        let title = item.attributedContentText?.string

        let group = DispatchGroup()
        for attachment in item.attachments ?? [] {
            if attachment.hasItemConformingToTypeIdentifier("public.url") {
                group.enter()
                attachment.loadItem(forTypeIdentifier: "public.url") { item, _ in
                    if let u = item as? URL { url = u.absoluteString }
                    group.leave()
                }
            } else if attachment.hasItemConformingToTypeIdentifier("public.plain-text") {
                group.enter()
                attachment.loadItem(forTypeIdentifier: "public.plain-text") { item, _ in
                    if let s = item as? String { text = s }
                    group.leave()
                }
            }
        }

        group.notify(queue: .main) { [weak self] in
            self?.sendToPatchwork(text: text, url: url, title: title)
        }
    }

    private func sendToPatchwork(text: String?, url: String?, title: String?) {
        var parts: [String] = []
        if let t = text { parts.append("text: \(jsString(t))") }
        if let u = url { parts.append("url: \(jsString(u))") }
        if let t = title { parts.append("title: \(jsString(t))") }

        let code = """
        window.dispatchEvent(new CustomEvent("patchwork:share", {
            detail: { \(parts.joined(separator: ", ")) }
        }));
        return "shared";
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

# Compile the share extension binary
swiftc \
  -module-name PatchworkShare \
  -emit-library -emit-module \
  -o "$SHARE_APPEX_CONTENTS/PatchworkShare" \
  -sdk "$SDK_PATH" \
  -target "arm64-apple-macos${DEPLOYMENT_TARGET}" \
  -O \
  "$BUILD_DIR/ShareViewController.swift" \
  2>&1 || echo "Warning: Share Extension compilation had issues"

# Info.plist for the Share Extension
cat > "$SHARE_APPEX/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${BUNDLE_ID}.share-extension</string>
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

# Compile the widget extension binary
swiftc \
  -module-name PatchworkWidget \
  -emit-executable \
  -o "$WIDGET_APPEX_CONTENTS/PatchworkWidget" \
  -sdk "$SDK_PATH" \
  -target "arm64-apple-macos${DEPLOYMENT_TARGET}" \
  -O \
  "$SWIFT_PLUGINS/PatchworkWidget/Sources/PatchworkWidget.swift" \
  2>&1 || echo "Warning: Widget Extension compilation had issues"

# Info.plist for the Widget Extension
cat > "$WIDGET_APPEX/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleIdentifier</key>
  <string>${BUNDLE_ID}.widget</string>
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
codesign --force --sign "$SIGN_IDENTITY" --deep "$FRAMEWORKS_DIR/PatchworkIntents.framework"

# Sign share extension (if present)
if [ -d "$PLUGINS_DIR/PatchworkShare.appex" ]; then
  codesign --force --sign "$SIGN_IDENTITY" --deep "$PLUGINS_DIR/PatchworkShare.appex"
fi

# Sign widget extension (if present)
if [ -d "$PLUGINS_DIR/PatchworkWidget.appex" ]; then
  codesign --force --sign "$SIGN_IDENTITY" --deep "$PLUGINS_DIR/PatchworkWidget.appex"
fi

# Re-sign the main app (must be last)
codesign --force --sign "$SIGN_IDENTITY" --deep "$APP_BUNDLE"

echo "==> Done! Swift extensions integrated into $APP_BUNDLE"
echo "    - PatchworkIntents.framework (Shortcuts)"
if [ -d "$PLUGINS_DIR/PatchworkShare.appex" ]; then
  echo "    - PatchworkShare.appex (Share Extension)"
fi
if [ -d "$PLUGINS_DIR/PatchworkWidget.appex" ]; then
  echo "    - PatchworkWidget.appex (Widget Extension)"
fi
echo "    - AppIntents metadata extracted"
