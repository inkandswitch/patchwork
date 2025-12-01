import type { DocHandle } from "@automerge/automerge-repo";
import { Ref } from "./ref";
import type { PathInput } from "./types";

/**
 * Create a ref with automatic type inference.
 *
 * @example
 * ```ts
 * const titleRef = ref(handle, 'todos', 0, 'title');
 * titleRef.value(); // string | undefined
 * ```
 */

export function ref<TDoc, TPath extends readonly PathInput[]>(
  docHandle: DocHandle<TDoc>,
  ...segments: [...TPath]
): Ref<TDoc, TPath> {
  return new Ref<TDoc, TPath>(docHandle, segments as [...TPath]);
}
