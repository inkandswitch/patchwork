import { type DataTypeImplementation } from "@patchwork/sdk";
import {
  HasVersionControlMetadata,
  initVersionControlMetadata,
} from "@patchwork/sdk/versionControl";
import { AutomergeUrl } from "@automerge/automerge-repo";
import { makeBasicContext } from "@engraft/basic-setup";
import PythonTool from "@engraft/tool-python";
import { ToolProgram } from "@engraft/hostkit";

export const engraftContext = makeBasicContext();
engraftContext.dispatcher.registerTool(PythonTool);

export type EngraftDoc = HasVersionControlMetadata<undefined, undefined> & {
  title: string;
  program: ToolProgram;
  inputUrls: AutomergeUrl[];
  outputUrl: AutomergeUrl | null;
};

export const dataType: DataTypeImplementation<EngraftDoc, unknown, unknown> = {
  init: (doc, repo) => {
    // TODO: it is bad that initialization isn't type-safe
    doc.program = engraftContext.makeSlotWithCode("");
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
