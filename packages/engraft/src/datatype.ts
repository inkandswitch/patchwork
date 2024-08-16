import { type DataType } from "@/sdk";
import {
  HasVersionControlMetadata,
  initVersionControlMetadata,
} from "@/versionControl/schema";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { makeFancyContext } from "@engraft/fancy-setup";
import { ToolProgram } from "@engraft/hostkit";

const context = makeFancyContext();

export type EngraftDoc = HasVersionControlMetadata<undefined, undefined> & {
  title: string;
  program: ToolProgram;
  inputUrls: AutomergeUrl[];
  outputUrl: AutomergeUrl | null;
};

export const engraftDataType: DataType<EngraftDoc, unknown, unknown> = {
  type: "patchwork:dataType",
  id: "engraft",
  name: "Engraft program",
  icon: "Sprout",
  init: (doc, repo) => {
    // TODO: it is bad that initialization isn't type-safe
    doc.program = context.makeSlotWithCode("");
    doc.title = "Untitled Engraft Program";
    doc.inputUrls = [];
    doc.outputUrl = null;
    initVersionControlMetadata(doc, repo);
  },
  getTitle: async (doc) => {
    return doc.title;
  },
  setTitle: async (doc, title) => {
    doc.title = title;
  },
  markCopy: (doc) => {
    doc.title = "Copy of " + doc.title;
  },
};
