import type { Cursor, Heads } from "@automerge/automerge-repo";

/**
 * Symbol used as discriminator for segments to avoid collision with user data.
 * Users might have objects with a 'kind' property in id patterns.
 */
export const KIND = Symbol("kind");

/**
 * Symbol to mark a cursor request for stabilization during ref creation.
 */
export const CURSOR_MARKER = Symbol("cursor");

/**
 * Pattern used to match objects in arrays by their properties.
 * Only primitive values are allowed for reliable serialization and comparison.
 */
export type MatchPattern = Record<string, string | number | boolean | null>;

/**
 * Marker type for cursor-based range that will be stabilized.
 * Created via cursor() function and only valid as the last path argument.
 */
export interface CursorMarker {
  [CURSOR_MARKER]: true;
  start: number;
  end: number;
}

/** Path segments that have prop (non-terminal) */
export type PathSegment =
  | { [KIND]: "key"; key: string; prop?: string } // Object property access by key name
  | { [KIND]: "index"; index: number; prop?: number } // Array/list access by numeric index (position-based)
  | {
      [KIND]: "match";
      match: MatchPattern;
      prop?: number;
    };

/** Range segments (always terminal) */
export type TextRange =
  | { [KIND]: "range"; start: number; end: number } // Text/array range by numeric positions
  | { [KIND]: "cursors"; start: Cursor; end: Cursor }; // Text range by stable Automerge cursors

/** All segment types */
export type Segment = PathSegment | TextRange;

/** Input types that users can provide to create refs */
export type PathInput = string | number | MatchPattern | CursorMarker;

/** Internal: PathInput extended with Segment for URL parsing and internal use */
export type AnyPathInput = PathInput | Segment;

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

type GetSegmentValue<TObj, TSegment> = TSegment extends string
  ? TSegment extends keyof TObj
    ? TObj[TSegment]
    : unknown
  : TSegment extends number | MatchPattern
    ? TObj extends readonly (infer E)[]
      ? E
      : unknown
    : TSegment extends CursorMarker
      ? TObj extends string
        ? string
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

// Utility Types for string and path parsing

/** Split a string by a delimiter into a tuple */
type Split<
  S extends string,
  D extends string = "/",
> = S extends `${infer Head}${D}${infer Tail}`
  ? [Head, ...Split<Tail, D>]
  : S extends ""
    ? []
    : [S];

/** Check if a string represents a numeric value */
type IsNumeric<S extends string> = S extends `${number}` ? true : false;

/** Check if a string represents a range (contains ..) */
type IsRange<S extends string> = S extends `${string}..${string}`
  ? true
  : false;

/** Marker type for range segments parsed from strings */
type StringRange = { __stringRange: true };

/**
 * Parse a string segment into its semantic type for inference:
 * - "0", "123" → number (array index)
 * - "foo..bar", "0..5" → StringRange (text range → string value)
 * - "key" → literal string (object key)
 */
type ParseSegment<S extends string> =
  IsRange<S> extends true
    ? StringRange
    : IsNumeric<S> extends true
      ? number
      : S;

/** Convert a path string into a tuple of parsed segment types */
export type SegmentsFromString<P extends string> =
  Split<P> extends infer Segments
    ? Segments extends readonly string[]
      ? { [K in keyof Segments]: ParseSegment<Segments[K] & string> }
      : never
    : never;

/** Get value type for a parsed string segment */
type GetParsedSegmentValue<TObj, TSegment> = TSegment extends StringRange
  ? TObj extends string
    ? string
    : unknown
  : TSegment extends number
    ? TObj extends readonly (infer E)[]
      ? E
      : unknown
    : TSegment extends string
      ? TSegment extends keyof TObj
        ? TObj[TSegment]
        : unknown
      : unknown;

/** Recursively traverse document type using parsed path segments */
type PathValueFromString<
  TDoc,
  TPath extends readonly any[],
> = TPath extends readonly []
  ? TDoc
  : TPath extends readonly [infer First, ...infer Rest]
    ? GetParsedSegmentValue<TDoc, First> extends infer Next
      ? Next extends unknown
        ? Rest extends readonly any[]
          ? PathValueFromString<Next, Rest>
          : unknown
        : unknown
      : unknown
    : unknown;

/** Infer the ref value type from a document type and path string */
export type InferRefTypeFromString<
  TDoc,
  P extends string,
> = PathValueFromString<TDoc, SegmentsFromString<P>>;

/**
 * Branded type for Automerge ref URLs.
 * A string in the format: `automerge:documentId/path#heads`
 */
export type AutomergeRefUrl = string & { readonly __brand: "AutomergeRefUrl" };
