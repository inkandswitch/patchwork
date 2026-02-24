#!/usr/bin/env bash
# Initialize darn workspaces for all Patchwork tools
# Uses existing pushwork URLs as root directory IDs to preserve URLs

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

echo "Initializing darn workspaces for Patchwork tools..."
echo "Using darn at: $DARN"
echo ""

# Find all tools with pushwork URLs
find tools -name "package.json" | while read -r pkg; do
  url=$(jq -r '.pushwork.url // empty' "$pkg" 2>/dev/null)
  if [ -n "$url" ]; then
    tool_dir=$(dirname "$pkg")
    dist_dir="$tool_dir/dist"
    name=$(jq -r '.name' "$pkg")
    
    # Trim any whitespace from URL
    url=$(echo "$url" | tr -d '[:space:]')
    
    echo -e "${YELLOW}Processing:${NC} $name"
    echo "  Dir: $tool_dir"
    echo "  URL: $url"
    
    # Check if dist exists
    if [ ! -d "$dist_dir" ]; then
      echo -e "  ${RED}SKIP:${NC} No dist/ directory (run build first)"
      echo ""
      continue
    fi
    
    # Check if already initialized
    if [ -d "$dist_dir/.darn" ]; then
      echo -e "  ${YELLOW}SKIP:${NC} Already initialized"
      echo ""
      continue
    fi
    
    # Initialize darn workspace with the existing URL as root ID
    echo "  Initializing..."
    if "$DARN" init --id "$url" "$dist_dir" 2>&1 | grep -v "^┌\|^│\|^├\|^└\|^◇"; then
      echo -e "  ${GREEN}OK:${NC} Initialized"
    else
      echo -e "  ${RED}ERROR:${NC} Failed to initialize"
    fi
    
    echo ""
  fi
done

echo "Done. Run 'scripts/sync-darn-tools.sh' to sync all tools."
