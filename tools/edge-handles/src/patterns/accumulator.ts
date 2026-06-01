/**
 * Stateful accumulator — fold incoming source changes into a running value.
 *
 * Transforms can hold their own state across invocations. The state is
 * local to the attach (the closure), not on the edge — the edge stays a
 * pure cell.
 *
 *     const counts = accumulator(0, (n) => n + 1);
 *     const detach = counts(edge);   // increments each time any source changes
 */
import type { EdgeHandle, Handle } from "@inkandswitch/edge-handles";

export function accumulator<T>(
  initial: T,
  step: (prev: T, source: Record<string, Handle>) => T
): (edge: EdgeHandle<T>) => () => void {
  return (edge) => {
    let state = initial;
    edge.change(state);
    // onAnyChange auto-fires on subscribe (via onMembersChange), running
    // `tick` once to produce the first stepped state. Subsequent upstream
    // changes step again.
    return edge.onAnyChange(() => {
      state = step(state, edge.source);
      edge.change(state);
    });
  };
}
