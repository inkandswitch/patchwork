import type { Cursor, Heads } from "@automerge/automerge-repo";

/**
 * Symbol used as discriminator for segments to avoid collision with user data.
 * Users might have objects with a 'kind' property in where clauses.
 */
export const KIND = Symbol("kind");

/** Path segments that have resolvedProp (non-terminal) */
export type PathSegment =
  | { [KIND]: "key"; key: string; resolvedProp?: string } // Object property access by key name
  | { [KIND]: "index"; index: number; resolvedProp?: number } // Array/list access by numeric index (unstable - position-based)
  | { [KIND]: "stable_index"; id: string; resolvedProp?: number } // Array/list access by stable Automerge ObjectId (undefined if not found)
  | {
      [KIND]: "query";
      clause: Record<string, any>;
      resolvedProp?: number;
    }; // Array/list search by where clause (undefined if no match)

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
  | Record<string, any>
  | [number, number]
  | Segment;

export interface RefOptions {
  heads?: Heads;
}

/** Context object with helpers for Automerge text operations */
export interface RefContext {
  splice(index: number, deleteCount: number, insert?: string): void;
  updateText(newValue: string): void;
}

/**
 * Change function signature.
 * Return a new value to update primitive values, or void to skip the update.
 */
export type ChangeFn<T> = (val: T, ctx: RefContext) => T | void;

type GetSegmentValue<TObj, TSegment> = TSegment extends string
  ? TSegment extends keyof TObj
    ? TObj[TSegment]
    : unknown
  : // Check ranges before Record<string, any> (tuples extend objects)
    TSegment extends readonly [number, number]
    ? TObj extends string
      ? string
      : TObj extends readonly (infer E)[]
        ? readonly E[]
        : unknown
    : TSegment extends number | Record<string, any>
      ? TObj extends readonly (infer E)[]
        ? E
        : unknown
      : TSegment extends Segment
        ? unknown
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

/** Use explicit T if provided, otherwise infer from TDoc and TPath */
export type ResolveRefType<
  T,
  TDoc,
  TPath extends readonly any[],
> = 0 extends 1 & T ? InferRefType<TDoc, TPath> : T;
