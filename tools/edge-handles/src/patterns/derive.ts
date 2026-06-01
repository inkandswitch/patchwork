/**
 * Run a pure projection over an edge's named sources.
 *
 * Configured by passing the projection function. Returns an
 * `(edge) => detach` so it composes with whatever wiring code holds the edge.
 *
 * ```ts
 * const detach = derive((source) => source.a.value() + source.b.value())(edge);
 * ```
 */
import type { EdgeHandle, Handle } from "@inkandswitch/edge-handles";

export function derive<T = unknown>(
  fn: (source: Record<string, Handle>) => T | undefined
): (edge: EdgeHandle<T>) => () => void {
  return (edge) =>
    edge.onAnyChange(() => {
      const result = fn(edge.source);
      if (result === undefined) return;
      edge.change(result);
    });
}
