import { createSignal, onMount } from "solid-js";

/**
 * Hook for reactive localStorage access with error handling.
 * Automatically serializes/deserializes values and handles storage errors gracefully.
 *
 * @param key - The localStorage key to use
 * @param initialValue - The initial value if no stored value exists
 * @returns A tuple of [getter, setter] similar to createSignal
 *
 * @example
 * // For strings
 * const [url, setUrl] = useLocalStorage("accountUrl", "");
 *
 * @example
 * // For booleans
 * const [enabled, setEnabled] = useLocalStorage("debugMode", false);
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [() => T, (value: T) => void] {
  const [storedValue, setStoredValue] = createSignal<T>(initialValue);

  // Load initial value from localStorage
  onMount(() => {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        // Try to parse as JSON, fall back to raw string for simple values
        try {
          const parsed = JSON.parse(item);
          setStoredValue(() => parsed);
        } catch {
          // If JSON parse fails, treat as plain string
          setStoredValue(() => item as T);
        }
      }
    } catch (error) {
      // localStorage may be unavailable (private browsing, permissions, etc.)
      console.warn(`Failed to read "${key}" from localStorage:`, error);
    }
  });

  // Setter that updates both state and localStorage
  const setValue = (value: T) => {
    try {
      setStoredValue(() => value);

      // Serialize value for storage
      const valueToStore =
        typeof value === "string" ? value : JSON.stringify(value);

      localStorage.setItem(key, valueToStore);
    } catch (error) {
      // localStorage may be unavailable or quota exceeded
      console.error(`Failed to save "${key}" to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
}

/**
 * Hook for boolean localStorage values with simpler API.
 * Uses presence/absence of key rather than JSON serialization.
 *
 * @param key - The localStorage key to use
 * @param initialValue - The initial value if no stored value exists
 * @returns A tuple of [getter, setter]
 *
 * @example
 * const [debugEnabled, setDebugEnabled] = useLocalStorageBoolean("debugModal", false);
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean
): [() => boolean, (value: boolean) => void] {
  const [storedValue, setStoredValue] = createSignal<boolean>(initialValue);

  onMount(() => {
    try {
      const item = localStorage.getItem(key);
      setStoredValue(() => item === "true");
    } catch (error) {
      console.warn(`Failed to read "${key}" from localStorage:`, error);
    }
  });

  const setValue = (value: boolean) => {
    try {
      setStoredValue(() => value);

      if (value) {
        localStorage.setItem(key, "true");
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Failed to save "${key}" to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
}
