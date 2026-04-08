#!/usr/bin/env bash
#
# Publish all Patchwork tools: sync each tool's built artifacts via pushwork
# and register them in the module settings doc.
#
# By default, tools sync sequentially (reliable). Use --parallel for
# concurrent sync (faster but may upload incomplete data due to a
# pushwork head-stability polling issue with concurrent Subduction syncs).
#
# Usage:
#   pnpm publish-all-tools                 # sequential (default, reliable)
#   pnpm publish-all-tools --parallel      # concurrent (faster, less reliable)
#   PUSHWORK=/path/to/pushwork pnpm publish-all-tools
#   SKIP_REGISTER=1 pnpm publish-all-tools # sync only, no registration

set -euo pipefail

PUSHWORK="${PUSHWORK:-pushwork}"
SETTINGS_URL="${SETTINGS_URL:-automerge:415R9K4Jde4ByU94X8fUDUxy2tFW}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")/tools"

MODE="sequential"
for arg in "$@"; do
  case "$arg" in
    --parallel) MODE="parallel" ;;
  esac
done

# Auto-discover tools: any directory under tools/ containing a package.json
TOOL_DIRS=()
while IFS= read -r pkg; do
  dir="$(dirname "$pkg")"
  rel="${dir#"$TOOLS_DIR"/}"
  TOOL_DIRS+=("$rel")
done < <(find "$TOOLS_DIR" -name node_modules -prune -o -name package.json -print | sort)

if [ ${#TOOL_DIRS[@]} -eq 0 ]; then
  echo "No tools found under $TOOLS_DIR" >&2
  exit 1
fi

echo "Found ${#TOOL_DIRS[@]} tools (mode: $MODE)"

URL_DIR=$(mktemp -d)
trap 'rm -rf "$URL_DIR"' EXIT
export URL_DIR
export PUSHWORK

FAILED=()

if [ "$MODE" = "sequential" ]; then
  # ── Sequential mode (default): one tool at a time ──────────────────
  # Reliable — each pushwork sync completes fully before the next starts.
  # Avoids the head-stability polling issue with concurrent Subduction syncs.
  TOTAL=${#TOOL_DIRS[@]}
  DONE=0

  for dir in "${TOOL_DIRS[@]}"; do
    DONE=$((DONE + 1))
    if bash "$SCRIPT_DIR/publish-tool.sh" "$TOOLS_DIR/$dir" > /dev/null 2>&1; then
      tool_name="$(basename "$dir")"
      url=""
      if [ -f "$URL_DIR/$tool_name" ]; then
        url=" -> $(cat "$URL_DIR/$tool_name")"
      fi
      echo "  [$DONE/$TOTAL] ok  $dir$url"
    else
      FAILED+=("$dir")
      echo "  [$DONE/$TOTAL] FAIL  $dir" >&2
    fi
  done
else
  # ── Parallel mode: all tools sync concurrently ─────────────────────
  # Faster but may upload incomplete data for some tools.
  LOG_DIR="$URL_DIR/logs"
  mkdir -p "$LOG_DIR"

  declare -A PIDS  # PID → tool dir

  for dir in "${TOOL_DIRS[@]}"; do
    log_name="${dir//\//_}"
    bash "$SCRIPT_DIR/publish-tool.sh" "$TOOLS_DIR/$dir" \
      > "$LOG_DIR/${log_name}.log" 2>&1 &
    PIDS[$!]="$dir"
  done

  TOTAL=${#TOOL_DIRS[@]}
  DONE=0

  echo "Syncing $TOTAL tools in parallel..."

  while [ ${#PIDS[@]} -gt 0 ]; do
    if wait -n -p FINISHED_PID "${!PIDS[@]}" 2>/dev/null; then
      dir="${PIDS[$FINISHED_PID]}"
      DONE=$((DONE + 1))
      echo "  [$DONE/$TOTAL] ok  $dir"
    else
      dir="${PIDS[$FINISHED_PID]}"
      FAILED+=("$dir")
      DONE=$((DONE + 1))
      echo "  [$DONE/$TOTAL] FAIL  $dir" >&2
    fi
    unset "PIDS[$FINISHED_PID]"
  done

  # Print final summary with URLs and failure logs
  echo
  for dir in "${TOOL_DIRS[@]}"; do
    tool_name="$(basename "$dir")"
    if [ -f "$URL_DIR/$tool_name" ]; then
      echo "  ok  $dir -> $(cat "$URL_DIR/$tool_name")"
    else
      log_name="${dir//\//_}"
      echo "  FAIL  $dir" >&2
      if [ -f "$LOG_DIR/${log_name}.log" ]; then
        sed 's/^/    | /' "$LOG_DIR/${log_name}.log" >&2
      fi
    fi
  done
fi

# ── Collect URLs ───────────────────────────────────────────────────────
URLS=()
for dir in "${TOOL_DIRS[@]}"; do
  tool_name="$(basename "$dir")"
  url_file="$URL_DIR/$tool_name"
  if [ -f "$url_file" ]; then
    URLS+=("$(cat "$url_file")")
  fi
done

# ── Register all URLs in one batch ─────────────────────────────────────
if [ "${SKIP_REGISTER:-0}" != "1" ] && [ ${#URLS[@]} -gt 0 ]; then
  echo
  echo "=== Registering ${#URLS[@]} modules in $SETTINGS_URL ==="
  node "$SCRIPT_DIR/register-modules.mjs" "$SETTINGS_URL" "${URLS[@]}"
  echo "  Registered ${#URLS[@]} modules."
fi

# ── Report failures ────────────────────────────────────────────────────
if [ ${#FAILED[@]} -gt 0 ]; then
  echo
  echo "Failed tools (${#FAILED[@]}):" >&2
  printf '  %s\n' "${FAILED[@]}" >&2
  exit 1
fi
