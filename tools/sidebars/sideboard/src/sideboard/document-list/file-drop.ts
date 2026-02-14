import type { Repo, DocHandle } from "@automerge/automerge-repo";
import type {
  FolderDoc,
  UnixFileEntry,
} from "@inkandswitch/patchwork-filesystem";
import { log } from "../dnd/debug.ts";

/**
 * Handles file drops from the operating system by creating UnixFileEntry documents
 * and adding them to the specified folder.
 */
export async function handleFilesDrop(
  files: FileList,
  folderHandle: DocHandle<FolderDoc>,
  repo: Repo
): Promise<void> {
  for (const file of Array.from(files)) {
    try {
      // Read file content
      const arrayBuffer = await file.arrayBuffer();
      const content = new Uint8Array(arrayBuffer);

      // Extract extension from filename
      const nameParts = file.name.split(".");
      const extension = nameParts.length > 1 ? nameParts.pop()! : "";
      const nameWithoutExt = nameParts.join(".");

      // Create UnixFileEntry document
      const handle = await repo.create<UnixFileEntry>({
        content,
        extension,
        mimeType: file.type || "application/octet-stream",
        name: nameWithoutExt,
      });

      // Add to folder
      folderHandle.change((folder) => {
        folder.docs.push({
          url: handle.url,
          name: file.name,
          type: "file",
        });
      });

      log("FileDrop: Created file document:", file.name, handle.url);
    } catch (error) {
      log("FileDrop: Failed to create file document:", error);
    }
  }
}
