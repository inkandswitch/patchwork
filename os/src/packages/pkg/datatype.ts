import { type DataType } from "@/sdk";
import { HasVersionControlMetadata } from "@/versionControl/schema";

// SCHEMA

export type FileEntry = {
  contentType: string;
  contents: string | Uint8Array;
};

export type FileSystem = {
  [name: string]: FileEntry | FileSystem;
};

export type PackageDoc = HasVersionControlMetadata<never, never> & {
  title: string;
  packageJSON: any;
  fileContents: FileSystem;
};

const EMPTY_SOURCE = `import React from "react";
import {useDocument} from "@automerge/automerge-repo-react-hooks";

export const tool = {
  type: "patchwork:tool",
  id: "??",
  name: "??",
  supportedDataTypes: "*",
  statusBarComponent: ({ docUrl }) => {
    const [doc] = useDocument(docUrl);

    return "TODO";
  },
};
`;

// FUNCTIONS

export const init = (doc: PackageDoc) => {
  doc.title = "New Package";

  // todo: figure out what we want the empty state to look like properly

  doc.packageJSON = {
    type: "module",
    name: "my-package",
    description: "",
    version: "0.0.1",
    main: "index.js",
    files: ["index.js"],
  };

  doc.fileContents = {
    "index.js": {
      contentType: "application/javascript",
      contents: EMPTY_SOURCE,
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
