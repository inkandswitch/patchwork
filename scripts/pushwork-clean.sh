#!/usr/bin/env bash
#
# Remove all pushwork workspace state so the next publish starts fresh.
#
# Deletes:
#   - All .pushwork/ directories under tools/
#   - ~/.pushwork/ global storage (if it exists)
#
# Usage:
#   pnpm pushwork-clean

set -euo pipefail

echo "WARNING: This deletes ALL pushwork state under tools/ and global config."
echo "Press Ctrl+C within 2 seconds to abort."
sleep 2

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
PUSHWORK_GLOBAL="${XDG_CONFIG_HOME:-$HOME/.config}/pushwork"

# Remove .pushwork directories from tools/
count=$(find "$ROOT_DIR/tools" -name '.pushwork' -type d 2>/dev/null | wc -l | tr -d ' ')
find "$ROOT_DIR/tools" -name '.pushwork' -type d -exec rm -rf {} + 2>/dev/null || true
echo "Removed $count .pushwork directory(ies)"

# Remove global pushwork storage
if [ -d "$PUSHWORK_GLOBAL" ]; then
  rm -rf "${PUSHWORK_GLOBAL:?}"
  echo "Cleared global pushwork storage"
fi

# Also remove any leftover .darn files from the old sync tool
darn_count=$(find "$ROOT_DIR/tools" -name '.darn' -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$darn_count" -gt 0 ]; then
  find "$ROOT_DIR/tools" -name '.darn' -type f -delete
  echo "Removed $darn_count legacy .darn file(s)"
fi

echo "Done. Ready for a fresh publish."
