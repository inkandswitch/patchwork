import { DocMigration } from "@patchwork/sdk";
import { DocHandle, Repo } from "@automerge/automerge-repo";
import { updateDocFromFile } from "@patchwork/sdk/files";

type OldLinkFileDoc = {
  content: {
    type: "link";
    url: string;
  };
  name: string;
  type: string;
};

export class DeprecateLinkType extends DocMigration {
  readonly description =
    "Convert link-type files to regular files with content";

  async migrationNeedsToRun(
    handle: DocHandle<OldLinkFileDoc>,
    repo: Repo
  ): Promise<boolean> {
    const doc = handle.doc();

    // Check if document has old-style link content
    return doc.content?.type === "link";
  }

  async runMigration(
    handle: DocHandle<OldLinkFileDoc>,
    repo: Repo
  ): Promise<void> {
    console.log("Starting migration for file");

    const doc = handle.doc();

    // Get the URL from the old document
    const url = doc.content.url;
    if (!url) {
      console.warn("No URL found in link document, skipping migration");
      return;
    }

    try {
      // Download the file contents
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      // Create a File object from the downloaded content
      const blob = await response.blob();
      const file = new File([blob], doc.name, {
        type: response.headers.get("content-type") || undefined,
      });

      // Use the existing updateDocFromFile function to update the document
      await updateDocFromFile(file, handle);

      console.log("Migration completed successfully");
    } catch (error) {
      console.error("Error during file migration:", error);
      throw error;
    }
  }
}
