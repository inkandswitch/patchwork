import { TextAnchor, textAnchorsAtPath } from "@patchwork/sdk/textAnchors";
import { type DataTypeImplementation, initFrom } from "@patchwork/sdk";
import { DecodedChangeWithMetadata } from "@patchwork/sdk/versionControl";
import {
  HasVersionControlMetadata,
  initVersionControlMetadata,
} from "@patchwork/sdk/versionControl";
import { TextPatch } from "@patchwork/sdk/versionControl";
import { next as A } from "@automerge/automerge";
import { Repo } from "@automerge/automerge-repo";
import { pick } from "lodash";
import { EssayImageStorageMigration } from "./migrations/EssayImageStorageMigration";

// SCHEMA

// todo: split content of document and metadata
// currently branches copy also global metadata
// unclear if comments should be part of the doc or the content
export type MarkdownDoc = HasVersionControlMetadata<TextAnchor, string> & {
  content: string;

  // the following optional fields allow for higher fidelity import/exports
  fileName?: string;
  extension?: string;
  mimeType?: string;
};

// FUNCTIONS

const init = (doc: any, repo: Repo) => {
  doc.content = "# Untitled\n\n";
  doc.commentThreads = {};

  initVersionControlMetadata(doc, repo);
};

// When a copy of the document has been made,
// update the title so it's more clear which one is the copy vs original.
// (this mechanism needs to be thought out more...)
const markCopy = (doc: MarkdownDoc) => {
  const firstHeadingIndex = doc.content.search(/^#\s.*$/m);
  if (firstHeadingIndex !== -1) {
    A.splice(doc, ["content"], firstHeadingIndex + 2, 0, "Copy of ");
  }
};

// Helper to get the title of one of our markdown docs.
// looks first for yaml frontmatter from the i&s essay format;
// then looks for the first H1.
export const getTitle = async (doc: MarkdownDoc) => {
  if (doc.fileName) {
    return doc.fileName;
  }

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

  return `${title}${subtitle && `: ${subtitle}`}`;
};

const includeChangeInHistory = (doc: MarkdownDoc) => {
  const contentObjID = A.getObjectId(doc, "content");
  // filter out comment changes for now because we don't show them in the history
  // const commentsObjID = A.getObjectId(doc, "commentThreads");
  return (decodedChange: DecodedChangeWithMetadata) => {
    return decodedChange.ops.some(
      (op) => op.obj === contentObjID //|| op.obj === commentsObjID
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

export const dataType: DataTypeImplementation<MarkdownDoc, TextAnchor, string> =
  {
    init,
    getTitle,
    markCopy,
    includeChangeInHistory,
    includePatchInChangeGroup,
    promptForAIChangeGroupSummary,
    ...textAnchorsAtPath(["content"]),

    // TODO: eventually we will want to decouple migrations more from data types.
    // You should be able to register migrations as a "trait implementation"
    // and then associate them with specific data types.
    migrations: [new EssayImageStorageMigration()],
  };
