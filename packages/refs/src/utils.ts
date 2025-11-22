import * as Automerge from "@automerge/automerge";

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
