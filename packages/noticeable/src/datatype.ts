import { next as Automerge } from "@automerge/automerge";
import { DataTypeImplementation } from "@patchwork/sdk";
import { initVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { FileDoc } from "../../file/src/datatype";

// TODO: for convenience we use FileDoc as the type so we can reuse
// the TextFileEditor; not great
export type NoticeableDoc = FileDoc;

export const dataType: DataTypeImplementation<NoticeableDoc, unknown, unknown> =
  {
    init: (doc, repo) => {
      doc.name = "doesn't matter";
      doc.mimeType = "application/javascript";
      doc.extension = ".js";
      doc.content = {
        type: "text",
        value: "// # My Notebook\n\n",
      };
      initVersionControlMetadata(doc, repo);
    },
    getTitle,
    markCopy,
  };

// TODO: this is kinda strict cuz I want "markCopy" to work and I'm lazy
const titleRegex = /^\/\/\s#\s(.+)/m;

export function getContent(doc: NoticeableDoc) {
  if (doc.content.type === "text") {
    return doc.content.value;
  } else {
    throw new Error(
      `Unsupported content type for notebook: ${doc.content.type}`
    );
  }
}

async function getTitle(doc: NoticeableDoc) {
  const titleMatch = getContent(doc).match(titleRegex);
  const title = titleMatch ? titleMatch[1] : "Untitled";
  return title;
}

function markCopy(doc: NoticeableDoc) {
  const titleMatch = getContent(doc).search(titleRegex);
  if (titleMatch !== -1) {
    Automerge.splice(doc, ["content", "value"], titleMatch + 5, 0, "Copy of ");
  }
}
