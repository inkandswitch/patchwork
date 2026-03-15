import {
  type AutomergeUrl,
  type DocHandle,
} from "@automerge/automerge-repo";

const isTauri = typeof globalThis !== "undefined" && "__TAURI__" in globalThis;

export function automergeUrlToServiceWorkerUrl(
  automergeUrl: AutomergeUrl
): string {
  if (isTauri) {
    // In Tauri, use a custom protocol handler instead of the service worker.
    // This works on iOS where service workers aren't available in WKWebView.
    return `patchwork://localhost/${encodeURIComponent(automergeUrl)}/`;
  }
  return `/${encodeURIComponent(automergeUrl)}/`;
}

export function docHandleToServiceWorkerUrl(handle: DocHandle<any>): string {
  return automergeUrlToServiceWorkerUrl(handle.url);
}
