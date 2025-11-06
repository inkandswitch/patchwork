import { DocHandle } from "@automerge/automerge-repo";

// TODO: what are we doing here?
// Theoretically this should use automerge URLs but we're keeping it simple here
export const fileHandleToServiceWorkerUrl = (
  fileHandle: DocHandle<unknown>
) => {
  return `./automerge/${fileHandle.documentId}`;
};
