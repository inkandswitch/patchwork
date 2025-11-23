import type { Cursor, Heads } from "@automerge/automerge-repo";

/**
 * Symbols for PathSegment fields to avoid collisions with user data
 */
export const QUERY = Symbol("query");
export const ID = Symbol("id");

/**
 * A segment in a path through an Automerge document.
 *
 * - query: How to find this location (property name, index, where clause, range)
 * - id: Optional stable reference (ObjectId or cursors) for array items/ranges
 *
 * If id is present, it's used for resolution; query is a fallback or hint.
 */
export type PathSegment = {
  [QUERY]?: string | number | Record<string, any> | [number, number];
  [ID]?: string | [Cursor, Cursor];
};

/**
 * Input types accepted when constructing a ref.
 * These are the "query" values - how users specify what they want.
 */
export type PathInput = NonNullable<PathSegment[typeof QUERY]> | PathSegment;

export interface RefOptions {
  heads?: Heads;
}

/**
 * Context object provided to Ref.change() callbacks.
 * Provides helper methods for working with Automerge text objects.
 */
export interface RefContext {
  /**
   * Splice text at the given position.
   * Only works when the ref points to an Automerge text object.
   *
   * @param index - Position to splice at
   * @param deleteCount - Number of characters to delete
   * @param insert - Optional string to insert
   *
   * @example
   * ```ts
   * textRef.change((text, ctx) => {
   *   ctx.splice(0, 5, "new"); // Replace first 5 chars with "new"
   * });
   * ```
   */
  splice(index: number, deleteCount: number, insert?: string): void;

  /**
   * Update the entire text value.
   * Only works when the ref points to an Automerge text object.
   *
   * @param newValue - The new text value
   *
   * @example
   * ```ts
   * textRef.change((text, ctx) => {
   *   ctx.updateText("completely new text");
   * });
   * ```
   */
  updateText(newValue: string): void;
}
