import {
  type AutomergeUrl,
  type DocHandle,
} from "@automerge/automerge-repo";

export function automergeUrlToServiceWorkerUrl(
  automergeUrl: AutomergeUrl
): string {
  return `/${encodeURIComponent(automergeUrl)}/`;
}

export function docHandleToServiceWorkerUrl(handle: DocHandle<any>): string {
  return automergeUrlToServiceWorkerUrl(handle.url);
}
