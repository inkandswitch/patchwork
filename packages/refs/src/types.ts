import type {
  Cursor,
  Heads,
  Doc,
  Patch,
  PatchInfo,
} from "@automerge/automerge";

export type PathSegment =
  | string // Property name
  | number // Array index
  | { $id: string } // Explicit ObjectId
  | Record<string, any> // Where clause (exact match in array) (TODO: could be a predicate?)
  | [number, number] // Dynamic range (numeric indices)
  | [Cursor, Cursor]; // Stable range (cursors)

// TODO: think about how this relates to PathSegment
export type PathBuilder =
  | string
  | number
  | Record<string, any>
  | [number, number]
  | object // Direct object reference
  | DynamicSegment<any>;

export interface RefOptions {
  heads?: Heads;
}

export type DynamicSegment<T> = { __dynamic: true; value: T };

// TODO: maybe reuse a type from automerge?
export interface ChangeEvent {
  doc: Doc<any>;
  patches: Patch[];
  patchInfo: PatchInfo<any>;
}

export type ChangeCallback = (event: ChangeEvent) => void;
