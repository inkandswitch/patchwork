import {
  parseAutomergeUrl,
  type AutomergeUrl,
  type DocHandle,
} from "@automerge/automerge-repo/slim";

export function automergeUrlToServiceWorkerUrl(
  automergeUrl: AutomergeUrl
): string {
  const { heads, documentId } = parseAutomergeUrl(automergeUrl);
  const headQuery = heads ? `?heads=${heads.join("|")}` : "";
  return `/automerge/automerge:${documentId}/${headQuery}`;
}

export function docHandleToServiceWorkerUrl(handle: DocHandle<any>): string {
  return automergeUrlToServiceWorkerUrl(handle.url);
}
