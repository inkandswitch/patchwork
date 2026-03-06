import { createSignal, createMemo, createEffect, Show, onCleanup } from "solid-js";
import type { AutomergeUrl } from "@automerge/automerge-repo";
import { makeDocumentProjection } from "@automerge/automerge-repo-solid-primitives";
import {
  type PatchworkToolProps,
  type HistoryDoc,
} from "./types.ts";
import "./NotebookViewer.css";

const LS_INDEX_KEY = "notebook-viewer-current-index";
const LS_STEP_KEY = "notebook-viewer-step-size";

// Discrete step size options
const ALL_STEP_SIZES = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function NotebookViewer(props: PatchworkToolProps<HistoryDoc>) {
  const historyDoc = makeDocumentProjection<HistoryDoc>(props.handle);

  // Entries are already in chronological order (HistoryRecorder appends)
  const entries = createMemo(() => historyDoc.entries || []);
  const totalEntries = createMemo(() => entries().length);

  // Available step sizes filtered by total entries
  const availableStepSizes = createMemo(() => {
    const total = totalEntries();
    return ALL_STEP_SIZES.filter((s) => s <= total);
  });

  // Load saved state from localStorage
  // Default to -1 to signal "no saved position" — will resolve to latest entry
  const savedIndexRaw = localStorage.getItem(LS_INDEX_KEY);
  const hasSavedIndex = savedIndexRaw !== null;
  const savedIndex = hasSavedIndex ? parseInt(savedIndexRaw, 10) : -1;
  const savedStepSize = parseInt(localStorage.getItem(LS_STEP_KEY) || "1", 10);

  const [rawCurrentIndex, setRawCurrentIndex] = createSignal(
    hasSavedIndex && Number.isFinite(savedIndex) ? Math.max(0, savedIndex) : -1
  );
  const [stepSize, setStepSize] = createSignal(
    Number.isFinite(savedStepSize) ? Math.max(1, savedStepSize) : 1
  );

  // Clamped current index: always valid given current entries length
  // -1 means "no saved position" → default to latest (last) entry
  const currentIndex = createMemo(() => {
    const total = totalEntries();
    if (total === 0) return 0;
    const raw = rawCurrentIndex();
    if (raw < 0) return total - 1;
    return Math.min(Math.max(0, raw), total - 1);
  });

  const currentEntry = createMemo(() => {
    const e = entries();
    const idx = currentIndex();
    return e.length > 0 ? e[idx] : undefined;
  });

  const currentDateLabel = createMemo(() => {
    const entry = currentEntry();
    if (!entry) return "";
    return dateTimeFormatter.format(new Date(entry.timestamp));
  });

  // Document URL with heads for the patchwork-view
  const viewDocUrl = createMemo(() => {
    const entry = currentEntry();
    if (!entry) return undefined;
    if (entry.heads && entry.heads.length > 0) {
      return `${entry.docUrl}#${entry.heads.join("|")}` as AutomergeUrl;
    }
    return entry.docUrl;
  });

  const viewToolId = createMemo(() => currentEntry()?.toolId);

  // Key to force patchwork-view remount when entry changes
  const viewKey = createMemo(() => {
    const url = viewDocUrl();
    const toolId = viewToolId();
    return url ? `${url}-${toolId || "default"}` : undefined;
  });

  // Navigation
  const canGoBack = createMemo(() => currentIndex() > 0);
  const canGoForward = createMemo(() => {
    const total = totalEntries();
    return total > 0 && currentIndex() < total - 1;
  });

  const goBack = () => {
    setRawCurrentIndex(Math.max(0, currentIndex() - stepSize()));
  };

  const goForward = () => {
    setRawCurrentIndex(Math.min(totalEntries() - 1, currentIndex() + stepSize()));
  };

  // Map slider position (index into availableStepSizes) to actual step size
  const stepSizeSliderIndex = createMemo(() => {
    const sizes = availableStepSizes();
    const idx = sizes.indexOf(stepSize());
    // If current step size isn't in the list, find the closest
    if (idx >= 0) return idx;
    for (let i = sizes.length - 1; i >= 0; i--) {
      if (sizes[i] <= stepSize()) return i;
    }
    return 0;
  });

  const updateStepSizeFromSlider = (sliderIndex: number) => {
    const sizes = availableStepSizes();
    const clamped = Math.max(0, Math.min(sliderIndex, sizes.length - 1));
    setStepSize(sizes[clamped] || 1);
  };

  const goToFirst = () => setRawCurrentIndex(0);
  const goToLatest = () => setRawCurrentIndex(totalEntries() - 1);

  // Keyboard navigation
  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goBack();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goForward();
    }
  };

  document.addEventListener("keydown", onKeyDown);
  onCleanup(() => document.removeEventListener("keydown", onKeyDown));

  // Persist state to localStorage
  createEffect(() => {
    localStorage.setItem(LS_INDEX_KEY, String(currentIndex()));
  });

  createEffect(() => {
    localStorage.setItem(LS_STEP_KEY, String(stepSize()));
  });

  return (
    <div class="notebook-viewer">
      <Show
        when={totalEntries() > 0}
        fallback={
          <div class="notebook-viewer-empty">
            No history entries yet. Open some documents to start tracking history.
          </div>
        }
      >
        {/* Timeline controls */}
        <div class="notebook-viewer-timeline">
          <div class="notebook-viewer-date-label">{currentDateLabel()}</div>
          <div class="notebook-viewer-timeline-row">
            <button
              class="notebook-viewer-timeline-label"
              onClick={goToFirst}
              title="Go to first entry"
            >
              First
            </button>
            <input
              type="range"
              class="notebook-viewer-timeline-slider"
              min={0}
              max={totalEntries() - 1}
              value={currentIndex()}
              onInput={(e) => setRawCurrentIndex(parseInt(e.currentTarget.value, 10))}
            />
            <button
              class="notebook-viewer-timeline-label"
              onClick={goToLatest}
              title="Go to latest entry"
            >
              Latest
            </button>
          </div>
        </div>

        {/* Page area with arrow buttons */}
        <div class="notebook-viewer-page-area">
          <button
            class="notebook-viewer-arrow"
            onClick={goBack}
            disabled={!canGoBack()}
            aria-label="Go back"
            title={`Go back ${stepSize()} ${stepSize() === 1 ? "entry" : "entries"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div class="notebook-viewer-page">
            <Show when={viewKey()} keyed>
              {(_key) => (
                <patchwork-view
                  doc-url={viewDocUrl()!}
                  tool-id={viewToolId()!}
                />
              )}
            </Show>
          </div>

          <button
            class="notebook-viewer-arrow"
            onClick={goForward}
            disabled={!canGoForward()}
            aria-label="Go forward"
            title={`Go forward ${stepSize()} ${stepSize() === 1 ? "entry" : "entries"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Bottom controls */}
        <div class="notebook-viewer-bottom">
          <div class="notebook-viewer-step-control">
            <span class="notebook-viewer-step-label">Step size:</span>
            <input
              type="range"
              class="notebook-viewer-step-slider"
              min={0}
              max={Math.max(0, availableStepSizes().length - 1)}
              value={stepSizeSliderIndex()}
              onInput={(e) => updateStepSizeFromSlider(parseInt(e.currentTarget.value, 10))}
            />
            <span class="notebook-viewer-step-value">{stepSize()}</span>
          </div>
          <div class="notebook-viewer-entry-info">
            <span class="notebook-viewer-entry-info-position">
              Entry {currentIndex() + 1} of {totalEntries()}
            </span>
            <span>{currentEntry()?.docTitle}</span>
          </div>
        </div>
      </Show>
    </div>
  );
}
