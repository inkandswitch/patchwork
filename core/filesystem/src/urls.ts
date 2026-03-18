import { type AutomergeUrl, type DocHandle } from "@automerge/automerge-repo";

const isTauri = typeof globalThis !== "undefined" && "__TAURI__" in globalThis;

export function getImportableUrlFromAutomergeUrl(
  automergeUrl: AutomergeUrl,
  subpath?: string
): string {
  const baseUrl = isTauri
    ? `http://localhost:3030/${encodeURIComponent(automergeUrl)}/`
    : `/${encodeURIComponent(automergeUrl)}/`;
  if (!subpath || subpath === ".") return baseUrl;
  // Strip leading "./" if present
  const clean = subpath.replace(/^\.\//, "");
  return `${baseUrl}${clean}`;
}

export function getImportableUrlFromDocHandle(
  handle: DocHandle<any>,
  subpath?: string
): string {
  return getImportableUrlFromAutomergeUrl(handle.url, subpath);
}

/** @deprecated Use {@link getImportableUrlFromAutomergeUrl} instead */
export function automergeUrlToServiceWorkerUrl(
  automergeUrl: AutomergeUrl,
  subpath?: string
): string {
  return getImportableUrlFromAutomergeUrl(automergeUrl, subpath);
}

/** @deprecated Use {@link getImportableUrlFromDocHandle} instead */
export function docHandleToServiceWorkerUrl(
  handle: DocHandle<any>,
  subpath?: string
): string {
  return getImportableUrlFromAutomergeUrl(handle.url, subpath);
}
