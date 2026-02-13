import type { DocHandle, Repo } from "@automerge/automerge-repo";
import type { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem";
import type { HistoryGroupingsDoc } from "../types";

/**
 * Get or create the groupings document for a source document
 *
 * @param repo - The Automerge repository
 * @param sourceHandle - Handle to the source document
 * @returns Handle to the groupings document
 */
export async function getOrCreateGroupingsDoc(
  repo: Repo,
  sourceHandle: DocHandle<HasPatchworkMetadata>
): Promise<DocHandle<HistoryGroupingsDoc>> {
  const sourceDoc = sourceHandle.doc();
  if (!sourceDoc) {
    throw new Error("Source document not available");
  }

  // Check if groupings document already exists
  const existingUrl = sourceDoc["@patchwork"]?.history;

  if (existingUrl) {
    // Groupings document already exists
    // useDocument in the component will handle loading it reactively
    // Just return a handle for immediate use
    try {
      const handle = await repo.find<HistoryGroupingsDoc>(existingUrl);
      await handle.whenReady();
      return handle;
    } catch (error) {
      console.error("Error loading existing groupings document:", error);
      // Fall through to create new one
    }
  }

  // Create new groupings document
  const groupingsHandle = await repo.create2<
    HistoryGroupingsDoc & HasPatchworkMetadata
  >({
    ["@patchwork"]: { type: "patchwork:history-change-groups" },
    version: 1,
    sourceDocumentUrl: sourceHandle.url,
    groupings: {},
  });

  // Update source document with reference to groupings document
  sourceHandle.change((doc) => {
    if (!doc["@patchwork"]) {
      // TODO: find a better way to handle the missing metadata case and unknown type
      doc["@patchwork"] = { type: "unknown" };
    }
    doc["@patchwork"].history = groupingsHandle.url;
  });

  return groupingsHandle;
}

/**
 * Check if two heads arrays are equal (order-independent)
 *
 * @param heads1 - First heads array
 * @param heads2 - Second heads array
 * @returns true if equal, false otherwise
 */
export function headsEqual(heads1: string[], heads2: string[]): boolean {
  if (heads1.length !== heads2.length) {
    return false;
  }

  return heads1.every((h) => heads2.includes(h));
}
