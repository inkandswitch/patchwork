#!/usr/bin/env bash
#
# Publish all Patchwork tools: sync each tool's built artifacts via darn
# and register them in the module settings doc.
#
# By default, all tools sync in parallel. Use --verbose for sequential
# output with full per-tool visibility.
#
# Usage:
#   pnpm publish-all-tools
#   pnpm publish-all-tools --verbose
#   DARN=/path/to/darn pnpm publish-all-tools
#   SKIP_REGISTER=1 pnpm publish-all-tools  # sync only, no registration

set -euo pipefail

DARN="${DARN:-darn}"
SETTINGS_URL="${SETTINGS_URL:-automerge:3EpoPqZxz1AfgtUqJBJ65udPF7C3}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TOOLS_DIR="$(dirname "$SCRIPT_DIR")/tools"

VERBOSE=0
for arg in "$@"; do
  case "$arg" in
    --verbose) VERBOSE=1 ;;
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

echo "Found ${#TOOL_DIRS[@]} tools"

URL_DIR=$(mktemp -d)
trap 'rm -rf "$URL_DIR"' EXIT
export URL_DIR

FAILED=()

if [ "$VERBOSE" = 1 ]; then
  # ── Sequential mode: full per-tool output ──────────────────────────
  for dir in "${TOOL_DIRS[@]}"; do
    echo "=== $dir ==="
    if bash "$SCRIPT_DIR/publish-tool.sh" "$TOOLS_DIR/$dir"; then
      :
    else
      FAILED+=("$dir")
    fi
    echo
  done
else
  # ── Parallel mode (default): all tools sync concurrently ───────────
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

  # Wait for jobs as they finish (bash 4.3+ wait -n)
  while [ ${#PIDS[@]} -gt 0 ]; do
    # wait -n -p sets FINISHED_PID to whichever PID completed
    if wait -n -p FINISHED_PID "${!PIDS[@]}" 2>/dev/null; then
      dir="${PIDS[$FINISHED_PID]}"
      tool_name="$(basename "$dir")"
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
  "$DARN" doc edit "$SETTINGS_URL" clear modules || true
  "$DARN" doc edit "$SETTINGS_URL" --create append modules "${URLS[@]}"
  echo "  Registered ${#URLS[@]} modules."
fi

# ── Report failures ────────────────────────────────────────────────────
if [ ${#FAILED[@]} -gt 0 ]; then
  echo
  echo "Failed tools (${#FAILED[@]}):" >&2
  printf '  %s\n' "${FAILED[@]}" >&2
  exit 1
fi
