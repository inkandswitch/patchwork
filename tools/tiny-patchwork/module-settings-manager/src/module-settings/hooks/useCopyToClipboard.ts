import { createSignal, onCleanup } from "solid-js";
import { COPY_FEEDBACK_DURATION } from "../constants.ts";

/**
 * Hook for copying text to clipboard with visual feedback.
 * Properly cleans up timeouts to prevent memory leaks.
 *
 * @returns A tuple of [copiedText signal, copy function]
 *
 * @example
 * const [copiedText, copy] = useCopyToClipboard();
 * <button onClick={() => copy("text to copy")}>
 *   {copiedText() === "text to copy" ? "Copied!" : "Copy"}
 * </button>
 */
export function useCopyToClipboard() {
  const [copiedText, setCopiedText] = createSignal<string | null>(null);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);

      // Clear any existing timeout before setting a new one
      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        setCopiedText(null);
        timeoutId = null;
      }, COPY_FEEDBACK_DURATION);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setCopiedText(null);
    }
  };

  // Clean up timeout when component unmounts
  onCleanup(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  });

  return [copiedText, copy] as const;
}
