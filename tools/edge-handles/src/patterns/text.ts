/**
 * Tiny text transforms over a single source. The "lift a unary function"
 * shape, written out three times so the structure is plainly visible.
 */
import type { EdgeHandle } from "@inkandswitch/edge-handles";

function firstStringSource(edge: EdgeHandle<string>): string {
  const first = Object.values(edge.source)[0];
  const v = first?.value();
  return typeof v === "string" ? v : "";
}

export function upper(edge: EdgeHandle<string>): () => void {
  return edge.onAnyChange(() =>
    edge.change(firstStringSource(edge).toUpperCase())
  );
}

export function lower(edge: EdgeHandle<string>): () => void {
  return edge.onAnyChange(() =>
    edge.change(firstStringSource(edge).toLowerCase())
  );
}

export function slugify(edge: EdgeHandle<string>): () => void {
  return edge.onAnyChange(() =>
    edge.change(
      firstStringSource(edge)
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
  );
}
