import { type AutomergeUrl, type DocHandle } from "@automerge/automerge-repo";

export function getImportableUrlFromAutomergeUrl(
  automergeUrl: AutomergeUrl,
  subpath?: string
): string {
  const base = `/${encodeURIComponent(automergeUrl)}/`;
  if (!subpath || subpath === ".") return base;
  // Strip leading "./" if present
  const clean = subpath.replace(/^\.\//, "");
  return `${base}${clean}`;
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
