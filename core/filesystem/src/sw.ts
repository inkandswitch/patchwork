import {
  type AutomergeUrl,
  type DocHandle,
} from "@automerge/automerge-repo/slim";

export function automergeUrlToServiceWorkerUrl(
  automergeUrl: AutomergeUrl
): string {
  return `/automerge/${encodeURIComponent(automergeUrl)}/`;
}

export function docHandleToServiceWorkerUrl(handle: DocHandle<any>): string {
  return automergeUrlToServiceWorkerUrl(handle.url);
}
