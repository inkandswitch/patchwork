import type { Cursor, Heads } from "@automerge/automerge-repo";

/**
 * Symbol used as discriminator for segments to avoid collision with user data.
 * Users might have objects with a 'kind' property in id patterns.
 */
export const KIND = Symbol("kind");

/**
 * Pattern used to match objects in arrays by their properties.
 * Only primitive values are allowed for reliable serialization and comparison.
 */
export type IdPattern = Record<string, string | number | boolean | null>;

/** Path segments that have resolvedProp (non-terminal) */
export type PathSegment =
  | { [KIND]: "key"; key: string; resolvedProp?: string } // Object property access by key name
  | { [KIND]: "index"; index: number; resolvedProp?: number } // Array/list access by numeric index (unstable - position-based)
  | { [KIND]: "stable_index"; id: string; resolvedProp?: number } // Array/list access by stable Automerge ObjectId (undefined if not found)
  | {
      [KIND]: "query";
      idPattern: IdPattern;
      resolvedProp?: number;
    }; // Array/list search by id pattern (undefined if no match)

/** Range segments (always terminal) */
export type RangeSegment =
  | { [KIND]: "range"; start: number; end: number } // Text/array range by numeric positions (unstable)
  | { [KIND]: "stable_range"; start: Cursor; end: Cursor }; // Text range by stable Automerge cursors

/** All segment types (for input compatibility) */
export type Segment = PathSegment | RangeSegment;

/** Input types that users can provide to create segments */
export type PathInput =
  | string
  | number
  | IdPattern
  | [number, number]
  | Segment;

export interface RefOptions {
  heads?: Heads;
}

/**
 * Mutable text wrapper that provides Automerge text operations.
 * Passed to change callbacks when the ref points to a string value.
 *
 * Behaves like a string with two additional mutation methods.
 */
export interface MutableText extends String {
  splice(index: number, deleteCount: number, insert?: string): void;
  updateText(newValue: string): void;
}

/**
 * Return a new value to update primitive values, or void to skip the update.
 * For strings, receives a MutableText object with splice/updateText methods.
 *
 * Note: Objects and arrays should be mutated in place (not returned).
 * Returning non-primitives will trigger a runtime warning.
 */
export type ChangeFn<T> = (val: T extends string ? MutableText : T) => T | void;

// Helper to extract non-undefined part of a type
type NonUndefined<T> = T extends undefined ? never : T;

type GetSegmentValue<TObj, TSegment> = TSegment extends string
  ? TSegment extends keyof NonUndefined<TObj>
    ? NonUndefined<TObj>[TSegment]
    : unknown
  : TSegment extends readonly [number, number]
    ? NonUndefined<TObj> extends string
      ? string
      : NonUndefined<TObj> extends readonly (infer E)[]
        ? readonly E[]
        : unknown
    : TSegment extends number | IdPattern
      ? TObj extends undefined
        ? undefined
        : NonUndefined<TObj> extends readonly (infer E)[]
          ? E | undefined
          : unknown
      : unknown;

/** Recursively infer type by traversing path through document */
export type PathValue<TDoc, TPath extends readonly any[]> = TPath extends []
  ? TDoc
  : TPath extends readonly [infer First, ...infer Rest]
    ? GetSegmentValue<TDoc, First> extends infer Next
      ? Next extends never
        ? unknown
        : PathValue<Next, Rest>
      : unknown
    : unknown;

export type InferRefType<TDoc, TPath extends readonly any[]> = PathValue<
  TDoc,
  TPath
>;
