import type * as Automerge from "@automerge/automerge";
import type { DocHandle } from "@automerge/automerge-repo";

// ---- Core Types ----

export type PathSegment =
  | string // Property name
  | number // Array index (or ObjectId lookup)
  | { $id: string } // Explicit ObjectId
  | Record<string, any> // Where clause (exact match in array)
  | [number, number] // Dynamic range (numeric indices)
  | [Automerge.Cursor, Automerge.Cursor]; // Stable range (cursors)

export interface RefOptions {
  heads?: Automerge.Heads;
}

// ---- Dynamic Segment Marker ----

export type DynamicSegment<T> = { __dynamic: true; value: T };

// ---- Event Types ----

export interface ChangeEvent {
  doc: Automerge.Doc<any>;
  patches: Automerge.Patch[];
  patchInfo: Automerge.PatchInfo<any>;
}

export type ChangeCallback = (event: ChangeEvent) => void;

// ---- Path Builder Types (used in ref() factory) ----

export type PathBuilder =
  | string
  | number
  | Record<string, any>
  | [number, number]
  | object // Direct object reference
  | DynamicSegment<any>;
