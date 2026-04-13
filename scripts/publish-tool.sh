#!/usr/bin/env bash
#
# Publish a single Patchwork tool: initialize (if needed) and sync via pushwork.
#
# Usage:
#   pnpm publish-tool tools/toolbar/doc-title
#   PUSHWORK=/path/to/pushwork pnpm publish-tool tools/toolbar/doc-title
#
# Environment:
#   PUSHWORK  Path to pushwork binary (default: pushwork)
#   URL_DIR   If set, write the tool's automerge URL to $URL_DIR/<tool-name>

set -euo pipefail

PUSHWORK="${PUSHWORK:-pushwork}"
TOOL_PATH="${1:-.}"

cd "$TOOL_PATH"
TOOL_NAME="$(basename "$PWD")"
echo "Publishing $TOOL_NAME..."

# Init if needed
if [ ! -d .pushwork ]; then
  echo "  No .pushwork directory found, initializing..."
  "$PUSHWORK" init --sub
fi

# Sync files to server
"$PUSHWORK" sync

# Read the tool's automerge URL
TOOL_URL=$("$PUSHWORK" url)
echo "  Synced: $TOOL_URL"

# Write URL to collection directory if requested
if [ -n "${URL_DIR:-}" ]; then
  echo "$TOOL_URL" > "$URL_DIR/$TOOL_NAME"
fi

echo "  Published: $TOOL_URL"
