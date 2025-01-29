import { DocMigration } from "@patchwork/sdk";
import { AutomergeUrl, DocHandle, Repo } from "@automerge/automerge-repo";
import { FileDoc } from "@patchwork/file";
import { next as A } from "@automerge/automerge";

type AssetsDoc = {
  files: {
    [key: string]: {
      contentType: string;
      contents: Uint8Array;
    };
  };
};

// todo fill this in properly
type OldMarkdownDoc = any;

export class EssayImageStorageMigration extends DocMigration {
  readonly description =
    "Convert image storage from assets to individual documents";

  async migrationNeedsToRun(
    handle: DocHandle<OldMarkdownDoc>,
    repo: Repo
  ): Promise<boolean> {
    const doc = handle.doc();

    // Check if document has old-style image links
    const imageRegex = /!\[([^\]]*)\]\(\.\/assets\/([^)]+)\)/;
    return imageRegex.test(doc.content);
  }

  async runMigration(
    handle: DocHandle<OldMarkdownDoc>,
    repo: Repo
  ): Promise<void> {
    console.log("Starting migration for essay");

    const doc = handle.doc();

    // Get the assets document
    const assetsUrl = doc.assetsDocUrl;
    if (!assetsUrl) {
      console.log("No assets document found, skipping migration");
      return;
    }

    const assetsHandle = await repo.find<AssetsDoc>(assetsUrl);
    const assets = assetsHandle.doc();

    console.log("Found assets document with files:", Object.keys(assets.files));

    // Find all image links in the markdown
    const imageRegex = /!\[([^\]]*)\]\(\.\/assets\/([^)]+)\)/g;
    let content = doc.content;
    let match;
    let offset = 0;

    while ((match = imageRegex.exec(content)) !== null) {
      const [fullMatch, altText, imagePath] = match;
      const imageData = assets.files[imagePath];

      if (!imageData) {
        console.warn(`Image not found in assets: ${imagePath}`);
        continue;
      }

      // Create new file document
      const fileHandle = repo.create<FileDoc>();

      // Initialize the file document
      fileHandle.change((doc) => {
        doc.name = imagePath;
        doc.mimeType = imageData.contentType;
        doc.extension = imagePath.split(".").pop() || "";
        doc.content = imageData.contents;
      });

      console.log(`Created new file document for ${imagePath}`);

      // Calculate the new positions after previous replacements
      const currentPosition = match.index + offset;
      const newImageLink = `![${altText}](./automerge/${fileHandle.documentId})`;

      // Update the essay content
      handle.change((doc) => {
        A.splice(
          doc,
          ["content"],
          currentPosition,
          fullMatch.length,
          newImageLink
        );
      });

      // Update offset for next replacement
      offset += newImageLink.length - fullMatch.length;

      console.log(`Updated image link for ${imagePath}`);
    }

    console.log("Migration completed successfully");
  }
}
