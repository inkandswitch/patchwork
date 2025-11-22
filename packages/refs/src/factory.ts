import * as Automerge from "@automerge/automerge";
import type { DocHandle } from "@automerge/automerge-repo";
import { Ref } from "./ref";
import { isDynamic } from "./at";
import type { PathSegment, PathBuilder } from "./types";

/**
 * Create a ref to a location in an Automerge document.
 *
 * Refs are stable by default:
 * - Numeric indices resolve to ObjectIds
 * - Where clauses resolve to ObjectIds
 * - Ranges convert to cursors
 *
 * Use `at()` to create dynamic/unstable refs.
 *
 * @example
 * ```ts
 * // Stable refs (survive reordering)
 * ref(handle, 'todos', 0, 'title')
 * ref(handle, 'todos', { id: 'abc' }, 'done')
 * ref(handle, 'notes', 0, 'content', [10, 20])
 *
 * // Dynamic refs (positional)
 * ref(handle, 'todos', at(0), 'title')
 * ref(handle, 'todos', at({ id: 'abc' }), 'done')
 * ref(handle, 'notes', 0, 'content', at([10, 20]))
 * ```
 */
export function ref<T = any>(
  docHandle: DocHandle<any>,
  ...segments: PathBuilder[]
): Ref<T> {
  const doc = docHandle.doc();
  if (!doc) {
    // Document not yet loaded - create ref with basic path
    // Resolution will fail until doc is loaded
    const basicPath = segments.map((seg) => {
      if (isDynamic(seg)) return seg.value;
      return seg as PathSegment;
    });
    return new Ref<T>(docHandle, basicPath);
  }

  const path = buildPath(doc, segments);
  return new Ref<T>(docHandle, path);
}

/**
 * Build a path from user-provided segments, stabilizing as needed.
 */
function buildPath(
  doc: Automerge.Doc<any>,
  segments: PathBuilder[]
): PathSegment[] {
  const path: PathSegment[] = [];
  let currentPath: PathSegment[] = [];

  for (const segment of segments) {
    // Check if wrapped in at() (dynamic marker)
    if (isDynamic(segment)) {
      // Dynamic segment - use as-is without stabilization
      path.push(segment.value);
      currentPath.push(segment.value);
      continue;
    }

    // Stabilize the segment
    const stabilized = stabilizeSegment(doc, currentPath, segment);
    path.push(stabilized);
    currentPath.push(stabilized);
  }

  return path;
}

/**
 * Stabilize a segment by resolving to ObjectIds or cursors.
 */
function stabilizeSegment(
  doc: Automerge.Doc<any>,
  currentPath: PathSegment[],
  segment: PathBuilder
): PathSegment {
  // String property - always stable
  if (typeof segment === "string") {
    return segment;
  }

  // Numeric index - resolve to ObjectId
  if (typeof segment === "number") {
    return stabilizeNumericIndex(doc, currentPath, segment);
  }

  // Range [start, end] - convert to cursors
  if (Array.isArray(segment) && segment.length === 2) {
    return stabilizeRange(doc, currentPath, segment as [number, number]);
  }

  // Where clause or plain object
  if (typeof segment === "object" && segment !== null) {
    // Check if it's a plain where clause (not an Automerge proxy object)
    // If it has a constructor other than Object, it might be an Automerge object
    if (segment.constructor === Object) {
      // Plain object - treat as where clause, resolve to ObjectId
      return stabilizeWhereClause(doc, currentPath, segment);
    }

    // It's an Automerge object reference - extract its ObjectId
    const objectId = Automerge.getObjectId(segment);
    if (objectId) {
      return { $id: objectId };
    }
  }

  // Fallback - return as-is
  return segment as PathSegment;
}

/**
 * Stabilize a numeric index by finding the object and extracting its ObjectId.
 */
function stabilizeNumericIndex(
  doc: Automerge.Doc<any>,
  currentPath: PathSegment[],
  index: number
): PathSegment {
  const container = resolvePath(doc, currentPath);

  if (!Array.isArray(container)) {
    // Not an array - return the index as-is (might fail at resolution time)
    return index;
  }

  const item = container[index];
  if (item === undefined) {
    // Out of bounds - return index as-is
    return index;
  }

  // Try to get ObjectId
  const objectId = Automerge.getObjectId(item);
  if (objectId) {
    return { $id: objectId };
  }

  // Item is a primitive or doesn't have an ObjectId - return index
  return index;
}

/**
 * Stabilize a where clause by finding the matching object and extracting its ObjectId.
 */
function stabilizeWhereClause(
  doc: Automerge.Doc<any>,
  currentPath: PathSegment[],
  clause: Record<string, any>
): PathSegment {
  const container = resolvePath(doc, currentPath);

  if (!Array.isArray(container)) {
    // Not an array - return clause as-is
    return clause;
  }

  // Find matching item
  const item = container.find((obj) => {
    for (const [key, value] of Object.entries(clause)) {
      if (obj[key] !== value) return false;
    }
    return true;
  });

  if (!item) {
    // No match - return clause as-is (will fail at resolution time)
    return clause;
  }

  // Try to get ObjectId
  const objectId = Automerge.getObjectId(item);
  if (objectId) {
    return { $id: objectId };
  }

  // Item doesn't have ObjectId - return clause as-is
  return clause;
}

/**
 * Stabilize a range by converting numeric indices to cursors.
 *
 * TODO: This is a stub implementation. Cursor-based ranges need:
 * - Proper path context to resolve cursors
 * - Integration with Automerge.getCursor
 */
function stabilizeRange(
  doc: Automerge.Doc<any>,
  currentPath: PathSegment[],
  range: [number, number]
): PathSegment {
  // For now, return numeric ranges as-is
  // Cursor stabilization will be implemented later
  return range;
}

/**
 * Resolve a path to get a value (similar to Ref's #resolvePath but simplified).
 */
function resolvePath(doc: any, path: PathSegment[]): any {
  let current = doc;

  for (const segment of path) {
    if (current === undefined || current === null) {
      return undefined;
    }

    // Simple resolution - just use direct access or ObjectId lookup
    if (typeof segment === "string" || typeof segment === "number") {
      current = current[segment];
    } else if (typeof segment === "object" && "$id" in segment) {
      // ObjectId lookup
      if (!Array.isArray(current)) return undefined;
      current = current.find(
        (item: any) => Automerge.getObjectId(item) === segment.$id
      );
    } else if (typeof segment === "object") {
      // Where clause
      if (!Array.isArray(current)) return undefined;
      current = current.find((item: any) => {
        for (const [key, value] of Object.entries(segment)) {
          if (item[key] !== value) return false;
        }
        return true;
      });
    } else {
      return undefined;
    }
  }

  return current;
}
