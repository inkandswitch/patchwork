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
  // TODO: this is a hack and will be factored out
  /** @internal - Skip path stabilization, path is already PathSegments */
  _skipStabilization?: boolean;
}

export type DynamicSegment<T> = { __dynamic: true; value: T };

// TODO: maybe reuse a type from automerge?
export interface ChangeEvent {
  doc: Doc<any>;
  patches: Patch[];
  patchInfo: PatchInfo<any>;
}

export type ChangeCallback = (event: ChangeEvent) => void;

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
