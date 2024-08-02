import * as Automerge from "@automerge/automerge";
import { HasVersionControlMetadata } from "@/versionControl/schema";
import { type DataType } from "@/sdk";
import { Heads } from "@automerge/automerge/next";
import { AutomergeUrl } from "@automerge/automerge-repo";

// SCHEMA

export interface Reference {
  docUrl: AutomergeUrl;
  heads: Automerge.Heads;
  path: string;
}

export type BuildRunSpec = {
  command: string;
  autoDeps: Record<"stdoutDeclared" | "latex", boolean>;
  explicitInputs: string[];
  explicitOutputs: string[];
};

export type BuildRun = {
  id: string;
  spec: BuildRunSpec;
  inputs: Reference[];
  outputs: Reference[];
  timestamp: number;
  duration: number;
};

export type BuildRunWithProgress = Omit<BuildRun, "timestamp"> & {
  progress: "waiting" | "running" | "done";
  log: string[];
};

// todo: think about error handling and more detailed update reporting

type RefreshState =
  | { type: "idle" }
  | { type: "requesting" }
  | {
      type: "processing";
      processorHostname: string;
      processorHeartbeat: number;
      /** "null" here means "we're processing, but don't know what yet" */
      buildRuns: BuildRunWithProgress[] | null;
    };

export type JacquardBuildMetadata = HasVersionControlMetadata<
  unknown,
  unknown
> & {
  title: string;
  buildRuns: BuildRun[];
  refreshState: RefreshState;
  projectFolderUrl: AutomergeUrl;
};

// FUNCTIONS

// When a copy of the document has been made,
// update the title so it's more clear which one is the copy vs original.
// (this mechanism needs to be thought out more...)
export const markCopy = (doc: JacquardBuildMetadata) => {
  doc.title = "Copy of " + doc.title;
};

const setTitle = async (doc: JacquardBuildMetadata, title: string) => {
  doc.title = title;
};

const getTitle = async (doc: JacquardBuildMetadata) => {
  return doc.title || "Untitled Build Metadata";
};

export const init = (doc: any) => {
  doc.title = "Untitled Project";
  doc.fileContents = {};
  doc.buildRuns = [];
};

export const jacquardBuildMetadataDatatype: DataType<
  JacquardBuildMetadata,
  never,
  string
> = {
  type: "patchwork:dataType",
  id: "jacquard-build-metadata",
  name: "Jacquard Build Metadata",
  icon: "Microscope",
  isExperimental: false, // TODO set true before merging?

  init,
  getTitle,
  setTitle,
  markCopy,
};
