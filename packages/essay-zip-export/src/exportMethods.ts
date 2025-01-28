import { ExportMethod } from "@patchwork/sdk";
import { Doc } from "@automerge/automerge";
import { getTitle, MarkdownDoc } from "@patchwork/essay";
import { Repo, DocumentId } from "@automerge/automerge-repo";
import JSZip from "jszip";
import { FileDoc, isBinaryFileDoc } from "@patchwork/file";

const MARKDOWN_IMAGE_REGEX = /!\[(?<caption>.*?)\]\((?<url>.*?)\)/gs;

export const markdownWithImagesExport: ExportMethod = {
  id: "essay-markdown-with-images-export",
  type: "patchwork:exportMethod",
  name: "Markdown with Images (ZIP)",
  datatypeId: "essay",
  fileExtensions: ["zip"],
  async exportData(doc: Doc<unknown>, repo: Repo) {
    const markdownDoc = doc as Doc<MarkdownDoc>;
    let content = markdownDoc.content;
    const zip = new JSZip();

    // Create assets directory in the zip
    const assetsDir = zip.folder("assets")!;

    // Find all image references in the markdown
    const imageUrls = new Set<string>();
    let match;
    while ((match = MARKDOWN_IMAGE_REGEX.exec(content))) {
      const url = match.groups!.url;
      if (url.startsWith("./automerge/")) {
        imageUrls.add(url);
      }
    }

    // Load and add each image to the zip
    const urlToFilename = new Map<string, string>();
    for (const url of imageUrls) {
      const docId = url.split("/")[2] as DocumentId; // ./automerge/<docId>
      const imageDoc = (await repo.find(docId).doc()) as Doc<FileDoc>;

      if (!imageDoc || !isBinaryFileDoc(imageDoc)) {
        console.warn(`Skipping invalid image: ${url}`);
        continue;
      }

      const filename = imageDoc.name;
      urlToFilename.set(url, filename);
      assetsDir.file(filename, imageDoc.content);
    }

    // Replace image URLs in the markdown content
    content = content.replace(
      MARKDOWN_IMAGE_REGEX,
      (match: string, caption: string, url: string) => {
        if (urlToFilename.has(url)) {
          return `![${caption}](./assets/${urlToFilename.get(url)})`;
        }
        return match; // Keep external URLs unchanged
      }
    );

    // Add the markdown file to the zip
    const prefix = markdownDoc.fileName ?? (await getTitle(markdownDoc));
    const extension = markdownDoc.extension ?? "md";
    const hasExtensionAlready = /\.[a-z0-9]+$/.test(prefix);
    const fileName = hasExtensionAlready ? prefix : `${prefix}.${extension}`;
    zip.file(fileName, content);

    // Generate the zip file
    const blob = await zip.generateAsync({ type: "blob" });
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    return new File([blob], `${fileNameWithoutExt}.zip`, {
      type: "application/zip",
    });
  },
};
