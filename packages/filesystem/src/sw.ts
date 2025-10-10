import type { AutomergeUrl, DocHandle } from "@automerge/automerge-repo/slim";

// TODO: support heads in the URL!
export function automergeUrlToServiceWorkerUrl(
  automergeUrl: AutomergeUrl
): string {
  return `/automerge/${automergeUrl}/`;
}

// TODO: support heads in the URL!
export function docHandleToServiceWorkerUrl(handle: DocHandle<any>): string {
  return automergeUrlToServiceWorkerUrl(handle.url);
}
