#!/usr/bin/env bash
# Migrate all Patchwork tools from pushwork to darn
# This script:
# 1. Creates plugin-darn-sync.ts files
# 2. Updates esbuild options.ts to use darn
# 3. Updates package.json scripts and config

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Migrating Patchwork tools from pushwork to darn..."
echo ""

# Find all tools with pushwork plugin
find "$PROJECT_DIR/tools" -name "plugin-pushwork-sync.ts" | while read -r pushwork_plugin; do
  esbuild_dir=$(dirname "$pushwork_plugin")
  tool_dir=$(dirname "$esbuild_dir")
  pkg_json="$tool_dir/package.json"
  
  name=$(jq -r '.name' "$pkg_json" 2>/dev/null || echo "$tool_dir")
  
  echo -e "${YELLOW}Migrating:${NC} $name"
  
  # 1. Create plugin-darn-sync.ts
  darn_plugin="$esbuild_dir/plugin-darn-sync.ts"
  if [ ! -f "$darn_plugin" ]; then
    cat > "$darn_plugin" << 'EOF'
import type { Plugin as EsbuildPlugin } from "esbuild";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

export default function darnSync() {
  return {
    name: "darn",
    setup(build) {
      // Check for .darn in the dist directory (output location)
      const outdir = build.initialOptions.outdir ?? "dist";
      const darnDir = `${outdir}/.darn`;

      if (!existsSync(darnDir)) {
        console.warn(`no ${darnDir} directory! run 'darn init --id <url> ${outdir}' first`);
        return;
      }

      build.onEnd((result) => {
        if (result.errors.length) {
          console.warn("esbuild errors! skipping darn sync");
          return;
        }
        try {
          execSync("darn sync --force", {
            cwd: outdir,
            stdio: "inherit",
          });
        } catch (error) {
          console.warn((error as Error).message);
        }
      });
    },
  } satisfies EsbuildPlugin;
}
EOF
    echo "  Created plugin-darn-sync.ts"
  fi
  
  # 2. Update options.ts
  options_file="$esbuild_dir/options.ts"
  if [ -f "$options_file" ]; then
    # Replace pushwork imports with darn
    sed -i 's#import pushworkSync from "./plugin-pushwork-sync.ts";#import darnSync from "./plugin-darn-sync.ts";#g' "$options_file"
    sed -i 's#pushworkSync from "./plugin-pushwork-sync"#darnSync from "./plugin-darn-sync"#g' "$options_file"
    
    # Replace variable names  
    sed -i 's#const pushworking = process.argv.includes("pushwork") || process.env.PUSHWORK;#const syncing = process.argv.includes("darn") || process.env.DARN_SYNC;#g' "$options_file"
    
    # Replace function calls
    sed -i 's#pushworking ? \[pushworkSync()\]#syncing ? [darnSync()]#g' "$options_file"
    sed -i 's#pushworking ? pushworkSync()#syncing ? darnSync()#g' "$options_file"
    
    echo "  Updated options.ts"
  fi
  
  # 3. Update package.json
  if [ -f "$pkg_json" ]; then
    # Rename pushwork to darn in config
    jq '.darn = .pushwork | del(.pushwork)' "$pkg_json" > "$pkg_json.tmp" && mv "$pkg_json.tmp" "$pkg_json"
    
    # Update scripts
    jq '.scripts.sync = "pnpm build && darn sync --force" | .scripts["watch:sync"] = "pnpm dev darn" | del(.scripts.pushwatch)' "$pkg_json" > "$pkg_json.tmp" && mv "$pkg_json.tmp" "$pkg_json"
    
    echo "  Updated package.json"
  fi
  
  echo -e "  ${GREEN}OK${NC}"
  echo ""
done

echo "Migration complete!"
echo ""
echo "Next steps:"
echo "1. Run './scripts/init-darn-tools.sh' to initialize darn workspaces"
echo "2. Run './scripts/sync-darn-tools.sh' to sync all tools"
echo "3. Delete old plugin-pushwork-sync.ts files when ready"
