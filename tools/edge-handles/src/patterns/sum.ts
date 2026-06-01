/**
 * Sum every numeric source. The canonical multi-input transform.
 *
 * Non-numeric or non-finite sources are filtered. Shows the basic
 * "iterate named sources, project, emit" shape end-to-end.
 */
import type { EdgeHandle } from "@inkandswitch/edge-handles";

export function sum(edge: EdgeHandle<number>): () => void {
  return edge.onAnyChange(() => {
    let total = 0;
    for (const src of Object.values(edge.source)) {
      const v = src.value();
      if (typeof v === "number" && Number.isFinite(v)) total += v;
    }
    edge.change(total);
  });
}
