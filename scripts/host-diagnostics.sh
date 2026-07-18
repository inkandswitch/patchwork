#!/usr/bin/env bash
#
# Patchwork host diagnostics.
#
# Captures a snapshot of the *host machine* — OS, disk, RAM/swap, CPU and GPU
# utilization — to pair with an in-browser diagnostics bundle (the one produced
# by `await window.patchworkDiagnostics.export()`). The browser is sandboxed
# away from this information, so when a user reports a problem this fills the
# gap: "what does the machine itself look like right now?".
#
# Cross-platform best-effort (Linux + macOS). Never fails on a missing tool — a
# section that can't be measured says so and the rest still runs.
#
# Usage:
#   scripts/host-diagnostics.sh            # print report + save a timestamped file
#   scripts/host-diagnostics.sh -o FILE    # save to FILE
#   scripts/host-diagnostics.sh --stdout   # print only, don't save a file
#   scripts/host-diagnostics.sh -h

set -o pipefail

OUT=""
SAVE=1
for arg in "$@"; do
  case "$arg" in
    -h | --help)
      # Print only the leading comment block (skip the shebang, stop at the
      # first non-comment line).
      awk 'NR==1{next} /^#/{sub(/^# ?/,""); print; next} {exit}' "$0"
      exit 0
      ;;
    --stdout | -)
      SAVE=0
      ;;
    -o)
      shift
      OUT="$1"
      ;;
    -o*)
      OUT="${arg#-o}"
      ;;
  esac
done

OS="$(uname -s 2>/dev/null || echo unknown)"
have() { command -v "$1" >/dev/null 2>&1; }

# ── OS ────────────────────────────────────────────────────────────────────
report_os() {
  echo "## OS"
  echo "kernel:   $(uname -s) $(uname -r) ($(uname -m))"
  echo "hostname: $(uname -n)"
  case "$OS" in
    Linux)
      if [ -r /etc/os-release ]; then
        ( . /etc/os-release && echo "distro:   ${PRETTY_NAME:-${NAME:-Linux} ${VERSION:-}}" )
      fi
      ;;
    Darwin)
      have sw_vers && echo "macOS:    $(sw_vers -productName) $(sw_vers -productVersion) ($(sw_vers -buildVersion))"
      ;;
  esac
  have uptime && echo "uptime:   $(uptime | sed 's/^ *//')"
}

ncpu() {
  if have nproc; then
    nproc
  elif [ "$OS" = Darwin ]; then
    sysctl -n hw.ncpu 2>/dev/null || echo "?"
  else
    getconf _NPROCESSORS_ONLN 2>/dev/null || echo "?"
  fi
}

# ── Disk ──────────────────────────────────────────────────────────────────
# `df -h` reports Size / Used / Avail / Capacity on both Linux and macOS.
report_disk() {
  echo "## Disk"
  df -h / 2>/dev/null
  if [ -n "${HOME:-}" ] && [ "$HOME" != "/" ]; then
    echo "-- \$HOME ($HOME) --"
    df -h "$HOME" 2>/dev/null | awk 'NR==2'
  fi
}

# ── Memory + swap ───────────────────────────────────────────────────────────
report_mem() {
  echo "## Memory"
  case "$OS" in
    Linux)
      if have free; then
        free -h
      elif [ -r /proc/meminfo ]; then
        awk '/^(MemTotal|MemAvailable|SwapTotal|SwapFree):/ {
          printf "%-13s %8.2f GiB\n", $1, $2/1048576 }' /proc/meminfo
      else
        echo "(no free / /proc/meminfo)"
      fi
      ;;
    Darwin)
      local total pagesize free_p spec_p avail used
      total=$(sysctl -n hw.memsize 2>/dev/null)
      pagesize=$(sysctl -n hw.pagesize 2>/dev/null || echo 4096)
      free_p=$(vm_stat 2>/dev/null | awk -F: '/Pages free/{gsub(/[ .]/,"",$2);print $2}')
      spec_p=$(vm_stat 2>/dev/null | awk -F: '/Pages speculative/{gsub(/[ .]/,"",$2);print $2}')
      if [ -n "$total" ] && [ -n "$free_p" ]; then
        avail=$(( (free_p + ${spec_p:-0}) * pagesize ))
        used=$(( total - avail ))
        awk -v t="$total" -v u="$used" -v a="$avail" 'BEGIN{
          printf "RAM total: %.2f GiB | used (approx): %.2f GiB | available: %.2f GiB\n",
            t/1073741824, u/1073741824, a/1073741824 }'
      else
        echo "(could not read memory via sysctl/vm_stat)"
      fi
      have sysctl && echo "swap:      $(sysctl -n vm.swapusage 2>/dev/null)"
      ;;
    *)
      echo "(unsupported OS for memory readout)"
      ;;
  esac
}

# ── CPU ───────────────────────────────────────────────────────────────────
report_cpu() {
  echo "## CPU"
  echo "cores:    $(ncpu)"
  case "$OS" in
    Linux)
      if [ -r /proc/stat ]; then
        # Sample /proc/stat twice; busy% = 1 - idle_delta / total_delta.
        local s1 s2
        s1=$(awk '/^cpu /{idle=$5+$6; tot=0; for(i=2;i<=NF;i++)tot+=$i; print idle, tot}' /proc/stat)
        sleep 0.5
        s2=$(awk '/^cpu /{idle=$5+$6; tot=0; for(i=2;i<=NF;i++)tot+=$i; print idle, tot}' /proc/stat)
        awk -v a="$s1" -v b="$s2" 'BEGIN{
          split(a,x," "); split(b,y," ");
          di=y[1]-x[1]; dt=y[2]-x[2];
          if (dt>0) printf "usage:    %.1f%% (over 0.5s)\n", (1-di/dt)*100;
          else print "usage:    (no delta)"; }'
      else
        echo "(no /proc/stat)"
      fi
      have nproc && [ -r /proc/loadavg ] && echo "loadavg:  $(cut -d' ' -f1-3 /proc/loadavg)"
      ;;
    Darwin)
      # `top -l 2` — the first sample is since-boot garbage; take the second.
      have top && top -l 2 -n 0 2>/dev/null | awk '/CPU usage/{u=$0} END{print "usage:    " u}'
      ;;
    *)
      echo "(unsupported OS for CPU readout)"
      ;;
  esac
}

# ── GPU ─────────────────────────────────────────────────────────────────────
report_gpu() {
  echo "## GPU"
  local found=0

  # NVIDIA
  if have nvidia-smi; then
    nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total \
      --format=csv,noheader 2>/dev/null | while IFS= read -r line; do
      echo "nvidia:   $line"
    done
    found=1
  fi

  # AMD (amdgpu exposes a busy percentage in sysfs)
  if [ "$OS" = Linux ]; then
    shopt -s nullglob
    for f in /sys/class/drm/card*/device/gpu_busy_percent; do
      echo "amd:      $(cat "$f" 2>/dev/null)% busy ($f)"
      found=1
    done
    shopt -u nullglob
  fi

  if [ "$found" -eq 0 ]; then
    case "$OS" in
      Darwin) echo "(GPU utilization needs 'sudo powermetrics --samplers gpu_power' on macOS; skipped)" ;;
      *) echo "(no nvidia-smi and no AMD gpu_busy_percent; for Intel try 'sudo intel_gpu_top')" ;;
    esac
  fi
}

main() {
  echo "# Patchwork host diagnostics"
  echo "generated: $(date -u +%Y-%m-%dT%H:%M:%SZ) ($(date +%Z))"
  echo "pairs with: window.patchworkDiagnostics.export() bundle"
  echo
  report_os
  echo
  report_disk
  echo
  report_mem
  echo
  report_cpu
  echo
  report_gpu
}

if [ "$SAVE" -eq 1 ]; then
  [ -n "$OUT" ] || OUT="patchwork-host-diagnostics-$(uname -n 2>/dev/null || echo host)-$(date -u +%Y%m%dT%H%M%SZ).txt"
  main | tee "$OUT"
  echo "saved: $OUT" >&2
else
  main
fi
