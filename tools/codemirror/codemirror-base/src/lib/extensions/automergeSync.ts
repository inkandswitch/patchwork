/** CodeMirror */
import type { Extension } from "@codemirror/state";

/** Automerge */
import { automergeSyncPlugin } from "@automerge/automerge-codemirror";
import type { Prop as AutomergeProp } from "@automerge/automerge";
import type { DocHandle } from "@automerge/automerge-repo";

export interface SyncExtensionConfig {
  handle: DocHandle<unknown>;
  path: AutomergeProp[];
}

/**
 * Creates the Automerge sync extension.
 * Pass handle and path directly - no magic context lookup.
 */
export function createSyncExtension(config: SyncExtensionConfig): Extension {
  const { handle, path } = config;

  // The automergeSyncPlugin handles initial content population itself
  return automergeSyncPlugin({
    handle: handle as any,
    path: path as AutomergeProp[],
  });
}
