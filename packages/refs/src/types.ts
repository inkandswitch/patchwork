import type { Cursor, Heads } from "@automerge/automerge-repo";

// Symbols for PathSegment fields to avoid collisions with user data
export const QUERY = Symbol("query");
export const ID = Symbol("id");

/**
 * A path segment with optional stable ID.
 * - QUERY: Property name, index, where clause, or range
 * - ID: Stable reference (ObjectId or cursors) - used for resolution if present
 */
export type PathSegment = {
  [QUERY]?: string | number | Record<string, any> | [number, number];
  [ID]?: string | [Cursor, Cursor];
};

export type PathInput = NonNullable<PathSegment[typeof QUERY]> | PathSegment;

export interface RefOptions {
  heads?: Heads;
}

/** Context object with helpers for Automerge text operations */
export interface RefContext {
  splice(index: number, deleteCount: number, insert?: string): void;
  updateText(newValue: string): void;
}

/** Check if a type is a primitive (not an object or array) */
type IsPrimitive<T> = T extends object
  ? T extends any[]
    ? false
    : false
  : true;

/**
 * Change function signature that enforces:
 * - Primitives: return T to update, void to skip
 * - Objects/arrays: mutate in place, return void
 *
 * TODO: Consider allowing returns for objects too (e.g. return {...obj, field: value})
 * This would require changes to the implementation to replace rather than assume mutation.
 */
export type ChangeFn<T> =
  IsPrimitive<T> extends true
    ? (val: T, ctx: RefContext) => T | void
    : (val: T, ctx: RefContext) => void;

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
      : TSegment extends PathSegment
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
