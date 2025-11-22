import * as Automerge from "@automerge/automerge";
import type { DynamicSegment } from "./types";

// TODO: think about this...
// TODO: add tests

/**
 * Type guard to check if a value is an Automerge Cursor.
 * Cursors are strings in the format: "number@alphanumeric"
 * Example: "2@fe74e7d3d9d2f00bf7096f6a1eb64afb"
 */
export function isCursor(value: any): value is Automerge.Cursor {
  if (typeof value !== "string") return false;
  // Check format: starts with number, followed by @, followed by alphanumeric
  return /^\d+@[a-zA-Z0-9]+$/.test(value);
}

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

// Context for splice/updateText helpers
// This will be set by Ref.change() before calling the user's callback
let currentDoc: Automerge.Doc<any> | null = null;
let currentPath: Automerge.Prop[] | null = null;

/**
 * @internal
 * Set the context for text mutation helpers.
 * Called by Ref.change() before invoking user callback.
 */
export function _setTextMutationContext(
  doc: Automerge.Doc<any>,
  path: Automerge.Prop[]
): void {
  currentDoc = doc;
  currentPath = path;
}

/**
 * @internal
 * Clear the text mutation context.
 * Called by Ref.change() after user callback completes.
 */
export function _clearTextMutationContext(): void {
  currentDoc = null;
  currentPath = null;
}

/**
 * Splice text at the given position.
 * Must be called within a ref.change() callback.
 *
 * @param text - The text object (not used, for API ergonomics)
 * @param index - Position to splice at
 * @param deleteCount - Number of characters to delete
 * @param insert - Optional string to insert
 */
export function splice(
  text: string,
  index: number,
  deleteCount: number,
  insert?: string
): void {
  if (!currentDoc || !currentPath) {
    throw new Error("splice() must be called within a ref.change() callback");
  }

  Automerge.splice(currentDoc, currentPath, index, deleteCount, insert);
}

/**
 * Update the entire text value.
 * Must be called within a ref.change() callback.
 * EXPERIMENTAL
 *
 * @param text - The text object (not used, for API ergonomics)
 * @param newValue - The new text value
 */
export function updateText(text: string, newValue: string): void {
  if (!currentDoc || !currentPath) {
    throw new Error(
      "updateText() must be called within a ref.change() callback"
    );
  }

  Automerge.updateText(currentDoc, currentPath, newValue);
}
