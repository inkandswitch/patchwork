#!/usr/bin/env bash
# Sync all Patchwork tools via darn

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DARN="${DARN:-$PROJECT_DIR/../darn/target/release/darn}"

# Verify darn exists
if [ ! -x "$DARN" ]; then
  echo "Error: darn not found at $DARN"
  echo "Build it with: cd ../darn && cargo build --release"
  exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Syncing Patchwork tools via darn..."
echo ""

# Find all tools with darn workspaces
find tools -name ".darn" -type d | while read -r darn_dir; do
  dist_dir=$(dirname "$darn_dir")
  tool_dir=$(dirname "$dist_dir")
  
  # Get tool name from package.json
  pkg="$tool_dir/package.json"
  if [ -f "$pkg" ]; then
    name=$(jq -r '.name' "$pkg")
  else
    name="$tool_dir"
  fi
  
  echo -e "${YELLOW}Syncing:${NC} $name"
  
  # Change to dist dir and sync
  pushd "$dist_dir" > /dev/null
  
  if "$DARN" sync --force 2>&1; then
    echo -e "  ${GREEN}OK${NC}"
  else
    echo -e "  ${RED}FAILED${NC}"
  fi
  
  popd > /dev/null
  echo ""
done

echo "Done."
