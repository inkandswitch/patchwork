import { DocHandle, Repo } from "@automerge/automerge-repo";
import type {
  MatchPattern,
  CursorMarker,
  AutomergeRefUrl,
  AnyPathInput,
  SegmentsFromString,
} from "./types";
import { CURSOR_MARKER } from "./types";
import { Ref } from "./ref";
import { parseAutomergeRefUrl } from "./parser";

/**
 * Create a cursor-based range segment for stable text selection.
 *
 * Must be used as the last argument in a ref path.
 * Creates stable cursors that track text positions through edits.
 *
 * @example
 * ```ts
 * ref(handle, 'note', cursor(0, 5))  // Cursor-based range on text
 * ```
 */
export function cursor(start: number, end?: number): CursorMarker {
  return { [CURSOR_MARKER]: true, start, end: end ?? start };
}

/**
 * Parse a ref from an Automerge URL string.
 *
 * @param handle - The document handle to use
 * @param url - Full automerge URL like "automerge:documentId/path#heads"
 *
 * @example
 * fromUrl(handle, "automerge:abc/todos/0#head1|head2" as AutomergeRefUrl)
 */
export function fromUrl<TDoc = any>(
  handle: DocHandle<TDoc>,
  url: AutomergeRefUrl
): Ref<TDoc, AnyPathInput[]> {
  const { segments, heads } = parseAutomergeRefUrl(url);
  const options = heads ? { heads } : {};
  return new Ref<TDoc, AnyPathInput[]>(handle, segments, options);
}

/**
 * Create a ref from a path string
 *
 * @example
 * ```ts
 * type Doc = { todos: Array<{ title: string }> };
 * const titleRef = fromString<Doc>(handle, "todos/0/title");
 * // titleRef.value() is inferred as string | undefined
 * ```
 */
export function fromString<TDoc, TPath extends string>(
  docHandle: DocHandle<TDoc>,
  path: TPath
): Ref<TDoc, SegmentsFromString<TPath>> {
  const url = docHandle.url;
  const { segments } = parseAutomergeRefUrl(
    `${url}/${path}` as AutomergeRefUrl
  );
  return new Ref<TDoc, SegmentsFromString<TPath>>(
    docHandle,
    segments as unknown as [...SegmentsFromString<TPath>]
  );
}
/**
 * Find a ref by its Automerge URL.
 *
 * URL format: `automerge:{documentId}/{path}#{heads}`
 *
 * @example
 * ```ts
 * const ref = await findRef(repo, "automerge:abc123/todos/$xyz/title" as AutomergeRefUrl);
 * ```
 */
export async function findRef<T = any>(
  repo: Repo,
  url: AutomergeRefUrl
): Promise<Ref<T>> {
  const { documentId } = parseAutomergeRefUrl(url);
  const handle = await repo.find(documentId as any);
  await handle.whenReady();

  return fromUrl(handle as DocHandle<T>, url);
}

/**
 * Check if an item matches an ID pattern.
 *
 * Note: This performs shallow equality checks only. Nested objects
 * are compared by reference, not by deep value equality.
 *
 * @internal
 */
export function matchesPattern(item: any, pattern: MatchPattern): boolean {
  return Object.entries(pattern).every(([key, value]) => item[key] === value);
}
