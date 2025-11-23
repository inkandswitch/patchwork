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
   */
  splice(index: number, deleteCount: number, insert?: string): void;

  /**
   * Update the entire text value.
   * Only works when the ref points to an Automerge text object.
   */
  updateText(newValue: string): void;
}

/**
 * Get the value type at a specific path segment.
 * Handles string keys, numeric indices, where clauses, and ranges.
 */
type GetSegmentValue<TObj, TSegment> =
  // String property access
  TSegment extends string
    ? TSegment extends keyof TObj
      ? TObj[TSegment]
      : unknown
    : // Numeric index (array access) OR where clause (object filter) → array element
      TSegment extends number | Record<string, any>
      ? TObj extends readonly (infer E)[]
        ? E
        : unknown
      : // Ranges return unknown (can't determine the slice type precisely)
        TSegment extends [number, number]
        ? unknown
        : // PathSegment with symbols returns unknown
          TSegment extends PathSegment
          ? unknown
          : // Default: unknown
            unknown;

/**
 * Recursively traverse a path through a document type.
 * Returns the type at the end of the path, or unknown if the path is invalid.
 */
export type PathValue<TDoc, TPath extends readonly any[]> = TPath extends []
  ? TDoc
  : TPath extends readonly [infer First, ...infer Rest]
    ? GetSegmentValue<TDoc, First> extends infer Next
      ? Next extends never
        ? unknown
        : PathValue<Next, Rest>
      : unknown
    : unknown;

/**
 * Helper to infer the type of a ref based on document and path.
 */
export type InferRefType<TDoc, TPath extends readonly any[]> = PathValue<
  TDoc,
  TPath
>;
