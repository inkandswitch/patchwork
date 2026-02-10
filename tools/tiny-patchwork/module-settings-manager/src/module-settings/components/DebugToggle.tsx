import { STORAGE_KEY_DEBUG_MODAL } from "../constants.ts";
import { useLocalStorageBoolean } from "../hooks/useLocalStorage.ts";

export function DebugToggle() {
  const [debugEnabled, setDebugEnabled] = useLocalStorageBoolean(
    STORAGE_KEY_DEBUG_MODAL,
    false
  );

  const handleDebugToggle = () => {
    setDebugEnabled(!debugEnabled());
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
