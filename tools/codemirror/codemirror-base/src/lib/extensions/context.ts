/**
 * Shared types for CodeMirror editor context.
 */

import type { DocHandle } from "@automerge/automerge-repo";

/**
 * Context provided to CodeMirror extensions.
 */
export interface EditorContext {
  /** The Automerge document handle being edited */
  handle: DocHandle<unknown>;
  /** The path within the document to the text content */
  path: string[];
}
