import {
  type AutomergeUrl,
  type DocHandle,
} from "@automerge/automerge-repo";

const isTauri = typeof globalThis !== "undefined" && "__TAURI__" in globalThis;

export function automergeUrlToServiceWorkerUrl(
  automergeUrl: AutomergeUrl
): string {
  if (isTauri) {
    // In Tauri, use a local HTTP server instead of the service worker.
    // This works on iOS where service workers aren't available in WKWebView.
    // Using real HTTP (not a custom scheme) so that 307 redirects work —
    // WebKit's WKURLSchemeHandler silently ignores redirects from custom schemes.
    return `http://localhost:3030/${encodeURIComponent(automergeUrl)}/`;
  }
  return `/${encodeURIComponent(automergeUrl)}/`;
}

export function docHandleToServiceWorkerUrl(handle: DocHandle<any>): string {
  return automergeUrlToServiceWorkerUrl(handle.url);
}
