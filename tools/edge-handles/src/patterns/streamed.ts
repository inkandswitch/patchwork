/**
 * Async transform with cancellation, expressed as an async iterable.
 *
 * Each input change starts a new run; previous in-flight runs are aborted
 * via an `AbortSignal` so user code can cooperate. The canonical
 * "latest-wins" scheduling shape, demonstrated with no hidden helper —
 * cancellation plumbing is on screen.
 *
 *     const transform = streamed(async function* (source, signal) {
 *       const src = source.src?.value();
 *       if (typeof src !== "string") return;
 *       for (const chunk of await renderChunked(src, signal)) {
 *         if (signal.aborted) return;
 *         yield chunk;
 *       }
 *     });
 *     const detach = transform(edge);
 */
import type { EdgeHandle, Handle } from "@inkandswitch/edge-handles";

export function streamed<T>(
  fn: (
    source: Record<string, Handle>,
    signal: AbortSignal
  ) => AsyncIterable<T> | Promise<T> | T
): (edge: EdgeHandle<T>) => () => void {
  return (edge) => {
    let ctrl = new AbortController();
    const run = async () => {
      ctrl.abort();
      ctrl = new AbortController();
      const signal = ctrl.signal;
      try {
        const out = fn(edge.source, signal);
        const result = await out;
        if (
          result &&
          typeof (result as any)[Symbol.asyncIterator] === "function"
        ) {
          for await (const v of result as AsyncIterable<T>) {
            if (signal.aborted) return;
            edge.change(v);
          }
        } else if (result !== undefined) {
          if (!signal.aborted) edge.change(result as T);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("[edge-handles] streamed transform threw", err);
        }
      }
    };
    const unsub = edge.onAnyChange(() => void run());
    return () => {
      ctrl.abort();
      unsub();
    };
  };
}
