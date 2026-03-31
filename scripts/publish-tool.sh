#!/usr/bin/env bash
#
# Publish a single Patchwork tool: initialize (if needed) and sync via darn.
#
# Usage:
#   pnpm publish-tool tools/toolbar/doc-title
#   DARN=/path/to/darn pnpm publish-tool tools/toolbar/doc-title
#
# Environment:
#   DARN      Path to darn binary (default: darn)
#   URL_DIR   If set, write the tool's automerge URL to $URL_DIR/<tool-name>

set -euo pipefail

DARN="${DARN:-darn}"
TOOL_PATH="${1:-.}"

cd "$TOOL_PATH"
TOOL_NAME="$(basename "$PWD")"
echo "Publishing $TOOL_NAME..."

# Init if needed
if [ ! -f .darn ]; then
  echo "  No .darn workspace found, initializing..."
  "$DARN" init --peer wss://subduction.sync.inkandswitch.com
fi

# Sync files to server
"$DARN" sync --force

# Read the tool's automerge URL
TOOL_URL=$("$DARN" info --porcelain | grep '^root_dir_id' | cut -f2)
echo "  Synced: $TOOL_URL"

# Write URL to collection directory if requested
if [ -n "${URL_DIR:-}" ]; then
  echo "$TOOL_URL" > "$URL_DIR/$TOOL_NAME"
fi

echo "  Published: $TOOL_URL"
