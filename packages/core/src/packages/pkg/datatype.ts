import { type DataType } from "@patchwork/sdk";
import { HasVersionControlMetadata } from "@/os/versionControl/schema";

// SCHEMA

// todo confirm this type
type FileContents =
  | {
      contentType: string;
      contents: string;
    }
  | { [key: string]: FileContents };

type UrlSource = {
  type: "url";
  url: string;
};

type AutomergeDocSource = {
  type: "automerge";
  packageJson: any;
  files: string[];
  fileContents: { [key: string]: FileContents };
};

type PackageSource = UrlSource | AutomergeDocSource;

export type PackageDoc = HasVersionControlMetadata<never, never> & {
  title: string;
  source: PackageSource;
};

const EMPTY_SOURCE = `
import React from "react";
import {useDocument} from "@automerge/automerge-repo-react-hooks";

/*
 An example for doc:

*/

export const tool = {
  type: "patchwork:tool",
  id: "??", // todo: come up with an id
  name: "??", // todo: come up with a short name
  supportedDataTypes: "*",
  statusBarComponent: ({ docUrl }) => {
    const [doc] = useDocument(docUrl);

    // todo: implement
    console.log("Hello from sample tool", doc);

    return "TODO";
  },
};
`;

// FUNCTIONS

export const init = (doc: any) => {
  doc.title = "New Module";

  // TODO figure out what we want the empty state to look like properly
  doc.source = {
    type: "automerge",
    packageJson: {
      name: "my-package",
      version: "0.0.1",
      main: "index.js",
    },
    files: ["index.js"],
    fileContents: {
      "index.js": {
        contentType: "application/javascript",
        contents: EMPTY_SOURCE,
      },
    },
  };
};

// When a copy of the document has been made,
// update the title so it's more clear which one is the copy vs original.
// TODO: generalize this to a HasTitle schema?
export const markCopy = (doc: PackageDoc) => {
  doc.title = `Copy of ${doc.title}`;
};

export const getTitle = async (doc: any) => {
  return doc.title;
};

export const setTitle = (doc: PackageDoc, title: string) => {
  doc.title = title;
};

export const packageDataType: DataType<PackageDoc, never, never> = {
  type: "patchwork:dataType",
  id: "pkg",
  name: "Package",
  icon: "Package",
  isExperimental: true,
  init,
  getTitle,
  setTitle,
  markCopy,
};
