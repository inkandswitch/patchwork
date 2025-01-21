import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { type DataTypeImplementation, initFrom } from "@patchwork/sdk";
import { type TestSuite } from "./tester/types";

// SCHEMA
export type Doc = HasVersionControlMetadata<unknown, unknown> & {
  title: string;
  grammar: string;
  example: string;
  exampleArgs: string;
  semantics: string;
  semanticsName: string;
  testSuite: TestSuite;
};

// FUNCTIONS
export const markCopy = (doc: Doc) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: Doc, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: Doc) => {
  return doc.title || "Ohm Grammar";
};

export const init = (doc: Doc) => {
  initFrom(doc, {
    title: "Untitled Ohm Grammar",
    grammar: "",
    example: "",
    exampleArgs: "{}",
    // TODO: these should be moved to their own subdocument so we can reuse grammars and have multiple semantics
    semantics: "",
    semanticsName: "eval",
    testSuite: {
      cases: [],
      metadata: {
        description: "Test suite for grammar",
        tags: [],
      },
    },
  });
};

export const dataType: DataTypeImplementation<Doc, unknown> = {
  init,
  getTitle,
  setTitle,
  markCopy,
};
