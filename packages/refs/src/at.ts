import type { DynamicSegment } from "./types";

/**
 * Mark a path segment as dynamic/unstable.
 *
 * By default, refs are stable:
 * - Numeric indices resolve to ObjectIds
 * - Where clauses resolve to ObjectIds
 * - Ranges convert to cursors
 *
 * Wrapping a segment in at() makes it dynamic:
 * - at(0) - Positional index (not ObjectId)
 * - at({ title: "x" }) - Re-query on each access
 * - at([10, 20]) - Numeric indices (not cursors)
 *
 * @example
 * ```ts
 * // Stable (resolves to ObjectId)
 * ref(handle, 'todos', 0)
 *
 * // Dynamic (positional index)
 * ref(handle, 'todos', at(0))
 * ```
 */
export function at<T>(segment: T): DynamicSegment<T> {
  return { __dynamic: true, value: segment };
}

// TODO: narrow the type of the segment to the type of the DynamicSegment
/**
 * Type guard to check if a segment is dynamic.
 */
export function isDynamic(segment: any): segment is DynamicSegment<any> {
  return (
    segment !== null &&
    segment !== undefined &&
    typeof segment === "object" &&
    segment.__dynamic === true
  );
}
