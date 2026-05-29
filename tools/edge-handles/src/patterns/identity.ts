/**
 * Pass the first source's value straight through.
 *
 * The minimal transform — useful for routing where you want one source's
 * value available at a different identity (the edge's own URL).
 */
import type { EdgeHandle } from "@inkandswitch/edge-handles";

export function identity<T = unknown>(edge: EdgeHandle<T>): () => void {
  return edge.onAnyChange(() => {
    const first = Object.values(edge.source)[0];
    if (!first) return;
    edge.change(first.value() as T);
  });
}
