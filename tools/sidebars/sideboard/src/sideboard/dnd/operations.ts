import type { DocHandle, Repo, AutomergeUrl } from "@automerge/automerge-repo";
import type { FolderDoc, DocLink } from "@inkandswitch/patchwork-filesystem";
import { deleteAt } from "@automerge/automerge-repo";

// Track loaded folders to prevent memory leaks
const folderCache = new Map<AutomergeUrl, DocHandle<FolderDoc>>();

// Maximum folder nesting depth to prevent stack overflow
const MAX_FOLDER_DEPTH = 20;

// Helper to extract plain data from Automerge proxy objects
// structuredClone doesn't work with Automerge proxies - they contain
// internal symbols and proxies that cannot be cloned
function extractPlainDocLink(docLink: DocLink): DocLink {
  // Explicitly copy only the serializable properties
  const plain: DocLink = {
    url: docLink.url,
    name: docLink.name,
    type: docLink.type,
  };
  return plain;
}

export interface DropOperation {
  draggedIds: string[];
  draggedUrls: AutomergeUrl[];
  targetId: string;
  position: "above" | "below" | "inside";
  sourceToolId: string;
  copyMode: boolean;
}

interface ItemLocation {
  url: AutomergeUrl;
  folderUrl: AutomergeUrl;
  folderPath: number[];
  index: number;
  item: DocLink;
}

interface ItemLocations {
  sourceItems: ItemLocation[];
  targetFolder: AutomergeUrl;
  targetFolderPath: number[];
  targetIndex: number;
}

export async function executeDrop(
  operation: DropOperation,
  repo: Repo,
  rootFolderHandle: DocHandle<FolderDoc>,
  toolId: string
) {
  console.log("[DnD] executeDrop called with:", {
    draggedIds: operation.draggedIds,
    targetId: operation.targetId,
    position: operation.position,
    copyMode: operation.copyMode,
    sourceToolId: operation.sourceToolId,
  });

  // 1. Validate source - only accept drops from the same tool instance
  if (operation.sourceToolId !== toolId) {
    console.warn(
      "[DnD] Drop from external source not yet supported:",
      operation.sourceToolId,
      "expected:",
      toolId
    );
    return;
  }

  // 2. Validate we have items to drop
  if (operation.draggedIds.length === 0 || operation.draggedUrls.length === 0) {
    console.error("[DnD] No items to drop");
    return;
  }

  console.log("[DnD] Starting location finding...");

  // 3. Find source and target locations
  const locations = await findItemLocations(
    rootFolderHandle,
    operation.draggedUrls,
    operation.targetId,
    repo,
    operation.position
  );

  if (!locations) {
    console.error(
      "[DnD] Could not find source or target locations. Target:",
      operation.targetId
    );
    return;
  }

  console.log("[DnD] Locations found:", {
    sourceItemsCount: locations.sourceItems.length,
    targetFolder: locations.targetFolder,
    targetIndex: locations.targetIndex,
  });

  // 4. Validate drop is legal (no circular references, etc)
  console.log("[DnD] Validating drop...");
  const validationError = getDropValidationError(locations, operation);
  if (validationError) {
    console.error("[DnD] Invalid drop operation:", validationError);
    return;
  }

  console.log("[DnD] Validation passed, executing operation...");

  // 5. Execute the move or copy
  if (operation.copyMode) {
    await performCopy(rootFolderHandle, locations, operation, repo);
  } else {
    await performMove(rootFolderHandle, locations, operation);
  }

  console.log("[DnD] Operation complete!");
}

async function findItemLocations(
  rootFolderHandle: DocHandle<FolderDoc>,
  draggedUrls: AutomergeUrl[],
  targetId: string,
  repo: Repo,
  position: "above" | "below" | "inside"
): Promise<ItemLocations | null> {
  const rootFolder = rootFolderHandle.doc();
  if (!rootFolder) return null;

  const sourceItems: ItemLocation[] = [];
  let targetFolder: AutomergeUrl | null = null;
  let targetFolderPath: number[] | null = null;
  let targetIndex = 0;

  // Track visited folders to prevent infinite recursion
  const visitedFolders = new Set<AutomergeUrl>();

  // Helper to traverse folder tree recursively
  async function traverse(
    folderUrl: AutomergeUrl,
    docs: DocLink[] | undefined,
    path: number[],
    depth: number = 0
  ): Promise<void> {
    if (!docs) return;

    // Prevent infinite recursion with depth limit
    if (depth >= MAX_FOLDER_DEPTH) {
      console.warn(
        `[DnD] Max folder depth (${MAX_FOLDER_DEPTH}) reached, stopping traversal`
      );
      return;
    }

    // Mark this folder as visited
    visitedFolders.add(folderUrl);

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];

      // Check if this is a dragged item
      if (draggedUrls.includes(doc.url)) {
        sourceItems.push({
          url: doc.url,
          folderUrl,
          folderPath: [...path],
          index: i,
          item: doc,
        });
      }

      // Check if this is the target
      const itemId = folderUrl + "/" + i;
      if (itemId === targetId) {
        targetFolder = folderUrl;
        targetFolderPath = [...path];
        targetIndex = i;
      }

      // Check if folder URL matches targetId for above/below/inside positions
      if (doc.type === "folder" && doc.url === targetId) {
        if (position === "above" || position === "below") {
          // Dropping above or below the folder - target is the parent folder
          targetFolder = folderUrl;
          targetFolderPath = [...path];
          targetIndex = i;
        } else if (position === "inside") {
          // Dropping inside the folder - target is the folder itself
          targetFolder = doc.url;
          targetFolderPath = [...path, i];
          targetIndex = 0; // Drop at start of folder
        }
      }

      // Recurse into folders to find nested items
      if (doc.type === "folder" && doc.url) {
        // Skip if folder references itself (only skip recursion, not target matching above)
        if (doc.url === folderUrl) {
          console.warn("[DnD] Skipping self-referencing folder:", doc.url);
          continue;
        }

        // Skip if we've already visited this folder (prevent circular refs)
        if (visitedFolders.has(doc.url)) {
          console.warn("[DnD] Skipping already visited folder:", doc.url);
          continue;
        }

        const nestedPath = [...path, i];

        // Load the nested folder if not cached
        let nestedHandle = folderCache.get(doc.url);
        if (!nestedHandle) {
          try {
            nestedHandle = await repo.find<FolderDoc>(doc.url);
            folderCache.set(doc.url, nestedHandle);
          } catch (error) {
            console.error("[DnD] Failed to load folder:", doc.url, error);
            continue;
          }
        }

        const nestedFolder = nestedHandle?.doc();
        if (nestedFolder?.docs) {
          await traverse(doc.url, nestedFolder.docs, nestedPath, depth + 1);
        }
      }
    }
  }

  // Start traversal from root
  if (rootFolder.docs) {
    await traverse(rootFolderHandle.url, rootFolder.docs, [], 0);
  }

  // If target is the root folder URL (dropping inside root), set target to root
  if (targetId === rootFolderHandle.url && position === "inside") {
    targetFolder = rootFolderHandle.url;
    targetFolderPath = [];
    targetIndex = 0;
  }

  if (!targetFolder || !targetFolderPath || sourceItems.length === 0) {
    return null;
  }

  return {
    sourceItems,
    targetFolder,
    targetFolderPath,
    targetIndex,
  };
}

function getDropValidationError(
  locations: ItemLocations,
  operation: DropOperation
): string | null {
  // Check if dropping onto itself
  for (const sourceItem of locations.sourceItems) {
    const sourceId = sourceItem.folderUrl + "/" + sourceItem.index;

    // Prevent dropping item onto itself
    if (sourceId === operation.targetId) {
      return `Cannot drop item onto itself (${sourceItem.item.name})`;
    }

    // Prevent dropping item into its current position
    if (
      sourceItem.folderUrl === locations.targetFolder &&
      operation.position === "inside" &&
      !operation.copyMode
    ) {
      return `Item is already in this folder (${sourceItem.item.name})`;
    }

    // Check if trying to drop folder into itself
    if (
      sourceItem.item.type === "folder" &&
      sourceItem.url === locations.targetFolder
    ) {
      return `Cannot drop folder into itself (${sourceItem.item.name})`;
    }

    // Check if dropping folder into its descendants (circular reference prevention)
    if (sourceItem.item.type === "folder") {
      const isDescendant = isDescendantFolder(
        sourceItem.url,
        locations.targetFolder
      );
      if (isDescendant) {
        return `Cannot drop folder into its own descendant (${sourceItem.item.name})`;
      }
    }
  }

  return null;
}

// Helper to check if targetFolder is a descendant of potentialAncestor
function isDescendantFolder(
  potentialAncestor: AutomergeUrl,
  targetFolder: AutomergeUrl
): boolean {
  if (potentialAncestor === targetFolder) {
    return true;
  }

  // Check cached folder for descendants
  const ancestorHandle = folderCache.get(potentialAncestor);
  if (!ancestorHandle) return false;

  const ancestorDoc = ancestorHandle.doc();
  if (!ancestorDoc?.docs) return false;

  // Recursively check all subfolders
  for (const doc of ancestorDoc.docs) {
    if (doc.type === "folder" && doc.url) {
      if (doc.url === targetFolder) {
        return true;
      }
      if (isDescendantFolder(doc.url, targetFolder)) {
        return true;
      }
    }
  }

  return false;
}

async function performMove(
  rootFolderHandle: DocHandle<FolderDoc>,
  locations: ItemLocations,
  operation: DropOperation
) {
  console.log(
    `[DnD] Moving ${locations.sourceItems.length} item(s) to position:`,
    operation.position
  );

  // Group sources by folder for efficient removal
  const sourcesByFolder = new Map<AutomergeUrl, ItemLocation[]>();
  for (const source of locations.sourceItems) {
    const sources = sourcesByFolder.get(source.folderUrl) || [];
    sources.push(source);
    sourcesByFolder.set(source.folderUrl, sources);
  }

  // Remove items from source folders (process each folder once)
  const removedItems: DocLink[] = [];
  for (const [folderUrl, sources] of sourcesByFolder) {
    // Sort by index descending to remove from end first (preserves indices)
    const sorted = [...sources].sort((a, b) => b.index - a.index);

    if (folderUrl === rootFolderHandle.url) {
      // Root level - can modify directly
      rootFolderHandle.change((doc) => {
        for (const source of sorted) {
          const item = extractPlainDocLink(doc.docs[source.index]);
          removedItems.unshift(item);
          deleteAt(doc.docs, source.index);
        }
      });
    } else {
      // Nested folder - need to load and modify
      const folderHandle = folderCache.get(folderUrl);
      if (folderHandle) {
        folderHandle.change((doc) => {
          for (const source of sorted) {
            const item = extractPlainDocLink(doc.docs[source.index]);
            removedItems.unshift(item);
            deleteAt(doc.docs, source.index);
          }
        });
      }
    }
  }

  // Calculate target index (adjust if moving within same folder)
  let finalTargetIndex = locations.targetIndex;

  const sourcesInTargetFolder = sourcesByFolder.get(locations.targetFolder);
  if (sourcesInTargetFolder) {
    // Moving within same folder - adjust for removed items
    const removedBefore = sourcesInTargetFolder.filter(
      (s) => s.index < locations.targetIndex
    ).length;
    finalTargetIndex -= removedBefore;
  }

  // Adjust based on position
  if (operation.position === "above") {
    // Insert before target
  } else if (operation.position === "below") {
    // Insert after target
    finalTargetIndex++;
  } else if (operation.position === "inside") {
    // Insert at beginning of folder
    finalTargetIndex = 0;
  }

  // Insert items at target location
  if (locations.targetFolder === rootFolderHandle.url) {
    // Root level
    rootFolderHandle.change((doc) => {
      doc.docs.splice(finalTargetIndex, 0, ...removedItems);
    });
  } else {
    // Nested folder
    const targetHandle = folderCache.get(locations.targetFolder);
    if (targetHandle) {
      targetHandle.change((doc) => {
        doc.docs.splice(finalTargetIndex, 0, ...removedItems);
      });
    }
  }
}

async function performCopy(
  rootFolderHandle: DocHandle<FolderDoc>,
  locations: ItemLocations,
  operation: DropOperation,
  _repo: Repo
) {
  console.log(
    `[DnD] Copying ${locations.sourceItems.length} item(s) to position:`,
    operation.position
  );

  // Collect items to copy from their source folders
  const itemsToCopy: DocLink[] = [];

  for (const source of locations.sourceItems) {
    let item: DocLink | undefined;

    if (source.folderUrl === rootFolderHandle.url) {
      // Root level
      const doc = rootFolderHandle.doc();
      if (doc?.docs) {
        item = doc.docs[source.index];
      }
    } else {
      // Nested folder
      const folderHandle = folderCache.get(source.folderUrl);
      const doc = folderHandle?.doc();
      if (doc?.docs) {
        item = doc.docs[source.index];
      }
    }

    if (item) {
      const clonedItem = extractPlainDocLink(item);
      clonedItem.name = item.name;
      itemsToCopy.push(clonedItem);
    }
  }

  // Calculate target index
  let finalTargetIndex = locations.targetIndex;

  if (operation.position === "above") {
    // Insert before target
  } else if (operation.position === "below") {
    // Insert after target
    finalTargetIndex++;
  } else if (operation.position === "inside") {
    // Insert at beginning of folder
    finalTargetIndex = 0;
  }

  // Insert copied items at target location
  if (locations.targetFolder === rootFolderHandle.url) {
    // Root level
    rootFolderHandle.change((doc) => {
      doc.docs.splice(finalTargetIndex, 0, ...itemsToCopy);
    });
  } else {
    // Nested folder
    const targetHandle = folderCache.get(locations.targetFolder);
    if (targetHandle) {
      targetHandle.change((doc) => {
        doc.docs.splice(finalTargetIndex, 0, ...itemsToCopy);
      });
    }
  }
}
