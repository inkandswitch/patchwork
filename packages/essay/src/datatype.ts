import { AssetsDoc } from "@/assets";
import { FileExportMethod } from "@/fileExports";
import { TextAnchor, textAnchorsAtPath } from "@/lib/textAnchors";
import { type DataType } from "@/sdk";
import { DecodedChangeWithMetadata } from "@/versionControl/groupChanges";
import {
  HasVersionControlMetadata,
  initVersionControlMetadata,
} from "@/versionControl/schema";
import { TextPatch } from "@/versionControl/utils";
import { next as A } from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";
import { splice } from "@automerge/automerge/next";
import JSZip from "jszip";
import { pick } from "lodash";

// SCHEMA

// todo: split content of document and metadata
// currently branches copy also global metadata
// unclear if comments should be part of the doc or the content
export type MarkdownDoc = HasVersionControlMetadata<TextAnchor, string> & {
  content: string;
};

// FUNCTIONS

const init = (doc: any, repo: Repo) => {
  doc.content = "# Untitled\n\n";
  doc.commentThreads = {};

  initVersionControlMetadata(doc, repo);
  const handle = repo.create<AssetsDoc>();
  handle.change((doc) => {
    doc.files = {};
  });

  doc.assetsDocUrl = handle.url;
};

// When a copy of the document has been made,
// update the title so it's more clear which one is the copy vs original.
// (this mechanism needs to be thought out more...)
const markCopy = (doc: MarkdownDoc) => {
  const firstHeadingIndex = doc.content.search(/^#\s.*$/m);
  if (firstHeadingIndex !== -1) {
    splice(doc, ["content"], firstHeadingIndex + 2, 0, "Copy of ");
  }
};

const asMarkdownFile = (doc: MarkdownDoc): Blob => {
  return new Blob([doc.content], { type: "text/markdown" });
}; // Helper to get the title of one of our markdown docs.
// looks first for yaml frontmatter from the i&s essay format;
// then looks for the first H1.

const getTitle = async (doc: MarkdownDoc) => {
  const content = doc.content;
  const frontmatterRegex = /---\n([\s\S]+?)\n---/;
  const frontmatterMatch = content.match(frontmatterRegex);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : "";

  const titleRegex = /title:\s"(.+?)"/;
  const subtitleRegex = /subtitle:\s"(.+?)"/;

  const titleMatch = frontmatter.match(titleRegex);
  const subtitleMatch = frontmatter.match(subtitleRegex);

  let title = titleMatch ? titleMatch[1] : null;
  const subtitle = subtitleMatch ? subtitleMatch[1] : "";

  // If title not found in frontmatter, find first markdown heading
  if (!title) {
    const titleFallbackRegex = /(^|\n)#\s(.+)/;
    const titleFallbackMatch = content.match(titleFallbackRegex);
    title = titleFallbackMatch ? titleFallbackMatch[2] : "Untitled";
  }

  return `${title} ${subtitle && `: ${subtitle}`}`;
};

const includeChangeInHistory = (doc: MarkdownDoc) => {
  const contentObjID = A.getObjectId(doc, "content");
  const commentsObjID = A.getObjectId(doc, "commentThreads");
  return (decodedChange: DecodedChangeWithMetadata) => {
    return decodedChange.ops.some(
      (op) => op.obj === contentObjID || op.obj === commentsObjID
    );
  };
};

const includePatchInChangeGroup = (patch: A.Patch | TextPatch) =>
  patch.path[0] === "content" || patch.path[0] === "commentThreads";

const promptForAIChangeGroupSummary = ({
  docBefore,
  docAfter,
}: {
  docBefore: MarkdownDoc;
  docAfter: MarkdownDoc;
}) => {
  return `
Summarize the changes in this diff in a few words.

Only return a few words, not a full description. No bullet points.

Here are some good examples of descriptive summaries:

wrote initial outline
changed title
small wording changes
turned outline into prose
lots of small edits
total rewrite
a few small tweaks
reworded a paragraph

## Doc before

${JSON.stringify(pick(docBefore, ["content", "commentThreads"]), null, 2)}

## Doc after

${JSON.stringify(pick(docAfter, ["content", "commentThreads"]), null, 2)}`;
};

const fileExportMethods: FileExportMethod<MarkdownDoc>[] = [
  {
    id: "markdown",
    name: "Markdown",
    export: (doc) => asMarkdownFile(doc),
    contentType: "text/markdown",
    extension: "md",
  },
  {
    id: "markdown-with-assets",
    name: "Markdown + Assets (.zip)",
    export: async (doc, repo) => {
      // export a zip file with the markdown file and the assets folder
      const assetsDoc = await repo.find<AssetsDoc>(doc.assetsDocUrl).doc();

      const zip = new JSZip();
      zip.file("index.md", doc.content);
      for (const [filename, file] of Object.entries(assetsDoc!.files)) {  // TODO: JAH strict fix
        zip.file(`assets/${filename}`, file.contents);
      }

      const uintarray = await zip.generateAsync({ type: "uint8array" });
      return new Blob([uintarray], { type: "application/zip" });
    },
    contentType: "application/zip",
    extension: "zip",
  },
];

export const markdownDataType: DataType<MarkdownDoc, TextAnchor, string> = {
  type: "patchwork:dataType",
  id: "essay",
  name: "Essay",
  icon: "Text",
  init,
  getTitle,
  markCopy,
  includeChangeInHistory,
  includePatchInChangeGroup,
  promptForAIChangeGroupSummary,
  fileExportMethods,
  ...textAnchorsAtPath(["content"]),
};
