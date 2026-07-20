/**
 * Small bits shared between the html, manifest, and netlify plugins so the
 * three generated artifacts (index.html, manifest.webmanifest, _headers)
 * never drift out of sync with each other.
 */

export const DEFAULT_SYNC_SERVERS = [
  "https://subduction.sync.inkandswitch.com",
];

// Emitted by importmap-plugin.ts. keyhive_wasm.wasm is loaded lazily (only
// when keyhive is actually enabled), so it isn't worth an eager preload.
export const PRELOAD_WASM_ASSETS = ["automerge.wasm", "subduction.wasm"];

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]!);
}
