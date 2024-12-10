import * as Automerge from "@automerge/automerge";
import { HasVersionControlMetadata } from "@patchwork/sdk/versionControl";
import { type DataType } from "@patchwork/sdk";
import { AutomergeUrl } from "@automerge/automerge-repo";

// SCHEMA

/**
 * A document at some particular heads, with path included for
 * debugging / visualization.
 */
export interface Reference {
  docUrl: AutomergeUrl;
  heads: Automerge.Heads;
  path: string;
}

/**
 * A reusable specification for a build run.
 */
export type BuildRunSpec = {
  command: string;
  autoDeps: Record<"stdoutDeclared" | "latex", boolean>;
  explicitInputs: string[];
  explicitOutputs: string[];
  name?: string;
};

/**
 * A specific build run that happened at a specific time with
 * specific inputs and outputs.
 */
export type BuildRun = {
  id: string;
  spec: BuildRunSpec;
  inputs: Reference[];
  outputs: Reference[];
  timestamp: number;
  duration: number;
};

/**
 * The state of a build run that was stale when a refresh was
 * requested. It will be updated as the refresh progresses.
 */
export type BuildRunRefreshState = {
  id: string;
  spec: BuildRunSpec;
  progress: "waiting" | "running" | "done";
  log: string[];
};

// todo: think about error handling and more detailed update reporting

/**
 * Jacquard-project-level state used for refresh-system
 * communication: Has someone requested a refresh? Is someone
 * processing a refresh? Read from & written to by both Patchwork and
 * the CLI.
 */
export type RefreshState =
  | { type: "idle" }
  | { type: "requesting" }
  | {
      type: "processing";
      processorHostname: string;
      processorHeartbeat: number;
      /** "null" here means "we're processing, but don't know what yet" */
      buildRunRefreshStates: BuildRunRefreshState[] | null;
    };

/**
 * The document stored in Patchwork to keep track of build runs,
 * refresh status, etc.
 */
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

export const dataType: DataType<JacquardBuildMetadata, never, string> = {
  type: "patchwork:dataType",
  id: "jacquard-build-metadata",
  name: "Jacquard Build Metadata",
  icon: "Microscope",

  init,
  getTitle,
  setTitle,
  markCopy,
};
