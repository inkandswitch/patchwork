/**
 * Placeholder shown while the history document is being created for the first
 * time (or is still loading). Lives in the same flex slot as the item list so
 * the surrounding layout doesn't jump when it swaps out.
 */
export function HistoryComputingIndicator() {
  return (
    <div
      class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 px-6 py-10 text-center text-base-content/60"
      role="status"
      aria-live="polite"
    >
      <span class="loading loading-dots loading-md text-base-content/40" />
      <div class="text-sm">Computing history…</div>
    </div>
  );
}
