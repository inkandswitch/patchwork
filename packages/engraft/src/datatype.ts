import { type DataType } from "@/sdk";
import {
  HasVersionControlMetadata,
  initVersionControlMetadata,
} from "@/versionControl/schema";
import { ToolProgram } from "@engraft/hostkit";

export type EngraftDoc = HasVersionControlMetadata<undefined, undefined> & {
  program: ToolProgram | null;
};

export const engraftDataType: DataType<EngraftDoc, unknown, unknown> = {
  type: "patchwork:dataType",
  id: "engraft",
  name: "Engraft",
  icon: "Text", // TODO
  init: (doc, repo) => {
    doc.program = null;
    initVersionControlMetadata(doc, repo);
  },
  getTitle: async (doc) => {
    // TODO
    return "Untitled Engraft Program";
  },
  markCopy: (doc) => {
    // TODO
  },
};
