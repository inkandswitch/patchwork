#!/usr/bin/env bash
#
# Remove all darn workspace state so the next publish starts fresh.
#
# Deletes:
#   - All .darn files under tools/
#   - ~/.config/darn/workspaces/ storage dirs
#   - ~/.config/darn/storage/ sedimentree data
#
# Usage:
#   pnpm darn-clean

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DARN_CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/darn"

# Remove .darn files from tools/
count=$(find "$ROOT_DIR/tools" -name '.darn' -type f 2>/dev/null | wc -l | tr -d ' ')
find "$ROOT_DIR/tools" -name '.darn' -type f -delete
echo "Removed $count .darn file(s)"

# Remove workspace storage
if [ -d "$DARN_CONFIG/workspaces" ]; then
  rm -rf "${DARN_CONFIG:?}/workspaces/"*
  echo "Cleared workspace storage"
fi

# Remove sedimentree storage
if [ -d "$DARN_CONFIG/storage" ]; then
  rm -rf "${DARN_CONFIG:?}/storage/"*
  echo "Cleared sedimentree storage"
fi

echo "Done. Ready for a fresh publish."
