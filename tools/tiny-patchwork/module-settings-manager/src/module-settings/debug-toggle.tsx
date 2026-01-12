// NOTE: THIS IS GARBAGE CODE AND WILL BE REMOVED
// Written by Claude

import { createSignal, onMount } from "solid-js";

const DEBUG_MODAL_KEY = "debugModal";

function isDebugModalEnabled(): boolean {
  try {
    return localStorage.getItem(DEBUG_MODAL_KEY) === "true";
  } catch {
    return false;
  }
}

function setDebugModalEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(DEBUG_MODAL_KEY, "true");
    } else {
      localStorage.removeItem(DEBUG_MODAL_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

export function DebugToggle() {
  const [debugEnabled, setDebugEnabled] = createSignal(false);

  onMount(() => {
    setDebugEnabled(isDebugModalEnabled());
  });

  const handleDebugToggle = () => {
    const newValue = !debugEnabled();
    setDebugEnabled(newValue);
    setDebugModalEnabled(newValue);
  };

  return (
    <label class="module-settings-debug-toggle">
      <input
        type="checkbox"
        checked={debugEnabled()}
        onChange={handleDebugToggle}
      />
      <span class="module-settings-debug-toggle__label">Show Debug Toast</span>
    </label>
  );
}
