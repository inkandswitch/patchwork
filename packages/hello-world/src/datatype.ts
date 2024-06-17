import { DataType } from "@patchwork/core";
import { HasVersionControlMetadata } from "@patchwork/core";
import { Repo } from "@automerge/automerge-repo";

// SCHEMA
export type HelloWorldDoc = HasVersionControlMetadata<never, never> & {
  message: string;
};

// FUNCTIONS
export const helloWorldDatatype: DataType<HelloWorldDoc, never, never> = {
  type: "patchwork:dataType",
  id: "helloWorld",
  name: "Hello World",
  isExperimental: true,
  icon: "👋",
  init: (doc: any, repo: Repo) => {
    doc.message = "Hello, world!";
  },
  getTitle: async (doc: any, repo: Repo) => {},
  markCopy: () => {},
};
